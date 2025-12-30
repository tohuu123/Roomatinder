/**
 * Example: How to integrate Area Radar into a property listing page
 * 
 * This shows how you can embed the radar map directly in property details
 */

'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Import RadarMap dynamically to avoid SSR issues
const RadarMap = dynamic(
  () => import('@/app/components/radar/RadarMap'),
  { ssr: false }
);

// Example property data structure
interface Property {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
  price: number;
  description: string;
  // ... other property fields
}

export default function PropertyDetailWithRadar() {
  // Example property data
  const property: Property = {
    id: '123',
    name: 'Cozy Studio Apartment',
    address: '123 Nguyen Hue Street, District 1, Ho Chi Minh City',
    coordinates: [106.6297, 10.8231],
    price: 5000000,
    description: 'Beautiful studio in the heart of the city',
  };

  const [showRadar, setShowRadar] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Property Header */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h1 className="card-title text-3xl">{property.name}</h1>
          <p className="text-base-content/70">{property.address}</p>
          <div className="badge badge-primary badge-lg">
            {property.price.toLocaleString()} VND/month
          </div>
        </div>
      </div>

      {/* Property Images */}
      <div className="mb-6">
        {/* Image gallery here */}
      </div>

      {/* Property Description */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Description</h2>
          <p>{property.description}</p>
        </div>
      </div>

      {/* Area Radar Section */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">📡 Explore the Area</h2>
            <button
              onClick={() => setShowRadar(!showRadar)}
              className="btn btn-primary"
            >
              {showRadar ? 'Hide Radar' : 'Show Radar'}
            </button>
          </div>

          {showRadar && (
            <div className="relative h-[600px] rounded-box overflow-hidden">
              <RadarMap
                center={property.coordinates}
                propertyName={property.name}
              />
            </div>
          )}

          {!showRadar && (
            <div className="text-center py-8">
              <p className="text-base-content/70 mb-4">
                Discover what's around this property with our interactive radar map
              </p>
              <ul className="list-disc list-inside text-sm text-base-content/60 max-w-md mx-auto text-left">
                <li>Find nearby hospitals, shops, and restaurants</li>
                <li>Calculate distance to your school</li>
                <li>Get AI-powered area analysis</li>
                <li>See all amenities within 3km radius</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Contact</h2>
          <button className="btn btn-primary">Schedule Viewing</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Alternative: Inline Embedded Version (Smaller)
 */
export function PropertyCardWithRadarButton({ property }: { property: Property }) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <figure className="px-4 pt-4">
        {/* Property image */}
      </figure>
      <div className="card-body">
        <h2 className="card-title">{property.name}</h2>
        <p className="text-sm text-base-content/70">{property.address}</p>
        <div className="badge badge-primary">
          {property.price.toLocaleString()} VND/month
        </div>
        <div className="card-actions justify-end mt-4">
          <a
            href={`/radar?lng=${property.coordinates[0]}&lat=${property.coordinates[1]}&name=${encodeURIComponent(property.name)}`}
            className="btn btn-outline btn-sm"
          >
            📡 Explore Area
          </a>
          <button className="btn btn-primary btn-sm">View Details</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Alternative: Direct Embed in Property Page
 */
export function PropertyPageWithEmbeddedRadar({ property }: { property: Property }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Left: Property Details */}
      <div className="space-y-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-2xl">{property.name}</h1>
            <p>{property.description}</p>
            <div className="divider"></div>
            <div className="stats stats-vertical shadow">
              <div className="stat">
                <div className="stat-title">Monthly Rent</div>
                <div className="stat-value text-primary">
                  {property.price.toLocaleString()}
                </div>
                <div className="stat-desc">VND/month</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Radar Map */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-0">
          <div className="h-[600px] rounded-box overflow-hidden">
            <RadarMap
              center={property.coordinates}
              propertyName={property.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Usage in Next.js Page Router:
 * 
 * // pages/property/[id].tsx
 * import PropertyDetailWithRadar from '@/components/PropertyDetailWithRadar';
 * 
 * export default function PropertyPage() {
 *   return <PropertyDetailWithRadar />;
 * }
 */

/**
 * Usage with URL Parameters:
 * 
 * // app/radar/page.tsx - Update to read URL params
 * const searchParams = useSearchParams();
 * const lng = parseFloat(searchParams.get('lng') || '106.6297');
 * const lat = parseFloat(searchParams.get('lat') || '10.8231');
 * const name = searchParams.get('name') || 'Property';
 * 
 * return <RadarMap center={[lng, lat]} propertyName={name} />;
 */
