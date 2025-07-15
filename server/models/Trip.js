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
  isMultiDay: {
    type: Boolean,
    default: false
  },
  maxDistancePerDay: {
    type: Number,
    default: 0
  },
  numberOfDays: {
    type: Number,
    default: 1
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
  isCircular: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  image: {
    type: String, // Store URL or path
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  },
  pointsOfInterest: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    location: {
      type: [Number],  // [lat, lng]
      required: true,
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length === 2;
        },
        message: 'Location must be an array of two numbers [latitude, longitude]'
      }
    },
    description: {
      type: String,
      default: ''
    },
    isDestination: {
      type: Boolean,
      default: false
    }
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