import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const MyTrips = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/trips', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTrips(response.data);
    } catch (err) {
      setError('Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  const handleTripClick = async (trip) => {
    setSelectedTrip(trip);
    try {
      const response = await axios.get(`http://localhost:5000/api/trips/${trip._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setWeather(response.data.weather);
    } catch (err) {
      setError('Failed to fetch trip details');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      await axios.delete(`http://localhost:5000/api/trips/${tripId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTrips(trips.filter(trip => trip._id !== tripId));
      setSelectedTrip(null);
    } catch (err) {
      setError('Failed to delete trip');
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Trips
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {trips.map((trip) => (
            <Grid item xs={12} md={6} key={trip._id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {trip.name}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    Type: {trip.type}
                  </Typography>
                  <Typography variant="body2">
                    From: {trip.startLocation.city} to {trip.endLocation.city}
                  </Typography>
                  <Typography variant="body2">
                    Total Distance: {trip.totalDistance}km
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleTripClick(trip)}>
                    View Details
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDeleteTrip(trip._id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog
          open={Boolean(selectedTrip)}
          onClose={() => setSelectedTrip(null)}
          maxWidth="md"
          fullWidth
        >
          {selectedTrip && (
            <>
              <DialogTitle>{selectedTrip.name}</DialogTitle>
              <DialogContent>
                <Box sx={{ height: '400px', mb: 2 }}>
                  <MapContainer
                    center={selectedTrip.startLocation.coordinates}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={selectedTrip.startLocation.coordinates}>
                      <Popup>Start Location</Popup>
                    </Marker>
                    <Marker position={selectedTrip.endLocation.coordinates}>
                      <Popup>End Location</Popup>
                    </Marker>
                    <Polyline
                      positions={selectedTrip.route.coordinates}
                      color="blue"
                      weight={3}
                      opacity={0.7}
                    />
                  </MapContainer>
                </Box>

                {weather && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Weather Forecast
                    </Typography>
                    <Grid container spacing={2}>
                      {weather.list.slice(0, 3).map((forecast, index) => (
                        <Grid item xs={12} md={4} key={index}>
                          <Card>
                            <CardContent>
                              <Typography variant="subtitle1">
                                {new Date(forecast.dt * 1000).toLocaleDateString()}
                              </Typography>
                              <Typography variant="h6">
                                {Math.round(forecast.main.temp)}°C
                              </Typography>
                              <Typography variant="body2">
                                {forecast.weather[0].description}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedTrip(null)}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Container>
  );
};

export default MyTrips; 