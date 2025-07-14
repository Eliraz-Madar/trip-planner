const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tripController = require('../controllers/tripController');

// Get all trips for current user
router.get('/', auth, tripController.getTrips);

// Get a specific trip
router.get('/:id', auth, tripController.getTripById);

// Create a new trip
router.post('/', auth, tripController.createTrip);

// Update a trip
router.put('/:id', auth, tripController.updateTrip);

// Delete a trip
router.delete('/:id', auth, tripController.deleteTrip);

module.exports = router;