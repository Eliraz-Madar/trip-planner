const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const auth = require('../middleware/auth');
const axios = require('axios');

// Get all trips for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id })
      .select('-route.coordinates') // Exclude detailed route data from list
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trips' });
  }
});

// Get a specific trip
router.get('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    try {
      // Get weather forecast for the start location
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${trip.startLocation.coordinates[1]}&lon=${trip.startLocation.coordinates[0]}&appid=${process.env.OPENWEATHERMAP_API_KEY}&units=metric`
      );
      
      res.json({
        trip,
        weather: weatherResponse.data
      });
    } catch (weatherError) {
      console.error('Error fetching weather:', weatherError);
      // Return the trip without weather data if weather API fails
      res.json({
        trip,
        weather: null
      });
    }
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ message: 'Error fetching trip' });
  }
});

// Create a new trip
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received trip data:', req.body);
    const trip = new Trip({
      ...req.body,
      user: req.user._id
    });

    await trip.save();
    res.status(201).json(trip);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ message: 'Error creating trip', error: error.message });
  }
});

// Update a trip
router.patch('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Error updating trip' });
  }
});

// Delete a trip
router.delete('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting trip' });
  }
});

module.exports = router;