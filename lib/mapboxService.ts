import { POI, RouteInfo } from '@/types/radar';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export class MapboxService {
  /**
   * Search for POIs near a location using Mapbox Search Box API
   */
  static async searchPOIs(
    longitude: number,
    latitude: number,
    category: string,
    radius: number = 3000 // 3km in meters
  ): Promise<POI[]> {
    try {
      console.log(`🔍 MapboxService.searchPOIs called:`, {
        category,
        center: [longitude, latitude],
        radius: `${radius}m (${radius/1000}km)`,
        token: MAPBOX_TOKEN ? `${MAPBOX_TOKEN.substring(0, 10)}...` : 'MISSING'
      });

      if (!MAPBOX_TOKEN) {
        console.error('❌ MAPBOX_TOKEN is not set!');
        return [];
      }

      // Calculate bounding box based on radius
      const radiusInKm = radius / 1000;
      const latDelta = radiusInKm / 110.574; // 1 degree latitude ≈ 110.574 km
      const lonDelta = radiusInKm / (111.32 * Math.cos((latitude * Math.PI) / 180)); // 1 degree longitude varies by latitude
      
      const bbox = [
        longitude - lonDelta, // min longitude
        latitude - latDelta,  // min latitude
        longitude + lonDelta, // max longitude
        latitude + latDelta   // max latitude
      ].join(',');

      const url = `https://api.mapbox.com/search/searchbox/v1/category/${category}?` +
        `proximity=${longitude},${latitude}&` +
        `bbox=${bbox}&` +
        `limit=25&` + // Maximum allowed for category search
        `access_token=${MAPBOX_TOKEN}`;
      
      console.log(`📡 Fetching from Mapbox API...`);
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Mapbox API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Mapbox API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📦 Mapbox API response:`, {
        category,
        featuresCount: data.features?.length || 0
      });
      
      const pois: POI[] = data.features?.map((feature: any) => {
        const coords = feature.geometry.coordinates;
        const distance = this.calculateDistance(
          latitude,
          longitude,
          coords[1],
          coords[0]
        );

        // Only include POIs within radius
        if (distance > radius) return null;

        return {
          id: feature.properties.mapbox_id || feature.id,
          name: feature.properties.name || 'Unknown',
          category: category,
          coordinates: coords,
          address: feature.properties.full_address || feature.properties.address || '',
          distance: distance
        };
      }).filter((poi: POI | null) => poi !== null) || [];

      console.log(`✅ Filtered POIs for ${category}:`, pois.length);
      return pois;
    } catch (error) {
      console.error('❌ Error searching POIs:', error);
      return [];
    }
  }

  /**
   * Get route information between two points
   */
  static async getRoute(
    startLng: number,
    startLat: number,
    endLng: number,
    endLat: number,
    mode: 'walking' | 'driving' | 'cycling' | 'driving-traffic' = 'walking'
  ): Promise<RouteInfo | null> {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${mode}/` +
        `${startLng},${startLat};${endLng},${endLat}?` +
        `geometries=geojson&` +
        `access_token=${MAPBOX_TOKEN}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox Directions API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distance: route.distance,
          duration: route.duration,
          mode: mode
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting route:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Format distance for display
   */
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  /**
   * Format duration for display
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    if (seconds < 3600) {
      return `${Math.round(seconds / 60)}min`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  }
}
