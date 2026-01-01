'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { POI, RadarFilter, GeminiAreaAnalysis, SchoolLocation, RouteInfo } from '@/types/radar';
import { MapboxService } from '@/lib/mapboxService';
import { GeminiRadarService } from '@/lib/geminiRadarService';
import FilterChips from './FilterChips';
import POIInfoCard from './POIInfoCard';
import SchoolDistancePanel from './SchoolDistancePanel';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Default filters with various amenity categories
const DEFAULT_FILTERS: RadarFilter[] = [
  { id: 'park', label: 'Parks', icon: '', categories: ['park', 'garden', 'playground'], active: false },
  { id: 'gym', label: 'Fitness', icon: '', categories: ['gym', 'fitness_center', 'sports'], active: false },
  { id: 'hospital', label: 'Hospital', icon: '', categories: ['hospital', 'clinic', 'pharmacy'], active: false },
  { id: 'convenience', label: 'Convenience Store', icon: '', categories: ['convenience_store', 'mini_mart'], active: false },
  { id: 'supermarket', label: 'Supermarket', icon: '', categories: ['supermarket', 'grocery'], active: false },
  { id: 'gas', label: 'Gas Station', icon: '', categories: ['gas_station', 'fuel'], active: false },
  { id: 'cinema', label: 'Cinema', icon: '', categories: ['movie_theater', 'cinema'], active: false },
  { id: 'restaurant', label: 'Restaurant', icon: '', categories: ['restaurant', 'cafe', 'fast_food'], active: false },
  { id: 'shopping', label: 'Shopping', icon: '', categories: ['shopping_mall', 'department_store'], active: false },
  { id: 'bank', label: 'Bank/ATM', icon: '', categories: ['bank', 'atm'], active: false },
];

interface RadarMapProps {
  center: [number, number]; // [lng, lat]
  propertyName?: string;
  propertyAddress?: string;
  university?: string; // University name from profile
}

export default function RadarMap({ center, propertyName = 'This Property', propertyAddress = '', university }: RadarMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const circleLayerIdRef = useRef<string>('radar-circle');

  const [filters, setFilters] = useState<RadarFilter[]>(DEFAULT_FILTERS);
  const [pois, setPois] = useState<POI[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState<SchoolLocation | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [radius, setRadius] = useState<number>(3); // Default 3km

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add property marker
    new mapboxgl.Marker({ color: '#ff0000' })
      .setLngLat(center)
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${propertyName}</strong>`))
      .addTo(map.current);

    // Draw radius circle
    map.current.on('load', () => {
      if (!map.current) return;

      updateRadiusCircle(radius);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [center, propertyName]);

  // Update radius circle when radius changes
  const updateRadiusCircle = (radiusInKm: number) => {
    if (!map.current) return;

    const radiusInMeters = radiusInKm * 1000;
    const circle = createGeoJSONCircle(center, radiusInMeters);

    const source = map.current.getSource('radar-circle') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(circle);
    } else {
      map.current.addSource('radar-circle', {
        type: 'geojson',
        data: circle,
      });

      map.current.addLayer({
        id: circleLayerIdRef.current,
        type: 'fill',
        source: 'radar-circle',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.1,
        },
      });

      map.current.addLayer({
        id: `${circleLayerIdRef.current}-outline`,
        type: 'line',
        source: 'radar-circle',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      });
    }
  };

  // Handle radius change
  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    updateRadiusCircle(newRadius);
    
    // Clear all filters and POIs
    setFilters(filters.map(f => ({ ...f, active: false })));
    setPois([]);
    setSelectedPOI(null);
    clearMarkers();
  };
  // Handle filter toggle
  const handleFilterToggle = async (filterId: string) => {
    const updatedFilters = filters.map(f =>
      f.id === filterId ? { ...f, active: !f.active } : f
    );
    setFilters(updatedFilters);

    const activeFilters = updatedFilters.filter(f => f.active);
    
    // Always clear markers first
    clearMarkers();
    
    if (activeFilters.length === 0) {
      // Clear all POIs
      setPois([]);
      setSelectedPOI(null);
      return;
    }

    setLoading(true);
    try {
      // Fetch POIs for all active filters
      const allPOIs: POI[] = [];
      
      for (const filter of activeFilters) {
        for (const category of filter.categories) {
          const categoryPOIs = await MapboxService.searchPOIs(
            center[0],
            center[1],
            category,
            radius * 1000 // Convert km to meters
          );
          allPOIs.push(...categoryPOIs);
        }
      }

      // Remove duplicates based on coordinates
      const uniquePOIs = allPOIs.filter((poi, index, self) =>
        index === self.findIndex(p =>
          p.coordinates[0] === poi.coordinates[0] &&
          p.coordinates[1] === poi.coordinates[1]
        )
      );

      setPois(uniquePOIs);
      displayPOIsOnMap(uniquePOIs);
    } catch (error) {
      console.error('Error fetching POIs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Display POIs on map
  const displayPOIsOnMap = (poisToDisplay: POI[]) => {
    if (!map.current) return;

    clearMarkers();

    poisToDisplay.forEach(poi => {
      const el = document.createElement('div');
      el.className = 'poi-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.backgroundSize = 'contain';
      el.style.cursor = 'pointer';
      el.innerHTML = '📍';
      el.style.fontSize = '24px';

      const marker = new mapboxgl.Marker(el)
        .setLngLat(poi.coordinates)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        setSelectedPOI(poi);
      });

      markersRef.current.push(marker);
    });
  };

  // Clear all markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  // Handle get directions
  const handleGetDirections = (poi: POI) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${center[1]},${center[0]}&destination=${poi.coordinates[1]},${poi.coordinates[0]}`;
    window.open(url, '_blank');
  };

  // Handle school route calculation
  const handleCalculateRoute = async () => {
    if (!school) return;

    setRouteLoading(true);
    try {
      const route = await MapboxService.getRoute(
        center[0],
        center[1],
        school.coordinates[0],
        school.coordinates[1],
        'driving-traffic'
      );
      setRouteInfo(route);
    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setRouteLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20">
          <div className="bg-base-100 p-4 rounded-box shadow-lg">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        </div>
      )}

      {/* Filter chips */}
      <FilterChips filters={filters} onFilterToggle={handleFilterToggle} />

      {/* Radius selector - below filter chips */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Radius:</span>
              <div className="join">
                {[1, 2, 3, 5].map((km) => (
                  <button
                    key={km}
                    onClick={() => handleRadiusChange(km)}
                    className={`btn btn-sm join-item ${radius === km ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {km}km
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POI info card */}
      <POIInfoCard
        poi={selectedPOI}
        userLocation={center}
        onClose={() => setSelectedPOI(null)}
        onGetDirections={handleGetDirections}
      />

      {/* School distance panel */}
      <SchoolDistancePanel
        school={school}
        routeInfo={routeInfo}
        loading={routeLoading}
        onSchoolChange={setSchool}
        onCalculate={handleCalculateRoute}
        propertyCenter={center}
        initialUniversity={university}
      />

      {/* POI count badge */}
      {pois.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="badge badge-primary badge-lg">
            {pois.length} places found within {radius}km
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to create GeoJSON circle
function createGeoJSONCircle(
  center: [number, number],
  radiusInMeters: number,
  points: number = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords = {
    latitude: center[1],
    longitude: center[0],
  };

  const km = radiusInMeters / 1000;
  const ret = [];
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);

    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ret],
    },
    properties: {},
  };
}
