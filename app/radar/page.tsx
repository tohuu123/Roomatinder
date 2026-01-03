'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getProfile } from '@/lib/profileService';
import { UserProfile } from '@/types/profile';
import LocationReviewModal from '@/app/components/radar/LocationReviewModal';

// Dynamically import RadarMap to avoid SSR issues with mapbox
const RadarMap = dynamic(
  () => import('@/app/components/radar/RadarMap'),
  { ssr: false }
);

// HCMC Districts coordinates mapping
const DISTRICT_COORDS: { [key: string]: [number, number] } = {
  'District 1': [106.7009, 10.7756],
  'District 2': [106.7462, 10.7819],
  'District 3': [106.6843, 10.7822],
  'District 4': [106.7048, 10.7593],
  'District 5': [106.6805, 10.7545],
  'District 6': [106.6371, 10.7493],
  'District 7': [106.7228, 10.7328],
  'District 8': [106.6761, 10.7290],
  'District 9': [106.7978, 10.8297],
  'District 10': [106.6713, 10.7724],
  'District 11': [106.6504, 10.7641],
  'District 12': [106.6982, 10.8633],
  'Binh Tan': [106.6070, 10.7938],
  'Binh Thanh': [106.7156, 10.8011],
  'Go Vap': [106.6828, 10.8376],
  'Phu Nhuan': [106.6836, 10.7990],
  'Tan Binh': [106.6528, 10.8006],
  'Tan Phu': [106.6285, 10.7819],
  'Thu Duc': [106.7668, 10.8509],
};

export default function RadarPage() {
  const [center, setCenter] = useState<[number, number]>([106.6297, 10.8231]);
  const [propertyName, setPropertyName] = useState('My Location');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [addressInput, setAddressInput] = useState('');
  const [reviewData, setReviewData] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [radiusKm, setRadiusKm] = useState(1);

  // Handle AI Area Review
  const handleAIReview = async () => {
    try {
      setIsLoadingReview(true);
      
      const response = await fetch('/api/location-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locationName: propertyName,
          address: propertyAddress,
          longitude: center[0],
          latitude: center[1],
          radius: radiusKm,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI review');
      }

      const data = await response.json();
      setReviewData(data);
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error getting AI review:', error);
      alert('Failed to get AI area analysis. Please try again.');
    } finally {
      setIsLoadingReview(false);
    }
  };

  // Search address using Mapbox Search Box API
  const handleGeocodeAddress = async () => {
    if (!addressInput.trim()) return;

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      // Use Search Box API for better place/address search
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?` +
        `q=${encodeURIComponent(addressInput)}&` +
        `language=vi&` +
        `country=vn&` +
        `proximity=106.6297,10.8231&` + // Bias towards HCMC
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
          const placeName = feature.properties.name || feature.properties.full_address || addressInput;
          const placeAddress = feature.properties.full_address || feature.properties.place_formatted || '';
          setCenter([lng, lat]);
          setPropertyName(placeName);
          setPropertyAddress(placeAddress);
          setShowLocationInput(false);
        }
      } else {
        alert('Location not found. Please try a different address.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Could not find location. Please try again.');
    }
  };

  // Load user profile and set location
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await getProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
            
            // If user has room with coordinates, use them
            if (profile.accommodationStatus === 'have-room' && profile.coordinates) {
              setCenter(profile.coordinates);
              setPropertyName(`${profile.displayName || 'My'}'s Room`);
            } 
            // If user has room but no coordinates, try to use district
            else if (profile.accommodationStatus === 'have-room' && profile.districts && profile.districts.length > 0) {
              const district = profile.districts[0];
              const coords = DISTRICT_COORDS[district];
              if (coords) {
                setCenter(coords);
                setPropertyName(`${profile.displayName || 'My'}'s Room (${district})`);
              }
            }
            // For "looking" users, they can manually set location
            else if (profile.accommodationStatus === 'looking') {
              // Check if they have preferred districts
              if (profile.districts && profile.districts.length > 0) {
                const district = profile.districts[0];
                const coords = DISTRICT_COORDS[district];
                if (coords) {
                  setCenter(coords);
                  setPropertyName(`Exploring ${district}`);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-base-100/90 backdrop-blur-sm shadow-md">
        <div className="navbar">
          <div className="navbar-start">
            <a href="/" className="btn btn-ghost text-xl">
              🏠 Roomatinder
            </a>
          </div>
          <div className="navbar-center">
            <h1 className="text-lg font-bold">Radar</h1>
          </div>
          <div className="navbar-end gap-2">
            <button
              onClick={handleAIReview}
              disabled={isLoadingReview}
              className="btn btn-primary btn-sm"
              title="Get AI analysis of this area"
            >
              {isLoadingReview ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  AI Review
                </>
              )}
            </button>
            <button
              onClick={() => setShowLocationInput(!showLocationInput)}
              className="btn btn-ghost btn-sm"
            >
              📍 Change Location
            </button>
          </div>
        </div>

        {/* Location input */}
        {showLocationInput && (
          <div className="px-4 pb-4">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body p-4">
                <h3 className="font-semibold text-sm mb-2">
                  {userProfile?.accommodationStatus === 'have-room' 
                    ? 'Update Property Location' 
                    : 'Set Location to Explore'}
                </h3>

                {/* Radius Selector for AI Review */}
                <div className="mb-3">
                  <label className="label">
                    <span className="label-text text-xs">AI Review Radius (for area analysis)</span>
                  </label>
                  <select
                    className="select select-sm w-full"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                  >
                    <option value={0.5}>500m</option>
                    <option value={1}>1km</option>
                    <option value={2}>2km</option>
                    <option value={3}>3km</option>
                  </select>
                </div>

                <div className="divider text-xs">LOCATION</div>
                
                {/* District Quick Select */}
                <div className="mb-3">
                  <label className="label">
                    <span className="label-text text-xs">Quick Select District</span>
                  </label>
                  <select
                    className="select select-sm w-full"
                    onChange={(e) => {
                      const district = e.target.value;
                      const coords = DISTRICT_COORDS[district];
                      if (coords) {
                        setCenter(coords);
                        setPropertyName(
                          userProfile?.accommodationStatus === 'have-room'
                            ? `My Room in ${district}`
                            : `Exploring ${district}`
                        );
                      }
                    }}
                  >
                    <option value="">Select a district...</option>
                    {Object.keys(DISTRICT_COORDS).map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="divider text-xs">OR</div>

                {/* Address/Location Search */}
                <div className="mb-3">
                  <label className="label">
                    <span className="label-text text-xs">Search by Address or Place</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder="e.g., Aeon Tan Phu, 123 Nguyen Hue St, Cong vien Le Thi Rieng"
                      className="input input-sm w-full"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleGeocodeAddress();
                        }
                      }}
                    />
                    <button
                      onClick={handleGeocodeAddress}
                      className="btn btn-sm btn-primary"
                    >
                      Search
                    </button>
                  </div>
                </div>

                <div className="divider text-xs">OR</div>

                {/* Manual Coordinates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">
                      <span className="label-text text-xs">Longitude</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={center[0]}
                      onChange={(e) => setCenter([parseFloat(e.target.value), center[1]])}
                      className="input input-sm w-full"
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text text-xs">Latitude</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={center[1]}
                      onChange={(e) => setCenter([center[0], parseFloat(e.target.value)])}
                      className="input input-sm w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">
                      <span className="label-text text-xs">Location Name</span>
                    </label>
                    <input
                      type="text"
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      placeholder="Enter location name"
                      className="input input-sm w-full"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowLocationInput(false)}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setShowLocationInput(false)}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <RadarMap 
          center={center} 
          propertyName={propertyName}
          propertyAddress={propertyAddress}
          university={userProfile?.university}
        />
      )}

      {/* Location Review Modal */}
      <LocationReviewModal
        review={reviewData}
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
      />
    </div>
  );
}
