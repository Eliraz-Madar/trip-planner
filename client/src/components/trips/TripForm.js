import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';

// Helper function to format trip type for display
const formatTripType = (type) => {
  switch (type) {
    case 'foot-hiking': return 'Hiking';
    case 'cycling-regular': return 'Cycling';
    case 'driving-car': return 'Driving';
    default: return type;
  }
};

const TripForm = ({ 
  formData, 
  handleChange, 
  handleSubmit, 
  imageUrl,
  error, 
  loading, 
  route,
  saveTrip 
}) => {
  const { 
    tripType, 
    routePreference, 
    isCircular, 
    isMultiDay, 
    maxDistancePerDay, 
    minDistancePerDay, 
    startLocation, 
    endLocation,
    numberOfDays
  } = formData;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <FormControl fullWidth margin="normal">
        <InputLabel>Trip Type</InputLabel>
        <Select 
          name="tripType"
          value={tripType} 
          onChange={handleChange} 
          required
        >
          <MenuItem value="foot-hiking">{formatTripType('foot-hiking')}</MenuItem>
          <MenuItem value="cycling-regular">{formatTripType('cycling-regular')}</MenuItem>
          <MenuItem value="driving-car">{formatTripType('driving-car')}</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel>Route Preference</InputLabel>
        <Select 
          name="routePreference"
          value={routePreference} 
          onChange={handleChange}
        >
          <MenuItem value="recommended">Recommended</MenuItem>
          <MenuItem value="shortest">Shortest</MenuItem>
          <MenuItem value="fastest">Fastest</MenuItem>
        </Select>
      </FormControl>

      {/* Trip-specific options */}
      {tripType === 'foot-hiking' && (
        <>
          <FormControl fullWidth margin="normal">
            <InputLabel>Route Type</InputLabel>
            <Select 
              name="isCircular"
              value={isCircular ? 'circular' : 'one-way'} 
              onChange={(e) => handleChange({
                target: { name: 'isCircular', value: e.target.value === 'circular' }
              })}
            >
              <MenuItem value="circular">Circular (Return to start)</MenuItem>
              <MenuItem value="one-way">One-way (Different end point)</MenuItem>
            </Select>
          </FormControl>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Min Distance/Day (km)"
                type="number"
                name="minDistancePerDay"
                value={minDistancePerDay}
                onChange={handleChange}
                margin="normal"
                InputProps={{ inputProps: { min: 1, max: 30 } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Distance/Day (km)"
                type="number"
                name="maxDistancePerDay"
                value={maxDistancePerDay}
                onChange={handleChange}
                margin="normal"
                InputProps={{ inputProps: { min: 5, max: 30 } }}
              />
            </Grid>
          </Grid>
        </>
      )}
      
      {tripType === 'cycling-regular' && (
        <>
          <FormControl fullWidth margin="normal">
            <InputLabel>Trip Duration</InputLabel>
            <Select 
              name="isMultiDay"
              value={isMultiDay ? 'multi-day' : 'single-day'} 
              onChange={(e) => handleChange({
                target: { name: 'isMultiDay', value: e.target.value === 'multi-day' }
              })}
            >
              <MenuItem value="multi-day">Multi-day</MenuItem>
              <MenuItem value="single-day">Single day</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Max Distance/Day (km)"
            type="number"
            name="maxDistancePerDay"
            value={maxDistancePerDay}
            onChange={handleChange}
            margin="normal"
            InputProps={{ inputProps: { min: 10, max: 100 } }}
            helperText="For cycling trips, aim for 40-60km per day for comfortable multi-day journeys"
          />
          
          {isMultiDay && (
            <TextField
              fullWidth
              label="Number of Days"
              type="number"
              name="numberOfDays"
              value={numberOfDays || 2}
              onChange={handleChange}
              margin="normal"
              InputProps={{ inputProps: { min: 2, max: 14 } }}
            />
          )}
        </>
      )}

      <TextField
        fullWidth
        label="Start Location"
        name="startLocation"
        value={startLocation}
        onChange={handleChange}
        margin="normal"
        required
      />

      <TextField
        fullWidth
        label="End Location"
        name="endLocation"
        value={endLocation}
        onChange={handleChange}
        margin="normal"
        required={!(tripType === 'foot-hiking' && isCircular)}
        disabled={tripType === 'foot-hiking' && isCircular}
        helperText={tripType === 'foot-hiking' && isCircular ? 'End location same as start for circular routes' : ''}
      />

      {/* Display the auto-generated trip image when available */}
      {imageUrl && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {tripType === 'foot-hiking' && isCircular
              ? `${formatTripType(tripType)} preview for ${startLocation}`
              : `${formatTripType(tripType)} preview for ${startLocation} to ${endLocation || 'destination'}`}
          </Typography>
          <Box sx={{ mt: 1, position: 'relative' }}>
            <img 
              src={imageUrl} 
              alt={`${formatTripType(tripType)} trip to ${endLocation || startLocation}`} 
              style={{ 
                width: '100%', 
                height: '180px', 
                objectFit: 'cover', 
                borderRadius: '4px' 
              }} 
            />
            <Typography 
              variant="caption" 
              sx={{ 
                position: 'absolute', 
                bottom: 4, 
                right: 4, 
                bgcolor: 'rgba(0,0,0,0.5)', 
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1
              }}
            >
              Image via Unsplash
            </Typography>
          </Box>
        </Box>
      )}

      {/* Move the buttons to the bottom of the form */}
      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Button
          fullWidth
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? 'Planning...' : 'Plan Trip'}
        </Button>
        
        {route.length > 0 && (
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            size="large"
            onClick={saveTrip}
          >
            Save Trip
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </form>
  );
};

export default TripForm;
