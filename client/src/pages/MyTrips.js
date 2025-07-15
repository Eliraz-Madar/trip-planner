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
  Alert,
  Paper,
  CardMedia,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import L from 'leaflet';

// Helper function to format trip type for display
const formatTripType = (type) => {
  switch (type) {
    case 'foot-hiking': return 'Hiking';
    case 'cycling-regular': return 'Cycling';
    case 'driving-car': return 'Driving';
    default: return type;
  }
};

const MyTrips = () => { 
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tripToDelete, setTripToDelete] = useState(null); // Add state for delete confirmation

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

  // 1. First, fix the handleTripClick function to properly extract trip data
  const handleTripClick = async (trip) => {
    console.log("Trip clicked:", trip);
    console.log("Route data:", trip.route);
    console.log("Route coordinates:", trip.route?.coordinates);
    setSelectedTrip(trip);
    
    try {
      const response = await axios.get(`http://localhost:5000/api/trips/${trip._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log("Trip details response:", response.data);
      
      // Fix: Check the response structure and use the correct path
      const tripData = response.data.trip || response.data;
      console.log("Trip data to use:", tripData);
      
      setSelectedTrip(tripData);
      
      // Set weather if it's available in the response
      if (response.data.weather) {
        setWeather(response.data.weather);
      }
    } catch (err) {
      console.error("Error fetching trip details:", err);
      setError('Failed to fetch trip details');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    console.log("Deleting trip ID:", tripId); // Add this log
    setTripToDelete(tripId); // Update the delete button click handler
  };

  const handleDeleteConfirm = () => {
    if (tripToDelete) {
      // Your existing delete code
      axios.delete(`http://localhost:5000/api/trips/${tripToDelete}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }).then(() => {
        setTrips(trips.filter(trip => trip._id !== tripToDelete));
        setSelectedTrip(null);
      }).catch(err => {
        console.error("Error deleting trip:", err);
        setError('Failed to delete trip');
      });
      
      setTripToDelete(null);
    }
  };

 const MapViewController = ({ startCoords, endCoords, route }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (route && route.length > 1) {
      // Create a bounds object from all route points
      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (startCoords && endCoords) {
      // Fallback to just the start and end points
      const bounds = L.latLngBounds([startCoords, endCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, startCoords, endCoords, route]);
  
  return null;
};

  // Update the renderPointsOfInterest function to better handle different POI formats
  const renderPointsOfInterest = (trip) => {
    if (!trip || !trip.pointsOfInterest || trip.pointsOfInterest.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No points of interest saved for this trip.
        </Typography>
      );
    }

    // Log POI data to help debug
    console.log("POI data:", trip.pointsOfInterest);

    // Check if POIs are strings (IDs) or objects
    const firstPoi = trip.pointsOfInterest[0];
    const arePoiStrings = typeof firstPoi === 'string';
    const arePoiObjects = typeof firstPoi === 'object' && firstPoi !== null;
    
    if (arePoiStrings) {
      return (
        <Typography variant="body2">
          This trip has {trip.pointsOfInterest.length} points of interest saved.
          View them on the interactive map by planning this trip again.
        </Typography>
      );
    }
    
    if (!arePoiObjects || !firstPoi.location) {
      return (
        <Typography variant="body2" color="text.secondary">
          Points of interest data is incomplete. Try planning this trip again.
        </Typography>
      );
    }

    // If we have full POI objects, continue with the existing code...
    const routePOIs = trip.pointsOfInterest.filter(poi => !poi.isDestination);
    const destinationPOIs = trip.pointsOfInterest.filter(poi => poi.isDestination);

    return (
      <Grid container spacing={2}>
        {routePOIs.length > 0 && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Along Your Route:
            </Typography>
            
            {/* Group route POIs by type */}
            {Object.entries(
              routePOIs.reduce((categories, poi) => {
                const category = poi.type.charAt(0).toUpperCase() + poi.type.slice(1).replace(/_/g, ' ');
                if (!categories[category]) {
                  categories[category] = [];
                }
                categories[category].push(poi);
                return categories;
              }, {})
            ).map(([category, pois]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="bold" color="primary.main">
                  {category}
                </Typography>
                <Box component="ul" sx={{ pl: 2, mt: 0.5 }}>
                  {pois.map(poi => (
                    <Box component="li" key={poi.id}>
                      <Typography variant="body2">
                        {poi.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Grid>
        )}
        
        {destinationPOIs.length > 0 && (
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              At Your Destination:
            </Typography>
            
            {/* Group destination POIs by type */}
            {Object.entries(
              destinationPOIs.reduce((categories, poi) => {
                const category = poi.type.charAt(0).toUpperCase() + poi.type.slice(1).replace(/_/g, ' ');
                if (!categories[category]) {
                  categories[category] = [];
                }
                categories[category].push(poi);
                return categories;
              }, {})
            ).map(([category, pois]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="bold" color="primary.main">
                  {category}
                </Typography>
                <Box component="ul" sx={{ pl: 2, mt: 0.5 }}>
                  {pois.map(poi => (
                    <Box component="li" key={poi.id}>
                      <Typography variant="body2">
                        {poi.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Grid>
        )}
      </Grid>
    );
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
              <Card key={trip._id} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => handleTripClick(trip)}>
                <CardMedia
                  component="img"
                  height="140"
                  image={trip.imageUrl || 'https://images.unsplash.com/photo-1500835556837-99ac94a94552'}
                  alt={trip.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="h6">{trip.name}</Typography>
                  <Typography variant="body2">
                    {formatTripType(trip.type)} Trip
                  </Typography>
                  <Typography variant="body2">
                    {trip.startLocation.city} to {trip.endLocation.city}
                  </Typography>
                  <Typography variant="body2">
                    {trip.totalDistance} km
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
              <DialogTitle>
                <Typography variant="h5">{selectedTrip.name}</Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {new Date(selectedTrip.startDate).toLocaleDateString()} 
                  {selectedTrip.isMultiDay && ` - ${new Date(selectedTrip.endDate).toLocaleDateString()}`}
                </Typography>
              </DialogTitle>
              <DialogContent>
                {/* Trip summary section */}
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body1">
                        <strong>Type:</strong> {selectedTrip.type.replace(/-/g, ' ')}
                      </Typography>
                      <Typography variant="body1">
                        <strong>From:</strong> {selectedTrip.startLocation.city}
                      </Typography>
                      <Typography variant="body1">
                        <strong>To:</strong> {selectedTrip.endLocation.city}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body1">
                        <strong>Total Distance:</strong> {selectedTrip.totalDistance} km
                      </Typography>
                      {selectedTrip.isMultiDay && (
                        <Typography variant="body1">
                          <strong>Days:</strong> {selectedTrip.numberOfDays}
                        </Typography>
                      )}
                      {selectedTrip.type === 'cycling-regular' && (
                        <Typography variant="body1">
                          <strong>Max Distance Per Day:</strong> {selectedTrip.maxDistancePerDay} km
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Box>

                {/* Map section */}
                <Box sx={{ height: '400px', mb: 3, borderRadius: '8px', overflow: 'hidden' }}>
                  <MapContainer
                    center={[
                      selectedTrip.startLocation.coordinates[1], 
                      selectedTrip.startLocation.coordinates[0]
                    ]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker 
                      position={[
                        selectedTrip.startLocation.coordinates[1], 
                        selectedTrip.startLocation.coordinates[0]
                      ]}
                    >
                      <Popup>
                        <strong>Start:</strong> {selectedTrip.startLocation.city}
                      </Popup>
                    </Marker>
                    <Marker 
                      position={[
                        selectedTrip.endLocation.coordinates[1], 
                        selectedTrip.endLocation.coordinates[0]
                      ]}
                    >
                      <Popup>
                        <strong>End:</strong> {selectedTrip.endLocation.city}
                      </Popup>
                    </Marker>

                    {/* Fixed route polyline rendering */}
                    {selectedTrip.route && 
                     selectedTrip.route.coordinates && 
                     selectedTrip.route.coordinates.length > 0 && (
                      <Polyline
                        positions={selectedTrip.route.coordinates.map(coord => 
                          // Convert from [lng, lat] to [lat, lng]
                          [coord[1], coord[0]]
                        )}
                        color="blue"
                        weight={3}
                        opacity={0.7}
                      />
                    )}

                    {/* POI markers - only render if POIs are objects with location */}
                    {selectedTrip.pointsOfInterest && 
                     selectedTrip.pointsOfInterest.length > 0 && 
                     typeof selectedTrip.pointsOfInterest[0] !== 'string' && // Only if not strings
                     selectedTrip.pointsOfInterest.map(poi => (
                      <Marker 
                        key={poi.id} 
                        position={[poi.location[0], poi.location[1]]}
                        icon={L.divIcon({
                          className: 'custom-poi-icon',
                          html: `<div style="background-color: ${poi.isDestination ? '#ff4500' : '#4caf50'}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
                          iconSize: [15, 15],
                          iconAnchor: [7, 7]
                        })}
                      >
                        <Popup>
                          <strong>{poi.name}</strong><br />
                          Type: {poi.type}<br />
                          {poi.description && `${poi.description}<br />`}
                          {poi.isDestination ? '(At Destination)' : '(Along Route)'}
                        </Popup>
                      </Marker>
                    ))}

                    {/* Add this to ensure the map shows the whole route */}
                    <MapViewController 
                      startCoords={[selectedTrip.startLocation.coordinates[1], selectedTrip.startLocation.coordinates[0]]} 
                      endCoords={[selectedTrip.endLocation.coordinates[1], selectedTrip.endLocation.coordinates[0]]}
                      route={selectedTrip.route?.coordinates?.map(coord => [coord[1], coord[0]])}
                    />
                  </MapContainer>
                </Box>

                {/* Cycling specific details */}
                {selectedTrip.type === 'cycling-regular' && selectedTrip.isMultiDay && (
                  <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: '8px' }}>
                    <Typography variant="h6" gutterBottom>
                      Daily Cycling Plan
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body1">
                        Your {selectedTrip.numberOfDays}-day cycling trip is approximately {selectedTrip.totalDistance} km in total.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cycling about {Math.round(selectedTrip.totalDistance / selectedTrip.numberOfDays)} km per day.
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      {selectedTrip.dailyDistances.map((day) => (
                        <Grid item xs={6} sm={4} md={3} key={day.day}>
                          <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="subtitle1">
                              Day {day.day}
                            </Typography>
                            <Typography variant="h6">
                              {day.distance} km
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ~{Math.round(day.distance / 15)} hours
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    
                    {/* Add packing recommendations for cycling */}
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Recommended Cycling Gear:
                      </Typography>
                      <Grid container spacing={1}>
                        {['Helmet', 'Water Bottles', 'Cycling Shorts', 'Reflective Vest', 'Bike Repair Kit', 'First Aid Kit'].map((item) => (
                          <Grid item xs={6} sm={4} key={item}>
                            <Typography variant="body2">• {item}</Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Paper>
                )}

                {/* Hiking specific details */}
                {selectedTrip.type === 'foot-hiking' && (
                  <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: '8px' }}>
                    <Typography variant="h6" gutterBottom>
                      Hiking Details
                    </Typography>
                    <Typography variant="body1">
                      Total distance: {selectedTrip.totalDistance} km
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estimated time: {Math.round(selectedTrip.totalDistance / 4)} hours
                    </Typography>
                    
                    {/* Add difficulty estimation */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Difficulty:
                      </Typography>
                      <Typography variant="body1">
                        {selectedTrip.totalDistance < 10 ? 'Easy' : 
                         selectedTrip.totalDistance < 20 ? 'Moderate' : 'Challenging'} 
                        ({selectedTrip.totalDistance} km)
                      </Typography>
                    </Box>
                    
                    {/* Add packing recommendations for hiking */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Recommended Hiking Gear:
                      </Typography>
                      <Grid container spacing={1}>
                        {['Hiking Boots', 'Water', 'Hat', 'Sunscreen', 'Snacks', 'Rain Jacket', 'Map'].map((item) => (
                          <Grid item xs={6} sm={4} key={item}>
                            <Typography variant="body2">• {item}</Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Paper>
                )}

                {/* Driving specific details */}
                {selectedTrip.type === 'driving-car' && (
                  <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: '8px' }}>
                    <Typography variant="h6" gutterBottom>
                      Driving Details
                    </Typography>
                    <Typography variant="body1">
                      Total distance: {selectedTrip.totalDistance} km
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estimated time: {Math.round(selectedTrip.totalDistance / 80)} hours
                      {/* Assuming average driving speed of 80 km/h */}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Road Trip Tips:
                      </Typography>
                      <Grid container spacing={1}>
                        {['Check fuel', 'Verify tire pressure', 'Plan rest stops every 2 hours', 'Keep emergency kit', 'Download offline maps'].map((item) => (
                          <Grid item xs={12} sm={6} key={item}>
                            <Typography variant="body2">• {item}</Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Paper>
                )}

                {/* Weather forecast section - enhanced version */}
                {weather && (
                  <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: '8px' }}>
                    <Typography variant="h6" gutterBottom>
                      Weather Forecast
                    </Typography>
                    <Grid container spacing={2}>
                      {weather.list.slice(0, 3).map((forecast, index) => (
                        <Grid item xs={12} md={4} key={index}>
                          <Paper elevation={1} sx={{ p: 2, borderRadius: '8px', height: '100%' }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {new Date(forecast.dt * 1000).toLocaleDateString()}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <img 
                                src={`https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`} 
                                alt={forecast.weather[0].description}
                                width="50"
                                height="50"
                              />
                              <Typography variant="h5" sx={{ ml: 1 }}>
                                {Math.round(forecast.main.temp)}°C
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ textTransform: 'capitalize', mt: 1 }}>
                              {forecast.weather[0].description}
                            </Typography>
                            <Grid container spacing={1} sx={{ mt: 1 }}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Humidity: {forecast.main.humidity}%
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Wind: {Math.round(forecast.wind.speed * 3.6)} km/h
                                </Typography>
                              </Grid>
                            </Grid>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    
                    {/* Weather recommendation based on forecast */}
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: '4px' }}>
                      <Typography variant="subtitle1">
                        Weather Recommendations:
                      </Typography>
                      <Typography variant="body2">
                        {(() => {
                          const firstDay = weather.list[0];
                          const temp = firstDay.main.temp;
                          const conditions = firstDay.weather[0].main.toLowerCase();
                          
                          if (conditions.includes('rain') || conditions.includes('shower')) {
                            return "Prepare for rain! Bring waterproof clothing and consider starting early to avoid the worst of the precipitation.";
                          } else if (temp > 28) {
                            return "Hot conditions expected. Bring extra water, sun protection, and plan for shade breaks.";
                          } else if (temp < 10) {
                            return "Cool conditions expected. Dress in layers and bring gloves and a hat.";
                          } else {
                            return "Weather conditions look favorable for your trip. Still, always be prepared for changes in weather.";
                          }
                        })()}
                      </Typography>
                    </Box>
                  </Paper>
                )}

                {/* Elevation profile and stats could be added here */}
                {/* Additional info section */}
                <Paper elevation={2} sx={{ p: 3, borderRadius: '8px' }}>
                  <Typography variant="h6" gutterBottom>
                    Local Information
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Your trip begins in {selectedTrip.startLocation.city} and {
                      selectedTrip.isCircular 
                        ? 'loops back to the same location'
                        : `ends in ${selectedTrip.endLocation.city}`
                    }.
                    Remember to check local regulations and restrictions before your journey.
                  </Typography>
                  
                  {/* Points of Interest display */}
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Points of Interest
                  </Typography>
                  {renderPointsOfInterest(selectedTrip)}
                </Paper>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedTrip(null)}>Close</Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => window.print()}
                >
                  Print Trip Details
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Add delete confirmation dialog */}
        <Dialog
          open={Boolean(tripToDelete)}
          onClose={() => setTripToDelete(null)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this trip?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTripToDelete(null)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default MyTrips;