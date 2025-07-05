import axios from 'axios';
import L from 'leaflet';

/**
 * Saves a trip to the server
 * @param {Object} tripData - Trip data to save
 * @param {Array} route - Array of [lat, lon] coordinates
 * @param {string} tripType - Type of trip
 * @param {string} startLocation - Starting location name
 * @param {string} endLocation - Ending location name
 * @param {boolean} isMultiDay - Whether the trip is multi-day
 * @param {number} maxDistancePerDay - Maximum distance per day
 * @param {number} numberOfDays - Number of days for the trip
 * @param {Array} pointsOfInterest - Points of interest along the route
 * @returns {Promise<Object>} - Saved trip data
 */
export const saveTrip = async ({ 
  route, 
  tripType, 
  startLocation, 
  endLocation, 
  isMultiDay, 
  maxDistancePerDay, 
  numberOfDays,
  pointsOfInterest
}) => {
  try {
    // Format coordinates correctly for MongoDB
    const formattedRoute = route.map(coord => [coord[1], coord[0]]);
    
    // Calculate total distance from the route
    let totalDistance = 0;
    if (route.length > 1) {
      for (let i = 1; i < route.length; i++) {
        const p1 = L.latLng(route[i-1][0], route[i-1][1]);
        const p2 = L.latLng(route[i][0], route[i][1]);
        totalDistance += p1.distanceTo(p2) / 1000; // Convert to km
      }
    }
    
    // Ensure we have enough days for cycling trips
    let actualDays = numberOfDays;
    if (tripType === 'cycling-regular' && isMultiDay) {
      const minDaysNeeded = Math.max(1, Math.ceil(totalDistance / maxDistancePerDay));
      actualDays = Math.max(numberOfDays, minDaysNeeded);
    }
    
    // Create daily distances array based on trip type
    let dailyDistances = [];
    
    if (tripType === 'cycling-regular' && isMultiDay) {
      // For multi-day cycling, divide the total distance by the actual number of days
      const avgDistancePerDay = totalDistance / actualDays;
      
      for (let day = 1; day <= actualDays; day++) {
        dailyDistances.push({ 
          day, 
          distance: Math.round(avgDistancePerDay * 10) / 10 // Round to 1 decimal place
        });
      }
    } else {
      // Default daily distance for other trip types
      dailyDistances = [{ day: 1, distance: Math.round(totalDistance * 10) / 10 }];
    }
    
    const tripData = {
      name: `${tripType} Trip from ${startLocation} to ${endLocation}`,
      type: tripType,
      startLocation: { 
        coordinates: [route[0][1], route[0][0]],
        city: startLocation, 
        country: 'Country' 
      },
      endLocation: { 
        coordinates: [route[route.length - 1][1], route[route.length - 1][0]],
        city: endLocation, 
        country: 'Country' 
      },
      route: { 
        coordinates: formattedRoute
      },
      dailyDistances: dailyDistances,
      totalDistance: Math.round(totalDistance * 10) / 10,
      isMultiDay: tripType === 'cycling-regular' ? isMultiDay : false,
      maxDistancePerDay: tripType === 'cycling-regular' ? maxDistancePerDay : 0,
      numberOfDays: tripType === 'cycling-regular' && isMultiDay ? actualDays : 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + (actualDays || 1) * 24 * 60 * 60 * 1000),
      pointsOfInterest: tripType === 'driving-car' ? pointsOfInterest : []
    };

    console.log('Sending trip data:', tripData);

    const response = await axios.post('http://localhost:5000/api/trips', tripData, {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Trip saved successfully:', response.data);
    return response.data;
  } catch (err) {
    console.error('Error saving trip:', err);
    // Log more detailed error information
    if (err.response) {
      console.error('Server error details:', err.response.data);
    }
    throw new Error('Failed to save trip: ' + (err.response?.data?.message || 'Server error'));
  }
};
