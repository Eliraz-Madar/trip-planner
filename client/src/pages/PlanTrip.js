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
import axios from 'axios';

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

// Helper function to get default image by trip type
const getDefaultImageByTripType = (type) => {
  switch (type) {
    case 'foot-hiking':
      return 'https://images.unsplash.com/photo-1551632811-561732d1e306';
    case 'cycling-regular':
      return 'https://images.unsplash.com/photo-1541625602330-2277a4c46182';
    case 'driving-car':
      return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800';
    default:
      return 'https://images.unsplash.com/photo-1500835556837-99ac94a94552';
  }
};

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
  const [imageUrl, setImageUrl] = useState(null);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch trip image from Unsplash API
const fetchTripImage = async (location, type) => {
  try {
    // Show loading state
    setLoading(true);
    
    // Check if Unsplash API key is configured
    const unsplashApiKey = process.env.REACT_APP_UNSPLASH_API_KEY;
    if (!unsplashApiKey) {
      console.warn('No Unsplash API key found. Please add REACT_APP_UNSPLASH_API_KEY to your .env file.');
      // Use default image based on trip type
      const defaultImage = getDefaultImageByTripType(type);
      setImageUrl(defaultImage);
      setFormData(prev => ({ ...prev, imageUrl: defaultImage }));
      return;
    }

    // Function to build optimized search queries
    const buildSearchQueries = (location, type) => {
      // Clean up the location name (remove postal codes, special characters)
      const cleanLocation = location.replace(/\d+/g, '').trim();
      
      // Extract potential city and country (simple split by comma)
      const locationParts = cleanLocation.split(',').map(part => part.trim());
      const city = locationParts[0];
      const country = locationParts.length > 1 ? locationParts[locationParts.length - 1] : '';
      
      // Activity terms based on trip type
      const activityTerm = type === 'foot-hiking' ? 'hiking' : 
                          type === 'cycling-regular' ? 'cycling' : 'road trip';

      // Scenic terms to try
      const scenicTerms = ['landscape', 'scenic', 'nature', 'landmark', 'mountains', 'travel'];
      
      // Prepare multiple search queries in order of preference
      const queries = [
        // Try specific location + activity (most specific)
        `${cleanLocation} ${activityTerm}`,
        
        // Try city + activity if we have a distinct city
        city ? `${city} ${activityTerm}` : null,
        
        // Try country + activity if we have a country
        country ? `${country} ${activityTerm}` : null,
        
        // Try location + scenic alternatives
        ...scenicTerms.map(term => `${cleanLocation} ${term}`),
        
        // Try city + scenic alternatives
        ...(city ? scenicTerms.map(term => `${city} ${term}`) : []),
        
        // Try country + scenic alternatives
        ...(country ? scenicTerms.map(term => `${country} ${term}`) : []),
        
        // Try just location terms
        cleanLocation,
        city,
        country,
        
        // Fall back to activity + scenic (most generic)
        `${activityTerm} scenic`,
        `${activityTerm} adventure`,
        activityTerm
      ].filter(Boolean); // Remove any null entries
      
      // Remove duplicates
      return [...new Set(queries)];
    };

    // Get our prioritized search queries
    const searchQueries = buildSearchQueries(location, type);
    
    // Try each search query in sequence until we find results
    let imageFound = false;
    let newImageUrl = null;
    
    for (const query of searchQueries) {
      if (imageFound) break;
      
      console.log(`Trying to find image with query: "${query}"`);
      
      // Use Unsplash API to search for relevant images
      const response = await axios.get(`https://api.unsplash.com/search/photos`, {
        params: {
          query: query,
          per_page: 5, // Get more options to choose from
          orientation: 'landscape', // Prefer landscape images for trip banners
          content_filter: 'high', // Try to get high-quality, safe content
          order_by: 'relevant' // Order by relevance
        },
        headers: {
          'Authorization': `Client-ID ${unsplashApiKey}`
        }
      });
      
      if (response.data.results && response.data.results.length > 0) {
        // Get a random image from the results to add variety
        const randomIndex = Math.floor(Math.random() * Math.min(5, response.data.results.length));
        newImageUrl = response.data.results[randomIndex].urls.regular;
        
        // Add credit info to be displayed in the UI
        const photographerName = response.data.results[randomIndex].user?.name || "Unknown";
        const photoDescription = response.data.results[randomIndex].description || 
                                response.data.results[randomIndex].alt_description || 
                                `${type} trip to ${location}`;
        
        // Store the query that successfully found an image
        console.log(`Found image using query: "${query}" by ${photographerName}`);
        
        imageFound = true;
      }
    }
    
    if (imageFound && newImageUrl) {
      // Store the image URL from the response
      setImageUrl(newImageUrl);
      
      // Update form data to include the image URL
      setFormData(prev => ({
        ...prev,
        imageUrl: newImageUrl
      }));
    } else {
      // If no image found after all queries, use a default image based on trip type
      const defaultImage = getDefaultImageByTripType(type);
      
      setImageUrl(defaultImage);
      setFormData(prev => ({
        ...prev,
        imageUrl: defaultImage
      }));
    }
  } catch (err) {
    console.error('Error fetching trip image:', err);
    // Use fallback image on error
    const fallbackImage = getDefaultImageByTripType(type);
    setImageUrl(fallbackImage);
    setFormData(prev => ({
      ...prev,
      imageUrl: fallbackImage
    }));
    
    // Don't show an error to the user for this, just log it
    console.warn('Using fallback image due to API error:', err.message);
  } finally {
    setLoading(false);
  }
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
    setImageUrl(null); // Reset image URL when planning a new trip

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
      
      // Try to get the most relevant location information for the image
      let imageSearchLocation;
      
      if (formData.tripType === 'foot-hiking' && formData.isCircular) {
        // For circular hiking trips, only use the start location
        imageSearchLocation = formData.startLocation;
      } else if (formData.endLocation && formData.endLocation.trim() !== '') {
        // For trips with an end destination, prioritize that for the image
        imageSearchLocation = formData.endLocation;
      } else {
        // Fallback to start location
        imageSearchLocation = formData.startLocation;
      }
      
      // Fetch a relevant image based on the location and trip type
      await fetchTripImage(imageSearchLocation, formData.tripType);
      
    } catch (err) {
      console.error('Error planning trip:', err);
      setError('Failed to plan trip: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Save trip to database
  const handleSaveTrip = async () => {
    try {
      // Import the function at the top of the file if you haven't already
      // import { formatTripDataForSaving } from '../services/tripService';
      
      // Use formData properties instead of direct variables
      const tripData = {
        name: `${formData.tripType === 'foot-hiking' ? 'Hiking' : 
               formData.tripType === 'cycling-regular' ? 'Cycling' : 'Driving'} Trip from ${formData.startLocation} to ${formData.endLocation}`,
        type: formData.tripType,
        startLocation: { 
          coordinates: [route[0][1], route[0][0]],
          city: formData.startLocation, 
          country: 'Country' 
        },
        endLocation: { 
          coordinates: [route[route.length - 1][1], route[route.length - 1][0]],
          city: formData.endLocation, 
          country: 'Country' 
        },
        route: { 
          coordinates: route.map(coord => [coord[1], coord[0]])
        },
        dailyDistances: calculateDailyDistances(route, formData.tripType, formData.numberOfDays, formData.isMultiDay, formData.maxDistancePerDay),
        totalDistance: calculateTotalDistance(route),
        isMultiDay: formData.tripType === 'cycling-regular' ? formData.isMultiDay : false,
        maxDistancePerDay: formData.tripType === 'cycling-regular' ? formData.maxDistancePerDay : 0,
        numberOfDays: formData.tripType === 'cycling-regular' && formData.isMultiDay ? formData.numberOfDays : 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + (formData.numberOfDays || 1) * 24 * 60 * 60 * 1000),
        pointsOfInterest: pointsOfInterest,
        imageUrl: imageUrl
      };

      console.log('Sending trip data:', tripData);
      
      // Use the saveTripService function imported at the top
      await saveTripService(tripData, localStorage.getItem('token'));
      navigate('/trips');
    } catch (err) {
      console.error('Error saving trip:', err);
      if (err.response) {
        console.error('Server error details:', err.response.data);
      }
      setError('Failed to save trip: ' + (err.response?.data?.message || 'Server error'));
    }
  };

  // Add these helper functions at an appropriate place in your file
  const calculateTotalDistance = (route) => {
    let totalDistanceKm = 0;
    if (route.length > 1) {
      for (let i = 1; i < route.length; i++) {
        const p1 = L.latLng(route[i-1][0], route[i-1][1]);
        const p2 = L.latLng(route[i][0], route[i][1]);
        totalDistanceKm += p1.distanceTo(p2) / 1000; // Convert to km
      }
    }
    return Math.round(totalDistanceKm * 10) / 10; // Round to 1 decimal place
  };

  const calculateDailyDistances = (route, tripType, numberOfDays, isMultiDay, maxDistancePerDay) => {
    const totalDistance = calculateTotalDistance(route);
    let actualDays = numberOfDays;
    
    if (tripType === 'cycling-regular' && isMultiDay) {
      const minDaysNeeded = Math.max(1, Math.ceil(totalDistance / maxDistancePerDay));
      actualDays = Math.max(numberOfDays, minDaysNeeded);
    }
    
    if (tripType === 'cycling-regular' && isMultiDay) {
      // For multi-day cycling, divide the total distance by the actual number of days
      const avgDistancePerDay = totalDistance / actualDays;
      
      return Array.from({ length: actualDays }, (_, i) => ({ 
        day: i + 1, 
        distance: Math.round(avgDistancePerDay * 10) / 10 // Round to 1 decimal place
      }));
    } else {
      // Default daily distance for other trip types
      return [{ day: 1, distance: totalDistance }];
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
                imageUrl={imageUrl}
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
