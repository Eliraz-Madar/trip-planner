import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Map controller component to handle view updates
const MapController = ({ route }) => {
  const map = useMap();
  
  useEffect(() => {
    if (route && route.length > 0) {
      // Create a bounds object from all route points
      const bounds = L.latLngBounds(route);
      
      // Fit the map to these bounds with some padding
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, route]);
  
  return null;
};

const TripMap = ({ route, pointsOfInterest, tripType }) => {
  const defaultCenter = [51.505, -0.09]; // Default center (London) if no route

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={13} 
      style={{ height: '100%', width: '100%', minHeight: '600px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {route.length > 0 && (
        <>
          {/* Start marker */}
          <Marker position={route[0]}>
            <Popup>Start Location</Popup>
          </Marker>

          {/* End marker */}
          <Marker position={route[route.length - 1]}>
            <Popup>End Location</Popup>
          </Marker>

          {/* Route line */}
          <Polyline positions={route} color="blue" weight={3} opacity={0.7} />
          
          {/* POI Markers */}
          {pointsOfInterest.map(poi => (
            <Marker 
              key={poi.id} 
              position={poi.location}
              icon={L.divIcon({
                className: 'custom-poi-icon',
                html: `<div style="background-color: ${poi.isDestination ? '#ff4500' : 
                  tripType === 'foot-hiking' ? '#8B4513' : 
                  tripType === 'cycling-regular' ? '#1E90FF' : '#4caf50'
                }; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
                iconSize: [15, 15],
                iconAnchor: [7, 7]
              })}
            >
              <Popup>
                <strong>{poi.name}</strong><br />
                Type: {poi.type}<br />
                {poi.description && `${poi.description}<br />`}
                {poi.isDestination ? '(At Destination)' : '(Along Route)'}<br />
                <a 
                  href={`https://www.google.com/search?q=${encodeURIComponent(poi.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1976d2', marginTop: '5px', display: 'inline-block' }}
                >
                  Search on Google
                </a>
              </Popup>
            </Marker>
          ))}
          
          {/* Map controller to auto-adjust view */}
          <MapController route={route} />
        </>
      )}
    </MapContainer>
  );
};

export default TripMap;
