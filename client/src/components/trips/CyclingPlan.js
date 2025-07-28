import React from 'react';
import { Paper, Typography, Grid, Box, Alert } from '@mui/material';
import { calculateMinimumDays } from '../../services/routeService';
import L from 'leaflet';

const CyclingPlan = ({ route, numberOfDays, maxDistancePerDay, tripType, isMultiDay, dailyDistances = [], wasAdjusted = false, originalDays = 0 }) => {
  // Show cycling plan for ALL cycling trips, regardless of single/multi-day selection
  if (!route || route.length === 0 || tripType !== 'cycling-regular') {
    return null;
  }

  // Calculate total distance in km
  let totalDistanceKm = 0;
  if (route.length > 1) {
    for (let i = 1; i < route.length; i++) {
      const p1 = L.latLng(route[i-1][0], route[i-1][1]);
      const p2 = L.latLng(route[i][0], route[i][1]);
      totalDistanceKm += p1.distanceTo(p2) / 1000; // Convert to km
    }
  }
  
  // Calculate minimum days needed based on max distance per day
  const minDaysNeeded = calculateMinimumDays(totalDistanceKm, tripType, maxDistancePerDay);
  
  // Use the passed information about adjustments instead of calculating here
  const actualDays = numberOfDays;
  const needsAdjustment = wasAdjusted && originalDays > 0 && originalDays < numberOfDays;

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Daily Cycling Plan
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1">
          Your cycling trip is approximately {Math.round(totalDistanceKm)} km in total.
        </Typography>
        
        {needsAdjustment && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Trip Duration Adjusted for Safety
            </Typography>
            <Typography variant="body2">
              Your original plan was for {originalDays} day{originalDays > 1 ? 's' : ''}, but this {Math.round(totalDistanceKm)}km cycling trip 
              requires at least {numberOfDays} days based on your maximum of {maxDistancePerDay}km per day.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              We've automatically adjusted your trip to {actualDays} days for a safer cycling experience.
            </Typography>
          </Alert>
        )}
        
        <Typography variant="body2" color="text.secondary">
          We recommend cycling about {Math.round(totalDistanceKm / actualDays)} km per day.
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {dailyDistances.length > 0 ? (
            // Use provided daily distances
            dailyDistances.map((dayData) => (
              <Grid item xs={6} md={3} key={dayData.day}>
                <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1">
                    Day {dayData.day}
                  </Typography>
                  <Typography variant="h6">
                    {dayData.distance} km
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(dayData.distance / 15)} hours
                  </Typography>
                </Paper>
              </Grid>
            ))
          ) : (
            // Fallback to original calculation
            Array.from({ length: actualDays }, (_, i) => i + 1).map(day => (
              <Grid item xs={6} md={3} key={day}>
                <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1">
                    Day {day}
                  </Typography>
                  <Typography variant="h6">
                    {Math.round(totalDistanceKm / actualDays)} km
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round((totalDistanceKm / actualDays) / 15)} hours
                  </Typography>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      </Box>
    </Paper>
  );
};

export default CyclingPlan;
