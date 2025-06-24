import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert
} from '@mui/material';
import polyline from '@mapbox/polyline';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Fix for default marker icons in Leaflet with React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const PlanTrip = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tripType, setTripType] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [route, setRoute] = useState([]);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateLocation = async (location) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Trip planning started...');
    console.log('Trip type:', tripType);
    console.log('Start location:', startLocation);
    console.log('End location:', endLocation);

    try {
      // Validate locations
      console.log('Validating start location...');
      const startResult = await validateLocation(startLocation);
      console.log('Start location validation result:', startResult);

      console.log('Validating end location...');
      const endResult = await validateLocation(endLocation);
      console.log('End location validation result:', endResult);

      if (!startResult || !endResult) {
        const errorMsg = 'One or both locations could not be found.';
        console.error(errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Extract coordinates
      const startCoords = [parseFloat(startResult.lon), parseFloat(startResult.lat)];
      const endCoords = [parseFloat(endResult.lon), parseFloat(endResult.lat)];
      console.log('Start coordinates [lon, lat]:', startCoords);
      console.log('End coordinates [lon, lat]:', endCoords);

      // Call OpenRouteService API
      console.log('Calling OpenRouteService API...');
      console.log('API URL:', `https://api.openrouteservice.org/v2/directions/${tripType}`);
      console.log('Request payload:', {
        coordinates: [startCoords, endCoords],
        format: 'geojson'
      });
      console.log('API key:', process.env.REACT_APP_ORS_API_KEY);
      
      const response = await axios.post(
        `https://api.openrouteservice.org/v2/directions/${tripType}`,
        {
          coordinates: [startCoords, endCoords],
          format: 'geojson'
        },
        {
          headers: {
            'Authorization': process.env.REACT_APP_ORS_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('OpenRouteService API response:', response.data);
      console.log('Routes array:', response.data.routes);

      if (!response.data.routes || response.data.routes.length === 0) {
        console.error('No routes returned from the API');
        setError('No route found between these locations. Please try different locations or a different transport mode.');
        setLoading(false);
        return;
      }

      console.log('Selected route:', response.data.routes[0]);
      console.log('Route geometry:', response.data.routes[0].geometry);


      const decodedGeometry = polyline.decode(response.data.routes[0].geometry);

      // Convert to [lat, lon] format as expected by Leaflet
      const routeCoordinates = decodedGeometry.map(coord => [coord[0], coord[1]]);

      console.log('Extracted route coordinates (first and last):', 
      routeCoordinates.length > 0 ? [routeCoordinates[0], routeCoordinates[routeCoordinates.length-1]] : 'None');

      
      setRoute(routeCoordinates);

      // Get weather data for start location
      console.log('Fetching weather data...');
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${startResult.lat}&lon=${startResult.lon}&appid=${process.env.REACT_APP_WEATHER_API_KEY}&units=metric`
      );
      console.log('Weather API response received');
      setWeather(weatherResponse.data);
      console.log('Trip planning completed successfully');
    } catch (err) {
      //console.error('Error planning trip:', err);
      //console.error('Error details:', err.response?.data || err.message);
      setError('Failed to plan trip: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const saveTrip = async () => {
    try {
      const tripData = {
        name: `${tripType} Trip from ${startLocation} to ${endLocation}`,
        type: tripType,
        startLocation: { coordinates: route[0], city: startLocation, country: 'Country' },
        endLocation: { coordinates: route[route.length - 1], city: endLocation, country: 'Country' },
        route: { coordinates: route },
        dailyDistances: [{ day: 1, distance: 10 }, { day: 2, distance: 15 }],
        totalDistance: 25,
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      };

      await axios.post('http://localhost:5000/api/trips', tripData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      navigate('/trips');
    } catch (err) {
      console.error('Error saving trip:', err);
      setError('Failed to save trip');
    }
  };

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Plan Your Trip
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <form onSubmit={handleSubmit}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Trip Type</InputLabel>
                  <Select value={tripType} onChange={(e) => setTripType(e.target.value)} required>
                    <MenuItem value="foot-hiking">Hiking</MenuItem>
                    <MenuItem value="cycling-regular">Bicycling</MenuItem>
                    <MenuItem value="driving-car">Driving</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Start Location"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  margin="normal"
                  required
                />

                <TextField
                  fullWidth
                  label="End Location"
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                  margin="normal"
                  required
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Planning...' : 'Plan Trip'}
                </Button>
              </form>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              {route.length > 0 && (
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={saveTrip}
                  sx={{ mt: 2 }}
                >
                  Save Trip
                </Button>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3, height: '500px' }}>
              <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {route.length > 0 && (
                  <>
                    <Marker position={route[0]}>
                      <Popup>Start Location</Popup>
                    </Marker>
                    <Marker position={route[route.length - 1]}>
                      <Popup>End Location</Popup>
                    </Marker>
                    <Polyline positions={route} color="blue" weight={3} opacity={0.7} />
                  </>
                )}
              </MapContainer>
            </Paper>
          </Grid>
        </Grid>

        {weather && (
          <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Weather Forecast
            </Typography>
            <Grid container spacing={2}>
              {weather.list.slice(0, 3).map((forecast, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1">
                      {new Date(forecast.dt * 1000).toLocaleDateString()}
                    </Typography>
                    <Typography variant="h6">{Math.round(forecast.main.temp)}°C</Typography>
                    <Typography variant="body2">{forecast.weather[0].description}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default PlanTrip;
