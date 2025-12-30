'use client';

import React from 'react';
import { POI } from '@/types/radar';
import { MapboxService } from '@/lib/mapboxService';

interface POIInfoCardProps {
  poi: POI | null;
  userLocation: [number, number];
  onClose: () => void;
  onGetDirections: (poi: POI) => void;
}

export default function POIInfoCard({
  poi,
  userLocation,
  onClose,
  onGetDirections
}: POIInfoCardProps) {
  if (!poi) return null;

  const distanceText = poi.distance 
    ? MapboxService.formatDistance(poi.distance)
    : 'N/A';

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="card-title text-lg">{poi.name}</h3>
              <p className="text-sm text-base-content/70 mt-1">
                {poi.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
              {poi.address && (
                <p className="text-xs text-base-content/60 mt-1">{poi.address}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="badge badge-neutral">
              📍 {distanceText}
            </div>
            <button
              onClick={() => onGetDirections(poi)}
              className="btn btn-primary btn-sm flex-1"
            >
              <span className="mr-1">🧭</span>
              Get Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
