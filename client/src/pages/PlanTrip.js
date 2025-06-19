import React, { useState, useEffect } from 'react';
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

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Fix for default marker icons in Leaflet with React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Here you would typically call your backend API to generate the route
      

      // For now, we'll simulate a route with some sample coordinates
      const sampleRoute = [
        [51.505, -0.09],
        [51.51, -0.1],
        [51.52, -0.12]
      ];

      setRoute(sampleRoute);

      // Get weather forecast for the start location
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${sampleRoute[0][0]}&lon=${sampleRoute[0][1]}&appid=${process.env.REACT_APP_WEATHER_API_KEY}&units=metric`
      );

      setWeather(weatherResponse.data);
    } catch (err) {
      setError('Failed to plan trip');
    } finally {
      setLoading(false);
    }
  };

  const saveTrip = async () => {
    try {
      const tripData = {
        name: `${tripType} Trip from ${startLocation} to ${endLocation}`,
        type: tripType,
        startLocation: {
          coordinates: route[0],
          city: startLocation,
          country: 'Country' // You would get this from a geocoding service
        },
        endLocation: {
          coordinates: route[route.length - 1],
          city: endLocation,
          country: 'Country'
        },
        route: {
          coordinates: route
        },
        dailyDistances: [
          { day: 1, distance: 10 },
          { day: 2, distance: 15 }
        ],
        totalDistance: 25,
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      };

      await axios.post('http://localhost:5000/api/trips', tripData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      navigate('/trips');
    } catch (err) {
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
                  <Select
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value)}
                    required
                  >
                    <MenuItem value="hiking">Hiking</MenuItem>
                    <MenuItem value="bicycling">Bicycling</MenuItem>
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
              <MapContainer
                center={[51.505, -0.09]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
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
                    <Polyline
                      positions={route}
                      color="blue"
                      weight={3}
                      opacity={0.7}
                    />
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
                    <Typography variant="h6">
                      {Math.round(forecast.main.temp)}°C
                    </Typography>
                    <Typography variant="body2">
                      {forecast.weather[0].description}
                    </Typography>
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