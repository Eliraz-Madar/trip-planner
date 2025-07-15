import axios from 'axios';

/**
 * Fetches points of interest along a route based on trip type
 * @param {Array} route - Array of [lat, lon] coordinates
 * @param {string} tripType - Type of trip (foot-hiking, cycling-regular, driving-car)
 * @returns {Promise<Array>} - Array of points of interest
 */
export const fetchPointsOfInterest = async (route, tripType) => {
  if (!['driving-car', 'cycling-regular', 'foot-hiking'].includes(tripType)) return [];  
  
  try {
    // Import routeService to avoid circular dependency
    const { getRouteCheckpoints } = require('./routeService');
    
    // Get a few points along the route
    const routePoints = getRouteCheckpoints(route, 3); // Get 3 points along the route
    
    let allPOIs = [];
    // To track and deduplicate POIs
    const poiNameLocationMap = new Map();
    
    // Build query based on trip type
    let queryElements = '';
    
    // Common query elements for all trip types
    const commonQuery = `
      node["tourism"](around:10000,{lat},{lon});
      node["historic"](around:10000,{lat},{lon});
    `;
    
    // Trip-specific query elements
    if (tripType === 'foot-hiking') {
      // For hiking - focus on nature, viewpoints, water sources, shelters
      queryElements = `
        ${commonQuery}
        node["natural"="peak"](around:15000,{lat},{lon});
        node["natural"="spring"](around:10000,{lat},{lon});
        node["natural"="water"](around:10000,{lat},{lon});
        node["tourism"="viewpoint"](around:15000,{lat},{lon});
        node["tourism"="wilderness_hut"](around:15000,{lat},{lon});
        node["amenity"="shelter"](around:10000,{lat},{lon});
        node["leisure"="nature_reserve"](around:15000,{lat},{lon});
      `;
    } else if (tripType === 'cycling-regular') {
      // For cycling - focus on bike shops, rest areas, water sources, bike paths
      queryElements = `
        ${commonQuery}
        node["shop"="bicycle"](around:10000,{lat},{lon});
        node["amenity"="bicycle_rental"](around:10000,{lat},{lon});
        node["amenity"="bicycle_repair_station"](around:10000,{lat},{lon});
        node["amenity"="cafe"](around:10000,{lat},{lon});
        node["amenity"="drinking_water"](around:10000,{lat},{lon});
        node["amenity"="shelter"](around:10000,{lat},{lon});
        node["tourism"="picnic_site"](around:10000,{lat},{lon});
      `;
    } else {
      // For driving - focus on restaurants, hotels, attractions, gas stations
      queryElements = `
        ${commonQuery}
        node["amenity"="restaurant"](around:10000,{lat},{lon});
        node["amenity"="cafe"](around:10000,{lat},{lon});
        node["amenity"="hotel"](around:10000,{lat},{lon});
        node["amenity"="fuel"](around:10000,{lat},{lon});
        node["leisure"="park"](around:10000,{lat},{lon});
      `;
    }
    
    // For each point, fetch nearby attractions
    for (const point of routePoints) {
      const query = queryElements.replace(/{lat}/g, point[0]).replace(/{lon}/g, point[1]);
      
      const response = await axios.get('https://overpass-api.de/api/interpreter', {
        params: {
          data: `
            [out:json];
            (
              ${query}
            );
            out body;
          `
        }
      });
      
      // Process and add to our POIs list
      if (response.data && response.data.elements) {
        const pointPOIs = response.data.elements
          .filter(poi => poi.tags && (poi.tags.name || poi.tags.tourism || poi.tags.natural || poi.tags.historic))
          .map((poi, index) => {
            // Determine the best category name based on trip type
            let type = 'Attraction';
            
            if (tripType === 'foot-hiking') {
              // Hiking-specific category mapping
              if (poi.tags.natural === 'peak') type = 'Mountain Peak';
              else if (poi.tags.natural === 'water') type = 'Water Source';
              else if (poi.tags.natural === 'spring') type = 'Spring';
              else if (poi.tags.tourism === 'viewpoint') type = 'Viewpoint';
              else if (poi.tags.tourism === 'wilderness_hut') type = 'Hut';
              else if (poi.tags.amenity === 'shelter') type = 'Shelter';
              else if (poi.tags.leisure === 'nature_reserve') type = 'Nature Reserve';
              else if (poi.tags.tourism) type = poi.tags.tourism;
              else if (poi.tags.historic) type = 'Historic Site';
            } 
            else if (tripType === 'cycling-regular') {
              // Cycling-specific category mapping
              if (poi.tags.shop === 'bicycle') type = 'Bike Shop';
              else if (poi.tags.amenity === 'bicycle_rental') type = 'Bike Rental';
              else if (poi.tags.amenity === 'bicycle_repair_station') type = 'Bike Repair';
              else if (poi.tags.amenity === 'cafe') type = 'Cafe';
              else if (poi.tags.amenity === 'drinking_water') type = 'Water Source';
              else if (poi.tags.amenity === 'shelter') type = 'Rest Area';
              else if (poi.tags.tourism === 'picnic_site') type = 'Picnic Area';
              else if (poi.tags.tourism) type = poi.tags.tourism;
              else if (poi.tags.historic) type = 'Historic Site';
            }
            else {
              // Driving-specific category mapping
              if (poi.tags.tourism) type = poi.tags.tourism;
              else if (poi.tags.historic) type = 'Historic Site';
              else if (poi.tags.amenity === 'restaurant') type = 'Restaurant';
              else if (poi.tags.amenity === 'cafe') type = 'Cafe';
              else if (poi.tags.amenity === 'hotel') type = 'Hotel';
              else if (poi.tags.amenity === 'fuel') type = 'Gas Station';
              else if (poi.tags.leisure === 'park') type = 'Park';
            }
            
            // Create a unique ID by combining the POI ID with its index and a timestamp prefix
            const uniqueId = `r_${Date.now()}_${poi.id}_${index}`;
            
            return {
              id: uniqueId,
              name: poi.tags.name || 'Unnamed Attraction',
              type: type,
              location: [poi.lat, poi.lon],
              description: poi.tags.description || ''
            };
          })
          .slice(0, 4); // Take top 4 from each checkpoint
          
        // Deduplicate POIs based on name and approximate location
        pointPOIs.forEach(poi => {
          const nameLocationKey = `${poi.name}-${poi.location[0].toFixed(3)}-${poi.location[1].toFixed(3)}`;
          if (!poiNameLocationMap.has(nameLocationKey)) {
            poiNameLocationMap.set(nameLocationKey, poi);
            allPOIs.push(poi);
          }
        });
      }
    }
    
    // Add destination POIs with appropriate queries for each trip type
    await fetchDestinationPOIsWithDeduplication(route, tripType, allPOIs, poiNameLocationMap);
    
    return allPOIs;
  } catch (error) {
    console.error("Error fetching points of interest:", error);
    return [];
  }
};

/**
 * Fetches points of interest at the destination with deduplication
 * @param {Array} route - Route coordinates
 * @param {string} tripType - Type of trip
 * @param {Array} allPOIs - Array to add POIs to
 * @param {Map} poiNameLocationMap - Map to track POIs for deduplication
 * @returns {Promise<void>}
 */
export const fetchDestinationPOIsWithDeduplication = async (route, tripType, allPOIs, poiNameLocationMap) => {
  try {
    // Common query elements for all trip types
    const commonQuery = `
      node["tourism"](around:10000,{lat},{lon});
      node["historic"](around:10000,{lat},{lon});
    `;
    
    const destPoint = route[route.length - 1];
    
    // Build destination query based on trip type
    let destQueryElements = '';
    
    if (tripType === 'foot-hiking') {
      destQueryElements = `
        ${commonQuery.replace(/{lat}/g, destPoint[0]).replace(/{lon}/g, destPoint[1])}
        node["natural"="peak"](around:15000,${destPoint[0]},${destPoint[1]});
        node["tourism"="viewpoint"](around:15000,${destPoint[0]},${destPoint[1]});
        node["amenity"="restaurant"](around:10000,${destPoint[0]},${destPoint[1]});
        node["amenity"="cafe"](around:10000,${destPoint[0]},${destPoint[1]});
      `;
    } else if (tripType === 'cycling-regular') {
      destQueryElements = `
        ${commonQuery.replace(/{lat}/g, destPoint[0]).replace(/{lon}/g, destPoint[1])}
        node["amenity"="restaurant"](around:10000,${destPoint[0]},${destPoint[1]});
        node["amenity"="cafe"](around:10000,${destPoint[0]},${destPoint[1]});
        node["amenity"="hotel"](around:10000,${destPoint[0]},${destPoint[1]});
        node["shop"="bicycle"](around:10000,${destPoint[0]},${destPoint[1]});
      `;
    } else {
      destQueryElements = `
        ${commonQuery.replace(/{lat}/g, destPoint[0]).replace(/{lon}/g, destPoint[1])}
        node["amenity"="restaurant"](around:15000,${destPoint[0]},${destPoint[1]});
        node["amenity"="cafe"](around:15000,${destPoint[0]},${destPoint[1]});
        node["amenity"="hotel"](around:15000,${destPoint[0]},${destPoint[1]});
      `;
    }
    
    const destResponse = await axios.get('https://overpass-api.de/api/interpreter', {
      params: {
        data: `
          [out:json];
          (
            ${destQueryElements}
          );
          out body;
        `
      }
    });
    
    if (destResponse.data && destResponse.data.elements) {
      const destPOIs = destResponse.data.elements
        .filter(poi => poi.tags && poi.tags.name)
        .map((poi, index) => {
          // Determine the best category name based on trip type
          let type = 'Attraction';
          
          if (tripType === 'foot-hiking') {
            // Hiking-specific category mapping
            if (poi.tags.natural === 'peak') type = 'Mountain Peak';
            else if (poi.tags.tourism === 'viewpoint') type = 'Viewpoint';
            else if (poi.tags.tourism) type = poi.tags.tourism;
            else if (poi.tags.historic) type = 'Historic Site';
            else if (poi.tags.amenity === 'restaurant') type = 'Restaurant';
            else if (poi.tags.amenity === 'cafe') type = 'Cafe';
          } 
          else if (tripType === 'cycling-regular') {
            // Cycling-specific category mapping
            if (poi.tags.shop === 'bicycle') type = 'Bike Shop';
            else if (poi.tags.amenity === 'restaurant') type = 'Restaurant';
            else if (poi.tags.amenity === 'cafe') type = 'Cafe';
            else if (poi.tags.amenity === 'hotel') type = 'Hotel';
            else if (poi.tags.tourism) type = poi.tags.tourism;
            else if (poi.tags.historic) type = 'Historic Site';
          }
          else {
            // Driving-specific category mapping
            if (poi.tags.tourism) type = poi.tags.tourism;
            else if (poi.tags.historic) type = 'Historic Site';
            else if (poi.tags.amenity === 'restaurant') type = 'Restaurant';
            else if (poi.tags.amenity === 'cafe') type = 'Cafe';
            else if (poi.tags.amenity === 'hotel') type = 'Hotel';
          }
          
          // Create a unique ID by combining the POI ID with its index and a timestamp prefix
          const uniqueId = `d_${Date.now()}_${poi.id}_${index}`;
          
          return {
            id: uniqueId,
            name: poi.tags.name,
            type: type,
            location: [poi.lat, poi.lon],
            description: poi.tags.description || '',
            isDestination: true
          };
        })
        .slice(0, 5); // Take top 5 from destination
      
      // Deduplicate POIs based on name and approximate location
      destPOIs.forEach(poi => {
        const nameLocationKey = `${poi.name}-${poi.location[0].toFixed(3)}-${poi.location[1].toFixed(3)}`;
        if (!poiNameLocationMap.has(nameLocationKey)) {
          poiNameLocationMap.set(nameLocationKey, poi);
          allPOIs.push(poi);
        }
      });
    }
  } catch (error) {
    console.error("Error fetching destination POIs:", error);
  }
};
