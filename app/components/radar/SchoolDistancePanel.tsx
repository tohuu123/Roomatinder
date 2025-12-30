'use client';

import React, { useEffect } from 'react';
import { SchoolLocation, RouteInfo } from '@/types/radar';
import { MapboxService } from '@/lib/mapboxService';

interface SchoolDistancePanelProps {
  school: SchoolLocation | null;
  routeInfo: RouteInfo | null;
  loading: boolean;
  onSchoolChange: (school: SchoolLocation) => void;
  onCalculate: () => void;
  propertyCenter: [number, number]; // Property coordinates for proximity
  initialUniversity?: string; // University name from profile
}

export default function SchoolDistancePanel({
  school,
  routeInfo,
  loading,
  onSchoolChange,
  onCalculate,
  propertyCenter,
  initialUniversity
}: SchoolDistancePanelProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [schoolName, setSchoolName] = React.useState(school?.name || '');
  const [schoolAddress, setSchoolAddress] = React.useState(school?.address || '');
  const [searching, setSearching] = React.useState(false);

  // Auto-search university from profile on mount
  useEffect(() => {
    if (initialUniversity && !school && !isEditing) {
      searchUniversity(initialUniversity);
    }
  }, [initialUniversity]);

  // Search university using Mapbox Search Box API
  const searchUniversity = async (universityName: string) => {
    if (!universityName.trim()) return;

    setSearching(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      // Search for university/school
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?` +
        `q=${encodeURIComponent(universityName)}&` +
        `language=en&` +
        `types=poi&` +
        `proximity=${propertyCenter[0]},${propertyCenter[1]}&` +
        `session_token=${Date.now()}&` +
        `access_token=${token}`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      
      if (data.suggestions && data.suggestions.length > 0) {
        // Get first suggestion and retrieve full details
        const suggestion = data.suggestions[0];
        const retrieveResponse = await fetch(
          `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?` +
          `session_token=${Date.now()}&` +
          `access_token=${token}`
        );
        
        if (retrieveResponse.ok) {
          const retrieveData = await retrieveResponse.json();
          const feature = retrieveData.features[0];
          const [lng, lat] = feature.geometry.coordinates;
          const placeName = feature.properties.name || universityName;
          const address = feature.properties.full_address || feature.properties.place_formatted || '';
          
          onSchoolChange({
            name: placeName,
            address: address,
            coordinates: [lng, lat]
          });
          console.log('University found:', placeName, address);
        }
      } else {
        console.log('University not found:', universityName);
      }
    } catch (error) {
      console.error('University search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSave = () => {
    if (schoolName) {
      // Search for the school using Search Box API
      searchUniversity(schoolName);
      setIsEditing(false);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-10 w-80">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-4">
          <h2 className="card-title text-base">
            <span className="mr-1">🎓</span>
            Distance to School
          </h2>

          {searching && (
            <div className="flex items-center justify-center py-4">
              <span className="loading loading-spinner loading-sm mr-2"></span>
              <span className="text-sm">Searching university...</span>
            </div>
          )}

          {!school && !isEditing && !searching && (
            <div className="text-center py-2">
              <p className="text-sm text-base-content/70 mb-3">
                {initialUniversity 
                  ? 'Could not find your university. Try adding manually.'
                  : 'Add your school location to calculate travel time'}
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary btn-sm"
              >
                Add School
              </button>
            </div>
          )}

          {isEditing && (
            <div className="space-y-3">
              <div>
                <label className="label">
                  <span className="label-text text-sm">School Name</span>
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g., HCMC University of Technology"
                  className="input input-sm w-full"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="btn btn-primary btn-sm flex-1"
                  disabled={!schoolName}
                >
                  Search & Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {school && !isEditing && !searching && (
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-sm">{school.name}</p>
                <p className="text-xs text-base-content/70">{school.address}</p>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-4">
                  <span className="loading loading-spinner loading-sm"></span>
                </div>
              )}

              {routeInfo && !loading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-base-content/70">Distance:</span>
                    <span className="badge badge-neutral">
                      {MapboxService.formatDistance(routeInfo.distance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-base-content/70">Duration:</span>
                    <span className="badge badge-primary">
                      {MapboxService.formatDuration(routeInfo.duration)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-base-content/70">Mode:</span>
                    <span className="badge badge-ghost">
                      {routeInfo.mode === 'walking' && '🚶 Walking'}
                      {routeInfo.mode === 'driving' && '🚗 Driving'}
                      {routeInfo.mode === 'cycling' && '🚴 Cycling'}
                      {routeInfo.mode === 'driving-traffic' && '🏍️ Motorcycle'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={onCalculate}
                  className="btn btn-primary btn-sm flex-1"
                  disabled={loading}
                >
                  Calculate Route
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-ghost btn-sm btn-square"
                  aria-label="Edit"
                >
                  ✏️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
