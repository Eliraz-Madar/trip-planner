import axios from 'axios';

/**
 * Fetches weather forecast data for a location
 * @param {Object} params - The location parameters
 * @param {number} params.lat - Latitude
 * @param {number} params.lon - Longitude
 * @returns {Promise<Object>} - Weather forecast data
 */
export const fetchWeatherForecast = async ({ lat, lon }) => {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.REACT_APP_WEATHER_API_KEY}&units=metric`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};

/**
 * Groups forecast data by day
 * @param {Array} forecastList - List of forecast data points
 * @param {number} days - Number of days to include
 * @returns {Array} - Array of daily forecasts
 */
export const getDailyForecasts = (forecastList, days = 3) => {
  if (!forecastList || !forecastList.length) return [];
  
  // Group forecasts by day and get one forecast per day
  return Object.values(
    forecastList.reduce((days, item) => {
      // Get date without time
      const date = new Date(item.dt * 1000).toLocaleDateString();
      // If we don't have this day yet, add it
      if (!days[date]) {
        days[date] = item;
      }
      return days;
    }, {})
  ).slice(0, days); // Take first n days
};
