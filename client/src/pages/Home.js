import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

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
          <Card>
            <CardMedia
              component="img"
              height="200"
              image="https://source.unsplash.com/random/800x600/?hiking"
              alt="Hiking"
            />
            <CardContent>
              <Typography gutterBottom variant="h5" component="h2">
                Hiking Routes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Plan circular hiking routes of 5-15km per day with detailed trail information
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              height="200"
              image="https://source.unsplash.com/random/800x600/?cycling"
              alt="Cycling"
            />
            <CardContent>
              <Typography gutterBottom variant="h5" component="h2">
                Cycling Routes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create multi-day cycling routes up to 60km per day between cities
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              height="200"
              image="https://source.unsplash.com/random/800x600?weather"
              alt="Weather"
            />
            <CardContent>
              <Typography gutterBottom variant="h5" component="h2">
                Weather Forecasts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get real-time weather forecasts for your planned routes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home; 