import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  CardActions
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Navigate to trip planner with pre-selected options
  const navigateToPlanner = (tripType, preference) => {
    if (user) {
      const tripOptions = {
        tripType,
        preference,
        // Add type-specific options
        options: {}
      };
      
      // Customize options based on trip type
      if (tripType === 'foot-hiking') {
        tripOptions.options = {
          isCircular: true,
          maxDistancePerDay: 15,
          minDistancePerDay: 5,
          showTrailDetails: true
        };
      } else if (tripType === 'cycling-regular') {
        tripOptions.options = {
          isMultiDay: true,
          maxDistancePerDay: 60,
          citiesOnly: true
        };
      } else if (tripType === 'driving-car') {
        tripOptions.options = {
          optimizeRoute: true,
          includeWeather: true
        };
      }
      
      navigate('/plan', { state: tripOptions });
    } else {
      navigate('/login');
    }
  };

  return (
    <Container>
      <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Trip Planner
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Plan your perfect hiking or cycling adventure with real-time weather forecasts
        </Typography>
        {!user && (
          <Box sx={{ mt: 4 }}>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              color="primary"
              size="large"
              sx={{ mr: 2 }}
            >
              Get Started
            </Button>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              color="primary"
              size="large"
            >
              Login
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardActionArea onClick={() => navigateToPlanner('foot-hiking', 'recommended')}>
              <CardMedia
                component="img"
                height="200"
                image="/images/hiking-trails.jpg" // Use a static image for reliability
                alt="Hiking Trails"
                sx={{ objectFit: "cover" }}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="h2">
                  Hiking Routes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Plan circular hiking routes of 5-15km per day with detailed trail information
                </Typography>
              </CardContent>
            </CardActionArea>
            <CardActions sx={{ mt: 'auto' }}>
              <Button 
                size="small" 
                color="primary"
                onClick={() => navigateToPlanner('foot-hiking', 'recommended')}
              >
                Plan Hiking Trip
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardActionArea onClick={() => navigateToPlanner('cycling-regular', 'fastest')}>
              <CardMedia
                component="img"
                height="200"
                image="/images/cycling-routes.jpeg" // Changed from .jpg to .jpeg
                alt="Cycling Routes"
                sx={{ objectFit: "cover" }}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="h2">
                  Cycling Routes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create multi-day cycling routes up to 60km per day between cities
                </Typography>
              </CardContent>
            </CardActionArea>
            <CardActions sx={{ mt: 'auto' }}>
              <Button 
                size="small" 
                color="primary"
                onClick={() => navigateToPlanner('cycling-regular', 'fastest')}
              >
                Plan Cycling Trip
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardActionArea onClick={() => navigateToPlanner('driving-car', 'shortest')}>
              <CardMedia
                component="img"
                height="200"
                image="/images/road-trip.jpeg" // Changed from .jpg to .jpeg
                alt="Road Trips"
                sx={{ objectFit: "cover" }}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="h2">
                  Road Trips
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Plan road trips with weather forecasts and optimal routes between destinations
                </Typography>
              </CardContent>
            </CardActionArea>
            <CardActions sx={{ mt: 'auto' }}>
              <Button 
                size="small" 
                color="primary"
                onClick={() => navigateToPlanner('driving-car', 'shortest')}
              >
                Plan Road Trip
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;