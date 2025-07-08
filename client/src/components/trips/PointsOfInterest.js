import React from 'react';
import { Paper, Typography, Grid, Box } from '@mui/material';

const PointsOfInterest = ({ pointsOfInterest, endLocation }) => {
  if (!pointsOfInterest || pointsOfInterest.length === 0) {
    return null;
  }

  // Filter POIs by location (along route vs. at destination)
  const routePOIs = pointsOfInterest.filter(poi => !poi.isDestination);
  const destinationPOIs = pointsOfInterest.filter(poi => poi.isDestination);

  // Group POIs by type
  const groupPOIsByType = (pois) => {
    return pois.reduce((categories, poi) => {
      // Normalize type name
      const category = poi.type.charAt(0).toUpperCase() + poi.type.slice(1).replace(/_/g, ' ');
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(poi);
      return categories;
    }, {});
  };

  const routePOIsByType = groupPOIsByType(routePOIs);
  const destinationPOIsByType = groupPOIsByType(destinationPOIs);

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Points of Interest
      </Typography>
      
      <Grid container spacing={3}>
        {/* Along Route POIs */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, borderBottom: '1px solid #eaeaea', pb: 1 }}>
            Along Your Route:
          </Typography>
          
          {Object.entries(routePOIsByType).map(([category, pois]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontSize: '1rem', color: 'primary.main' }}>
                {category}
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 0.5 }}>
                {pois.map(poi => (
                  <Box component="li" key={poi.id}>
                    <Typography variant="body2">
                      <Box 
                        component="a"
                        href={`https://www.google.com/search?q=${encodeURIComponent(poi.name + ' ' + endLocation)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': { 
                            textDecoration: 'underline',
                            fontWeight: 'medium'
                          }
                        }}
                      >
                        {poi.name}
                      </Box>
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Grid>
        
        {/* Destination POIs */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, borderBottom: '1px solid #eaeaea', pb: 1 }}>
            At Your Destination:
          </Typography>
          
          {Object.entries(destinationPOIsByType).map(([category, pois]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontSize: '1rem', color: 'primary.main' }}>
                {category}
              </Typography>
              <Box component="ul" sx={{ pl: 2, mt: 0.5 }}>
                {pois.map(poi => (
                  <Box component="li" key={poi.id}>
                    <Typography variant="body2">
                      <Box 
                        component="a"
                        href={`https://www.google.com/search?q=${encodeURIComponent(poi.name + ' ' + endLocation)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ 
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': { 
                            textDecoration: 'underline',
                            fontWeight: 'medium'
                          }
                        }}
                      >
                        {poi.name}
                      </Box>
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PointsOfInterest;
