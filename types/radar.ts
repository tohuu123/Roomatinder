export interface POI {
  id: string;
  name: string;
  category: string;
  coordinates: [number, number]; // [lng, lat]
  address: string;
  distance?: number; // in meters
}

export interface RadarFilter {
  id: string;
  label: string;
  icon: string;
  categories: string[];
  active: boolean;
}

export interface GeminiAreaAnalysis {
  convenience: string;
  noiseLevel: string;
  suitableFor: string;
  summary: string;
}

export interface SchoolLocation {
  name: string;
  coordinates: [number, number];
  address: string;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  mode: 'walking' | 'driving' | 'cycling' | 'driving-traffic';
}
