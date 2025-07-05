import React from 'react';
import { Paper, Typography, Grid, Box, Alert } from '@mui/material';

const WeatherForecast = ({ weather, numberOfDays = 3, tripType, isMultiDay }) => {
  if (!weather || !weather.list || weather.list.length === 0) {
    return null;
  }

  // Determine how many days to show
  let daysToShow = 3; // Default is 3 days
  
  // For multi-day cycling trips, use the trip duration
  if (tripType === 'cycling-regular' && isMultiDay && numberOfDays > 0) {
    daysToShow = Math.min(numberOfDays, 7); // Show up to 7 days (API limitation)
  }
  
  // Group forecasts by day and get one forecast per day
  const dailyForecasts = Object.values(
    weather.list.reduce((days, item) => {
      // Get date without time
      const date = new Date(item.dt * 1000).toLocaleDateString();
      // If we don't have this day yet, add it
      if (!days[date]) {
        days[date] = item;
      }
      return days;
    }, {})
  ).slice(0, daysToShow); // Take the number of days needed for the trip

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Weather Forecast for Your Trip
      </Typography>
      {dailyForecasts.length < numberOfDays && numberOfDays > 5 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Weather forecast is available for the next {dailyForecasts.length} days only. Full trip duration: {numberOfDays} days.
        </Alert>
      )}
      <Grid container spacing={2}>
        {dailyForecasts.map((forecast, index) => (
          <Grid item xs={12} sm={6} md={dailyForecasts.length > 4 ? 3 : 4} key={index}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={index === 0 ? 'bold' : 'normal'}>
                {index === 0 ? 'Today - ' : ''}
                {new Date(forecast.dt * 1000).toLocaleDateString()} 
              </Typography>
              <Typography variant="h6">{Math.round(forecast.main.temp)}°C</Typography>
              <Typography variant="body2">{forecast.weather[0].description}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <img 
                  src={`https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`} 
                  alt={forecast.weather[0].description}
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Humidity: {forecast.main.humidity}%
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default WeatherForecast;
