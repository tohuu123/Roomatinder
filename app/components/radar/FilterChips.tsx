'use client';

import React from 'react';
import { RadarFilter } from '@/types/radar';

interface FilterChipsProps {
  filters: RadarFilter[];
  onFilterToggle: (filterId: string) => void;
}

export default function FilterChips({ filters, onFilterToggle }: FilterChipsProps) {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-4xl px-4">
      <div className="bg-base-100 rounded-box shadow-lg p-3">
        <div className="flex flex-wrap gap-2 justify-center">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterToggle(filter.id)}
              className={`btn btn-sm ${
                filter.active ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              {filter.icon && <span className="mr-1">{filter.icon}</span>}
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
