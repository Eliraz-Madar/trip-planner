import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Alert,
  CircularProgress
} from '@mui/material';
import polyline from '@mapbox/polyline';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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

// Create a component to handle map view updates
const MapController = ({ route }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (route && route.length > 0) {
      // Create a bounds object from all route points
      const bounds = L.latLngBounds(route);
      
      // Fit the map to these bounds with some padding
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, route]);
  
  return null;
};

const PlanTrip = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tripOptions = location.state || {};
  
  // Initialize state with values from navigation or defaults
  const [tripType, setTripType] = useState(tripOptions.tripType || 'foot-hiking');
  const [routePreference, setRoutePreference] = useState(tripOptions.preference || 'recommended');
  
  // Trip-specific options
  const [isCircular, setIsCircular] = useState(tripOptions.options?.isCircular || false);
  const [isMultiDay, setIsMultiDay] = useState(tripOptions.options?.isMultiDay || false);
  const [maxDistancePerDay, setMaxDistancePerDay] = useState(
    tripOptions.options?.maxDistancePerDay || 
    (tripType === 'foot-hiking' ? 15 : tripType === 'cycling-regular' ? 60 : 0)
  );
  const [minDistancePerDay, setMinDistancePerDay] = useState(
    tripOptions.options?.minDistancePerDay || 
    (tripType === 'foot-hiking' ? 5 : 0)
  );
  
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [route, setRoute] = useState([]);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(
    tripOptions.options?.numberOfDays || 2
  );

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
    setLoading(true);
    setError('');
    setRoute([]);

    try {
      // For circular hiking routes, set end location to start location
      let actualEndLocation = endLocation;
      if (tripType === 'foot-hiking' && isCircular) {
        actualEndLocation = startLocation;
      }
      
      // Validate locations
      console.log('Validating start location...');
      const startResult = await validateLocation(startLocation);
      console.log('Start location validation result:', startResult);

      console.log('Validating end location...');
      const endResult = await validateLocation(actualEndLocation);
      console.log('End location validation result:', endResult);

      if (!startResult || !endResult) {
        let errorMsg = 'One or both locations could not be found.';
        
        // Add more specific error messages
        if (!startResult && !endResult) {
          errorMsg = 'Neither start nor end location could be found. Try using city names or addresses.';
        } else if (!startResult) {
          errorMsg = 'Start location could not be found. Try a more specific location name.';
        } else {
          errorMsg = 'End location could not be found. Try a more specific location name.';
        }
        
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

      // Modify the API options section in your handleSubmit function
      const apiOptions = {
        format: 'geojson',
        preference: routePreference,
        instructions: false
      };
      
      // Add type-specific API parameters
      if (tripType === 'foot-hiking' && isCircular) {
        // For circular routes, only send the start coordinate
        apiOptions.coordinates = [startCoords];
        apiOptions.options = {
          round_trip: {
            length: maxDistancePerDay * 1000, // Convert to meters
            points: 3,
            seed: Math.floor(Math.random() * 100) // Random seed for variation
          }
        };
      } else {
        // For normal routes, send both start and end coordinates
        apiOptions.coordinates = [startCoords, endCoords];
      }
      
      // Call the OpenRouteService API with the updated options
      const response = await axios.post(
        `https://api.openrouteservice.org/v2/directions/${tripType}`,
        apiOptions,
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

      // Randomly select one of the alternative routes
      const randomIndex = Math.floor(Math.random() * response.data.routes.length);
      const selectedRoute = response.data.routes[randomIndex];

      console.log('Selected route:', selectedRoute);
      console.log('Route geometry:', selectedRoute.geometry);


      const decodedGeometry = polyline.decode(selectedRoute.geometry);

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

  // Add this function after handleSubmit but before saveTrip
  const calculateMinimumDays = (totalDistanceKm) => {
    if (tripType === 'cycling-regular') {
      // For cycling, minimum days = total distance / max distance per day (rounded up)
      return Math.max(1, Math.ceil(totalDistanceKm / maxDistancePerDay));
    }
    return 1; // Default for other trip types
  };

  const saveTrip = async () => {
    try {
      // Format coordinates correctly for MongoDB
      const formattedRoute = route.map(coord => [coord[1], coord[0]]);
      
      // Calculate total distance from the route
      let totalDistance = 0;
      if (route.length > 1) {
        for (let i = 1; i < route.length; i++) {
          const p1 = L.latLng(route[i-1][0], route[i-1][1]);
          const p2 = L.latLng(route[i][0], route[i][1]);
          totalDistance += p1.distanceTo(p2) / 1000; // Convert to km
        }
      }
      
      // Ensure we have enough days for cycling trips
      let actualDays = numberOfDays;
      if (tripType === 'cycling-regular' && isMultiDay) {
        const minDaysNeeded = Math.max(1, Math.ceil(totalDistance / maxDistancePerDay));
        actualDays = Math.max(numberOfDays, minDaysNeeded);
      }
      
      // Create daily distances array based on trip type
      let dailyDistances = [];
      
      if (tripType === 'cycling-regular' && isMultiDay) {
        // For multi-day cycling, divide the total distance by the actual number of days
        const avgDistancePerDay = totalDistance / actualDays;
        
        for (let day = 1; day <= actualDays; day++) {
          dailyDistances.push({ 
            day, 
            distance: Math.round(avgDistancePerDay * 10) / 10 // Round to 1 decimal place
          });
        }
      } else {
        // Default daily distance for other trip types
        dailyDistances = [{ day: 1, distance: Math.round(totalDistance * 10) / 10 }];
      }
      
      const tripData = {
        name: `${tripType} Trip from ${startLocation} to ${endLocation}`,
        type: tripType,
        startLocation: { 
          coordinates: [route[0][1], route[0][0]],
          city: startLocation, 
          country: 'Country' 
        },
        endLocation: { 
          coordinates: [route[route.length - 1][1], route[route.length - 1][0]],
          city: endLocation, 
          country: 'Country' 
        },
        route: { 
          coordinates: formattedRoute
        },
        dailyDistances: dailyDistances,
        totalDistance: Math.round(totalDistance * 10) / 10,
        isMultiDay: tripType === 'cycling-regular' ? isMultiDay : false,
        maxDistancePerDay: tripType === 'cycling-regular' ? maxDistancePerDay : 0,
        numberOfDays: tripType === 'cycling-regular' && isMultiDay ? actualDays : 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + (actualDays || 1) * 24 * 60 * 60 * 1000)
      };

      console.log('Sending trip data:', tripData);

      const response = await axios.post('http://localhost:5000/api/trips', tripData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Trip saved successfully:', response.data);
      navigate('/trips');
    } catch (err) {
      console.error('Error saving trip:', err);
      // Log more detailed error information
      if (err.response) {
        console.error('Server error details:', err.response.data);
      }
      setError('Failed to save trip: ' + (err.response?.data?.message || 'Server error'));
    }
  };

  // Add this useEffect near the top of your component, with your other state declarations
  React.useEffect(() => {
    if (route.length > 0 && tripType === 'cycling-regular' && isMultiDay) {
      // Calculate total distance
      let totalDistanceKm = 0;
      for (let i = 1; i < route.length; i++) {
        const p1 = L.latLng(route[i-1][0], route[i-1][1]);
        const p2 = L.latLng(route[i][0], route[i][1]);
        totalDistanceKm += p1.distanceTo(p2) / 1000;
      }
      
      // Calculate minimum days
      const minDaysNeeded = Math.max(1, Math.ceil(totalDistanceKm / maxDistancePerDay));
      
      // Update days if below minimum
      if (minDaysNeeded > numberOfDays) {
        setNumberOfDays(minDaysNeeded);
      }
    }
  }, [route, tripType, isMultiDay, maxDistancePerDay]);

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Plan Your Trip
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Trip Type</InputLabel>
                  <Select value={tripType} onChange={(e) => setTripType(e.target.value)} required>
                    <MenuItem value="foot-hiking">Hiking</MenuItem>
                    <MenuItem value="cycling-regular">Bicycling</MenuItem>
                    <MenuItem value="driving-car">Driving</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Route Preference</InputLabel>
                  <Select 
                    value={routePreference} 
                    onChange={(e) => setRoutePreference(e.target.value)}
                  >
                    <MenuItem value="recommended">Recommended</MenuItem>
                    <MenuItem value="shortest">Shortest</MenuItem>
                    <MenuItem value="fastest">Fastest</MenuItem>
                  </Select>
                </FormControl>

                {/* Trip-specific options */}
                {tripType === 'foot-hiking' && (
                  <>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Route Type</InputLabel>
                      <Select 
                        value={isCircular ? 'circular' : 'one-way'} 
                        onChange={(e) => setIsCircular(e.target.value === 'circular')}
                      >
                        <MenuItem value="circular">Circular (Return to start)</MenuItem>
                        <MenuItem value="one-way">One-way (Different end point)</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Min Distance/Day (km)"
                          type="number"
                          value={minDistancePerDay}
                          onChange={(e) => setMinDistancePerDay(e.target.value)}
                          margin="normal"
                          InputProps={{ inputProps: { min: 1, max: 30 } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Max Distance/Day (km)"
                          type="number"
                          value={maxDistancePerDay}
                          onChange={(e) => setMaxDistancePerDay(e.target.value)}
                          margin="normal"
                          InputProps={{ inputProps: { min: 5, max: 30 } }}
                        />
                      </Grid>
                    </Grid>
                  </>
                )}
                
                {tripType === 'cycling-regular' && (
                  <>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Trip Duration</InputLabel>
                      <Select 
                        value={isMultiDay ? 'multi-day' : 'single-day'} 
                        onChange={(e) => setIsMultiDay(e.target.value === 'multi-day')}
                      >
                        <MenuItem value="multi-day">Multi-day</MenuItem>
                        <MenuItem value="single-day">Single day</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      label="Max Distance/Day (km)"
                      type="number"
                      value={maxDistancePerDay}
                      onChange={(e) => setMaxDistancePerDay(e.target.value)}
                      margin="normal"
                      InputProps={{ inputProps: { min: 10, max: 100 } }}
                      helperText="For cycling trips, aim for 40-60km per day for comfortable multi-day journeys"
                    />
                    
                    {isMultiDay && (
                      <TextField
                        fullWidth
                        label="Number of Days"
                        type="number"
                        value={numberOfDays || 2}
                        onChange={(e) => setNumberOfDays(e.target.value)}
                        margin="normal"
                        InputProps={{ inputProps: { min: 2, max: 14 } }}
                      />
                    )}
                  </>
                )}

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
                  required={!(tripType === 'foot-hiking' && isCircular)}
                  disabled={tripType === 'foot-hiking' && isCircular}
                  helperText={tripType === 'foot-hiking' && isCircular ? 'End location same as start for circular routes' : ''}
                />

                {/* Move the buttons to the bottom of the form */}
                <Box sx={{ mt: 'auto', pt: 2 }}>
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading}
                    sx={{ mb: 2 }}
                  >
                    {loading ? 'Planning...' : 'Plan Trip'}
                  </Button>
                  
                  {route.length > 0 && (
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      size="large"
                      onClick={saveTrip}
                    >
                      Save Trip
                    </Button>
                  )}
                </Box>
              </form>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ height: '100%', minHeight: '600px', p: 0, overflow: 'hidden' }}>
              <MapContainer 
                center={[51.505, -0.09]} 
                zoom={13} 
                style={{ height: '100%', width: '100%', minHeight: '600px' }}
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
                    <Polyline positions={route} color="blue" weight={3} opacity={0.7} />
                    <MapController route={route} />
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
              {weather && weather.list && 
                // Group forecasts by day and get one forecast per day
                Object.values(
                  weather.list.reduce((days, item) => {
                    // Get date without time
                    const date = new Date(item.dt * 1000).toLocaleDateString();
                    // If we don't have this day yet, add it
                    if (!days[date]) {
                      days[date] = item;
                    }
                    return days;
                  }, {})
                )
                .slice(0, 3) // Take first 3 days
                .map((forecast, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="subtitle1">
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
                ))
              }
            </Grid>
          </Paper>
        )}
        
        {route.length > 0 && tripType === 'cycling-regular' && isMultiDay && (
          <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Daily Cycling Plan
            </Typography>
            
            {/* Calculate total distance in km */}
            {(() => {
              let totalDistanceKm = 0;
              if (route.length > 1) {
                for (let i = 1; i < route.length; i++) {
                  const p1 = L.latLng(route[i-1][0], route[i-1][1]);
                  const p2 = L.latLng(route[i][0], route[i][1]);
                  totalDistanceKm += p1.distanceTo(p2) / 1000; // Convert to km
                }
              }
              
              // Calculate minimum days needed based on max distance per day
              const minDaysNeeded = calculateMinimumDays(totalDistanceKm);
              
              // If user selected fewer days than minimum required, show warning
              const actualDays = Math.max(numberOfDays, minDaysNeeded);
              
              // If we need to adjust the days, update the state
              if (actualDays > numberOfDays) {
                // We can't call setNumberOfDays directly here because it would trigger a re-render
                // Add useEffect to handle this separately
                return (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      Your cycling trip is approximately {Math.round(totalDistanceKm)} km in total.
                    </Typography>
                    {minDaysNeeded > numberOfDays && (
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
                );
              } else {
                return (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      Your {numberOfDays}-day cycling trip is approximately {Math.round(totalDistanceKm)} km in total.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      We recommend cycling about {Math.round(totalDistanceKm / numberOfDays)} km per day.
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {Array.from({ length: numberOfDays }, (_, i) => i + 1).map(day => (
                        <Grid item xs={6} md={3} key={day}>
                          <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="subtitle1">
                              Day {day}
                            </Typography>
                            <Typography variant="h6">
                              {Math.round(totalDistanceKm / numberOfDays)} km
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {Math.round((totalDistanceKm / numberOfDays) / 15)} hours
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                );
              }
            })()}
          </Paper>
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
