import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  CircularProgress
} from '@mui/material';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useAuth } from '../contexts/AuthContext';

// Import components
import TripForm from '../components/trips/TripForm';
import TripMap from '../components/trips/TripMap';
import WeatherForecast from '../components/trips/WeatherForecast';
import PointsOfInterest from '../components/trips/PointsOfInterest';
import CyclingPlan from '../components/trips/CyclingPlan';

// Import services
import { planRoute, calculateMinimumDays } from '../services/routeService';
import { fetchWeatherForecast } from '../services/weatherService';
import { fetchPointsOfInterest } from '../services/poiService';
import { saveTrip as saveTripService } from '../services/tripService';

// Set up the default marker icon for Leaflet
L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const PlanTrip = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tripOptions = location.state || {};
  
  // State for form data
  const [formData, setFormData] = useState({
    tripType: tripOptions.tripType || 'foot-hiking',
    routePreference: tripOptions.preference || 'recommended',
    isCircular: tripOptions.options?.isCircular || false,
    isMultiDay: tripOptions.options?.isMultiDay || false,
    maxDistancePerDay: tripOptions.options?.maxDistancePerDay || 
      (tripOptions.tripType === 'foot-hiking' ? 15 : 
       tripOptions.tripType === 'cycling-regular' ? 60 : 0),
    minDistancePerDay: tripOptions.options?.minDistancePerDay || 
      (tripOptions.tripType === 'foot-hiking' ? 5 : 0),
    startLocation: '',
    endLocation: '',
    numberOfDays: tripOptions.options?.numberOfDays || 2
  });
  
  // State for API data and UI
  const [route, setRoute] = useState([]);
  const [weather, setWeather] = useState(null);
  const [pointsOfInterest, setPointsOfInterest] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Adjust days if needed when route changes
  useEffect(() => {
    if (route.length > 0 && formData.tripType === 'cycling-regular' && formData.isMultiDay) {
      // Calculate total distance
      let totalDistanceKm = 0;
      for (let i = 1; i < route.length; i++) {
        const p1 = L.latLng(route[i-1][0], route[i-1][1]);
        const p2 = L.latLng(route[i][0], route[i][1]);
        totalDistanceKm += p1.distanceTo(p2) / 1000;
      }
      
      // Calculate minimum days
      const minDaysNeeded = Math.max(1, Math.ceil(totalDistanceKm / formData.maxDistancePerDay));
      
      // Update days if below minimum
      if (minDaysNeeded > formData.numberOfDays) {
        setFormData(prev => ({
          ...prev,
          numberOfDays: minDaysNeeded
        }));
      }
    }
  }, [route, formData.tripType, formData.isMultiDay, formData.maxDistancePerDay, formData.numberOfDays]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRoute([]);
    setPointsOfInterest([]);
    setWeather(null);

    try {
      // Plan the route using routeService
      const routeResult = await planRoute({
        startLocation: formData.startLocation,
        endLocation: formData.endLocation,
        tripType: formData.tripType,
        routePreference: formData.routePreference,
        isCircular: formData.isCircular,
        maxDistancePerDay: formData.maxDistancePerDay
      });
      
      setRoute(routeResult.coordinates);
      
      // Fetch points of interest
      const pois = await fetchPointsOfInterest(routeResult.coordinates, formData.tripType);
      setPointsOfInterest(pois);
      
      // Get weather data for start location
      const weatherData = await fetchWeatherForecast({
        lat: routeResult.startLocationRaw.lat,
        lon: routeResult.startLocationRaw.lon
      });
      setWeather(weatherData);
      
    } catch (err) {
      setError('Failed to plan trip: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Save trip to database
  const handleSaveTrip = async () => {
    try {
      const savedTrip = await saveTripService({
        route,
        tripType: formData.tripType,
        startLocation: formData.startLocation,
        endLocation: formData.endLocation,
        isMultiDay: formData.isMultiDay,
        maxDistancePerDay: formData.maxDistancePerDay,
        numberOfDays: formData.numberOfDays,
        pointsOfInterest
      });
      
      navigate('/trips');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Plan Your Trip
        </Typography>

        <Grid container spacing={4}>
          {/* Trip Form */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <TripForm 
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                error={error}
                loading={loading}
                route={route}
                saveTrip={handleSaveTrip}
              />
            </Paper>
          </Grid>

          {/* Map */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ height: '100%', minHeight: '600px', p: 0, overflow: 'hidden' }}>
              <TripMap 
                route={route} 
                pointsOfInterest={pointsOfInterest}
                tripType={formData.tripType}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Weather Forecast */}
        {weather && (
          <WeatherForecast 
            weather={weather} 
            numberOfDays={formData.numberOfDays}
            tripType={formData.tripType}
            isMultiDay={formData.isMultiDay}
          />
        )}
        
        {/* Cycling Plan */}
        <CyclingPlan 
          route={route}
          numberOfDays={formData.numberOfDays}
          maxDistancePerDay={formData.maxDistancePerDay}
          tripType={formData.tripType}
          isMultiDay={formData.isMultiDay}
        />
        
        {/* Points of Interest */}
        {route.length > 0 && pointsOfInterest.length > 0 && (
          <PointsOfInterest 
            pointsOfInterest={pointsOfInterest} 
            endLocation={formData.endLocation}
          />
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default PlanTrip;
