// Utility to test Unsplash API key
import axios from 'axios';

// API key fallback for testing purposes - this is a read-only key with limited usage
const FALLBACK_API_KEY = 'Ro-p4CJEI73OZx8P7s0J3ErA7DJIad0l2UjJXGSQDlU';

export const testUnsplashApiKey = async (apiKey) => {
  // Use the provided key or fallback if none provided
  const keyToTest = apiKey || FALLBACK_API_KEY;
  
  if (!keyToTest) {
    console.error('No API key provided and no fallback available');
    return { success: false, error: 'No API key provided' };
  }
  
  try {
    // Make a simple API call to test the key
    const response = await axios.get('https://api.unsplash.com/photos/random', {
      headers: {
        'Authorization': `Client-ID ${keyToTest}`
      }
    });
    
    return { 
      success: true, 
      data: {
        id: response.data.id,
        user: response.data.user?.name || 'Unknown',
        url: response.data.urls?.small
      }
    };
  } catch (error) {
    console.error('Error testing Unsplash API key:', error);
    return { 
      success: false, 
      error: error.message, 
      statusCode: error.response?.status,
      details: error.response?.data
    };
  }
};

// Helper to get a random Unsplash image with direct API key
export const getDirectUnsplashImage = async (query, apiKey = FALLBACK_API_KEY) => {
  try {
    const response = await axios.get(`https://api.unsplash.com/search/photos`, {
      params: {
        query: query,
        per_page: 5,
        orientation: 'landscape',
        content_filter: 'high',
        order_by: 'relevant'
      },
      headers: {
        'Authorization': `Client-ID ${apiKey}`
      }
    });
    
    if (response.data.results && response.data.results.length > 0) {
      const randomIndex = Math.floor(Math.random() * Math.min(5, response.data.results.length));
      return {
        success: true,
        imageUrl: response.data.results[randomIndex].urls.regular,
        photographer: response.data.results[randomIndex].user?.name || "Unknown",
        description: response.data.results[randomIndex].description || 
                    response.data.results[randomIndex].alt_description || 
                    `Image of ${query}`
      };
    }
    
    return { success: false, error: 'No images found for query' };
  } catch (error) {
    console.error(`Error fetching Unsplash image for "${query}":`, error);
    return { success: false, error: error.message };
  }
};
