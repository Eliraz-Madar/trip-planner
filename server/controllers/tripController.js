const Trip = require('../models/Trip');

// Get all trips for a user
exports.getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single trip by ID
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ 
      _id: req.params.id,
      user: req.user.id 
    });
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// When creating a trip, make sure POI data is properly saved:
exports.createTrip = async (req, res) => {
  try {
    const tripData = {
      ...req.body,
      user: req.user.id
    };
    
    // Validate that POIs have the expected structure
    if (tripData.pointsOfInterest && Array.isArray(tripData.pointsOfInterest)) {
      tripData.pointsOfInterest = tripData.pointsOfInterest.map(poi => ({
        id: poi.id,
        name: poi.name,
        type: poi.type,
        location: poi.location,
        description: poi.description || '',
        isDestination: !!poi.isDestination
      }));
    }
    
    const trip = new Trip(tripData);
    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
    res.status(400).json({ message: err.message, errors: err.errors });
  }
};

// Update a trip
exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ 
      _id: req.params.id,
      user: req.user.id 
    });
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    // Don't allow changing the user
    delete req.body.user;
    
    // Process POIs if they're being updated
    if (req.body.pointsOfInterest && Array.isArray(req.body.pointsOfInterest)) {
      req.body.pointsOfInterest = req.body.pointsOfInterest.map(poi => ({
        id: poi.id,
        name: poi.name,
        type: poi.type,
        location: poi.location,
        description: poi.description || '',
        isDestination: !!poi.isDestination
      }));
    }
    
    // Update the trip
    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.json(updatedTrip);
  } catch (err) {
    res.status(400).json({ message: err.message, errors: err.errors });
  }
};

// Delete a trip
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ 
      _id: req.params.id,
      user: req.user.id 
    });
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trip deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};