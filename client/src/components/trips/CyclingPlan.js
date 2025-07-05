import React from 'react';
import { Paper, Typography, Grid, Box, Alert } from '@mui/material';
import { calculateMinimumDays } from '../../services/routeService';
import L from 'leaflet';

const CyclingPlan = ({ route, numberOfDays, maxDistancePerDay, tripType, isMultiDay }) => {
  if (!route || route.length === 0 || tripType !== 'cycling-regular' || !isMultiDay) {
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
  
  // If user selected fewer days than minimum required, show warning
  const actualDays = Math.max(numberOfDays, minDaysNeeded);
  const needsAdjustment = minDaysNeeded > numberOfDays;

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
            Based on your maximum of {maxDistancePerDay}km per day, this trip requires at least {minDaysNeeded} days.
            We've adjusted your plan accordingly.
          </Alert>
        )}
        
        <Typography variant="body2" color="text.secondary">
          We recommend cycling about {Math.round(totalDistanceKm / actualDays)} km per day.
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {Array.from({ length: actualDays }, (_, i) => i + 1).map(day => (
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
          ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default CyclingPlan;
