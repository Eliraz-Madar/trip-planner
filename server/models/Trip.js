const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['hiking', 'bicycling', 'driving', 'foot-hiking', 'cycling-regular', 'driving-car'], // Add the ORS types
    required: true
  },
  startLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    city: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  endLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    city: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  route: {
    type: {
      type: String,
      enum: ['LineString'],
      default: 'LineString'
    },
    coordinates: {
      type: [[Number]],
      required: true
    }
  },
  dailyDistances: [{
    day: Number,
    distance: Number
  }],
  totalDistance: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  pointsOfInterest: [{
    id: String,
    name: String,
    type: String,
    location: {
      type: [Number],
      index: '2dsphere'
    },
    description: String,
    isDestination: Boolean
  }]
}, {
  timestamps: true
});

// Create indexes for geospatial queries
tripSchema.index({ startLocation: '2dsphere' });
tripSchema.index({ endLocation: '2dsphere' });
tripSchema.index({ route: '2dsphere' });

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;