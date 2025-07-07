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
    }
    throw new Error('Failed to save trip: ' + (err.response?.data?.message || 'Server error'));
  }
};
