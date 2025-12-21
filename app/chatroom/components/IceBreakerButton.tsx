'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { IceBreakerSuggestion } from '@/types/icebreaker';
import { UserProfile } from '@/types/profile';

interface IceBreakerButtonProps {
  currentUserProfile: UserProfile;
  otherUserProfile: UserProfile;
  onSelectSuggestion: (text: string) => void;
  disabled?: boolean;
}

export default function IceBreakerButton({
  currentUserProfile,
  otherUserProfile,
  onSelectSuggestion,
  disabled,
}: IceBreakerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<IceBreakerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/ice-breaker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meProfile: currentUserProfile,
          partnerProfile: otherUserProfile,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ice breakers');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Error fetching ice breakers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (suggestions.length === 0) {
      fetchSuggestions();
    }
  };

  const handleSelect = (text: string) => {
    onSelectSuggestion(text);
    setIsOpen(false);
  };

  return (
    <div className="dropdown dropdown-top dropdown-end" style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-circle btn-ghost"
        onClick={handleOpen}
        disabled={disabled}
        title="AI Suggestions"
      >
        <Icon icon="mdi:robot-excited" className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown content */}
          <div
            className="card card-border bg-base-100 w-96 max-h-96 overflow-y-auto shadow-xl"
            style={{ 
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: '0.5rem',
              zIndex: 9999
            }}
          >
          <div className="card-body p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:robot-excited" className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">AI Suggestions</h4>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-circle"
                onClick={() => setIsOpen(false)}
              >
                <Icon icon="mdi:close" className="w-4 h-4" />
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            )}

            {/* Suggestions List */}
            {!loading && suggestions.length > 0 && (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left p-3 rounded-lg hover:bg-base-200 transition-colors border border-base-300"
                    onClick={() => handleSelect(suggestion.text)}
                  >
                    {suggestion.reason && (
                      <p className="text-xs text-base-content/50 mb-1">
                        💡 {suggestion.reason}
                      </p>
                    )}
                    <p className="text-sm">{suggestion.text}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Refresh Button */}
            {!loading && suggestions.length > 0 && (
              <button
                type="button"
                className="btn btn-outline btn-sm w-full"
                onClick={fetchSuggestions}
              >
                <Icon icon="mdi:refresh" className="w-4 h-4" />
                Generate New
              </button>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
