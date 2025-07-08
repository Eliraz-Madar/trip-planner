import axios from 'axios';
import polyline from '@mapbox/polyline';
import L from 'leaflet';

/**
 * Validates a location name by converting it to coordinates
 * @param {string} location - The location name to validate
 * @returns {Promise<Object|null>} - The validated location data or null if invalid
 */
export const validateLocation = async (location) => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: location, format: 'json', limit: 1 }
    });
    return response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error validating location:', error);
    return null;
  }
};

/**
 * Plans a route between two locations based on trip type and preferences
 * @param {Object} params - Route planning parameters
 * @returns {Promise<Object>} - The route data
 */
export const planRoute = async ({ 
  startLocation, 
  endLocation, 
  tripType, 
  routePreference, 
  isCircular,
  maxDistancePerDay
}) => {
  try {
    // Handle circular routes by setting end location to start location
    let actualEndLocation = endLocation;
    if (tripType === 'foot-hiking' && isCircular) {
      actualEndLocation = startLocation;
    }
    
    // Validate locations
    console.log('Validating start location...');
    const startResult = await validateLocation(startLocation);
    console.log('Start location validation result:', startResult);

    console.log('Validating end location...');
    const endResult = await validateLocation(actualEndLocation);
    console.log('End location validation result:', endResult);

    if (!startResult || !endResult) {
      let errorMsg = 'One or both locations could not be found.';
      
      // Add more specific error messages
      if (!startResult && !endResult) {
        errorMsg = 'Neither start nor end location could be found. Try using city names or addresses.';
      } else if (!startResult) {
        errorMsg = 'Start location could not be found. Try a more specific location name.';
      } else {
        errorMsg = 'End location could not be found. Try a more specific location name.';
      }
      
      throw new Error(errorMsg);
    }

    // Extract coordinates
    const startCoords = [parseFloat(startResult.lon), parseFloat(startResult.lat)];
    const endCoords = [parseFloat(endResult.lon), parseFloat(endResult.lat)];

    // Build API options
    const apiOptions = {
      format: 'geojson',
      preference: routePreference,
      instructions: false
    };
    
    // Add type-specific API parameters
    if (tripType === 'foot-hiking' && isCircular) {
      // For circular routes, only send the start coordinate
      apiOptions.coordinates = [startCoords];
      apiOptions.options = {
        round_trip: {
          length: maxDistancePerDay * 1000, // Convert to meters
          points: 3,
          seed: Math.floor(Math.random() * 100) // Random seed for variation
        }
      };
    } else {
      // For normal routes, send both start and end coordinates
      apiOptions.coordinates = [startCoords, endCoords];
    }
    
    // Call the OpenRouteService API
    const response = await axios.post(
      `https://api.openrouteservice.org/v2/directions/${tripType}`,
      apiOptions,
      {
        headers: {
          'Authorization': process.env.REACT_APP_ORS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error('No route found between these locations. Please try different locations or a different transport mode.');
    }

    // Randomly select one of the alternative routes
    const randomIndex = Math.floor(Math.random() * response.data.routes.length);
    const selectedRoute = response.data.routes[randomIndex];

    // Decode the geometry
    const decodedGeometry = polyline.decode(selectedRoute.geometry);
    
    // Convert to [lat, lon] format as expected by Leaflet
    const routeCoordinates = decodedGeometry.map(coord => [coord[0], coord[1]]);

    return {
      coordinates: routeCoordinates,
      startLocation: {
        name: startLocation,
        coordinates: [parseFloat(startResult.lat), parseFloat(startResult.lon)]
      },
      endLocation: {
        name: endLocation,
        coordinates: [parseFloat(endResult.lat), parseFloat(endResult.lon)]
      },
      startLocationRaw: startResult,
      endLocationRaw: endResult
    };
  } catch (error) {
    console.error('Error planning route:', error);
    throw error;
  }
};

/**
 * Calculates the total distance of a route in kilometers
 * @param {Array} route - Array of [lat, lon] coordinates
 * @returns {number} - Total distance in kilometers
 */
export const calculateTotalDistance = (route) => {
  if (!route || route.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < route.length; i++) {
    const p1 = L.latLng(route[i-1][0], route[i-1][1]);
    const p2 = L.latLng(route[i][0], route[i][1]);
    totalDistance += p1.distanceTo(p2) / 1000; // Convert to km
  }
  return totalDistance;
};

/**
 * Calculates the minimum number of days needed for a trip
 * @param {number} totalDistanceKm - Total distance in kilometers
 * @param {string} tripType - Type of trip
 * @param {number} maxDistancePerDay - Maximum distance per day in kilometers
 * @returns {number} - Minimum number of days
 */
export const calculateMinimumDays = (totalDistanceKm, tripType, maxDistancePerDay) => {
  if (tripType === 'cycling-regular') {
    // For cycling, minimum days = total distance / max distance per day (rounded up)
    return Math.max(1, Math.ceil(totalDistanceKm / maxDistancePerDay));
  }
  return 1; // Default for other trip types
};

/**
 * Gets checkpoints along a route for POI searches
 * @param {Array} route - Array of [lat, lon] coordinates
 * @param {number} numPoints - Number of checkpoint points to extract
 * @returns {Array} - Array of checkpoint coordinates
 */
export const getRouteCheckpoints = (route, numPoints = 3) => {
  if (route.length < 2) return [route[0]];
  
  const checkpoints = [];
  const step = route.length / (numPoints + 1);
  
  for (let i = 1; i <= numPoints; i++) {
    const index = Math.floor(step * i);
    if (index < route.length) {
      checkpoints.push(route[index]);
    }
  }
  
  return checkpoints;
};
