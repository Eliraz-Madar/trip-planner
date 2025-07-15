import axios from 'axios';
import L from 'leaflet';

/**
 * Saves a trip to the server
 * @param {Object} tripData - Complete trip data object to save
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Saved trip data
 */
export const saveTrip = async (tripData, token) => {
  try {
    console.log('Saving trip data:', tripData);

    // Validate required data before sending to server
    if (!tripData.name || !tripData.type) {
      throw new Error('Missing required trip data: name and type are required');
    }
    
    // Validate start location
    if (!tripData.startLocation?.coordinates || tripData.startLocation.coordinates.length !== 2) {
      throw new Error('Invalid start location coordinates');
    }
    
    if (!tripData.startLocation?.city || typeof tripData.startLocation.city !== 'string' || tripData.startLocation.city.trim() === '') {
      throw new Error('Start location city is required');
    }
    
    if (!tripData.startLocation?.country || typeof tripData.startLocation.country !== 'string' || tripData.startLocation.country.trim() === '') {
      throw new Error('Start location country is required');
    }

    // Validate end location
    if (!tripData.endLocation?.coordinates || tripData.endLocation.coordinates.length !== 2) {
      throw new Error('Invalid end location coordinates');
    }
    
    if (!tripData.endLocation?.city || typeof tripData.endLocation.city !== 'string' || tripData.endLocation.city.trim() === '') {
      throw new Error('End location city is required');
    }
    
    if (!tripData.endLocation?.country || typeof tripData.endLocation.country !== 'string' || tripData.endLocation.country.trim() === '') {
      throw new Error('End location country is required');
    }
    
    // Validate route
    if (!tripData.route?.coordinates || !Array.isArray(tripData.route.coordinates)) {
      throw new Error('Invalid route coordinates');
    }
    
    // Validate dates
    if (!tripData.startDate || !tripData.endDate) {
      throw new Error('Start and end dates are required');
    }
    
    // Validate description
    if (!tripData.description) {
      throw new Error('Trip description is required');
    }
    
    // Validate that POIs have the expected structure
    if (tripData.pointsOfInterest && Array.isArray(tripData.pointsOfInterest)) {
      tripData.pointsOfInterest = tripData.pointsOfInterest.map(poi => {
        // Ensure required fields exist and have the correct types
        if (!poi.id || typeof poi.id !== 'string') {
          throw new Error('Each POI must have a valid string ID');
        }
        
        if (!poi.name || typeof poi.name !== 'string') {
          throw new Error('Each POI must have a valid name');
        }
        
        if (!poi.type || typeof poi.type !== 'string') {
          throw new Error('Each POI must have a valid type');
        }
        
        if (!poi.location || !Array.isArray(poi.location) || poi.location.length !== 2) {
          throw new Error('Each POI must have a valid location [lat, lng]');
        }
        
        // Return a clean, formatted POI object
        return {
          id: poi.id,
          name: poi.name,
          type: poi.type,
          location: poi.location,
          description: poi.description || '',
          isDestination: !!poi.isDestination
        };
      });
    }

    const response = await axios.post('http://localhost:5000/api/trips', tripData, {
      headers: { 
        Authorization: `Bearer ${token}`,
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
      
      // If there are validation errors, format them for display
      if (err.response.data.errors) {
        const errorFields = Object.keys(err.response.data.errors);
        const errorMessage = errorFields.map(field => {
          return `${field}: ${err.response.data.errors[field]}`;
        }).join(', ');
        
        throw new Error(`Failed to save trip: ${errorMessage}`);
      }
    }
    
    throw new Error('Failed to save trip: ' + (err.response?.data?.message || err.message || 'Server error'));
  }
};
