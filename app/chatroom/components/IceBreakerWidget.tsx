'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import IceBreakerCard from './IceBreakerCard';
import { IceBreakerSuggestion } from '@/types/icebreaker';
import { UserProfile } from '@/types/profile';

interface IceBreakerWidgetProps {
  currentUserProfile: UserProfile;
  otherUserProfile: UserProfile;
  onSendMessage: (content: string, type: 'text') => void;
  disabled?: boolean;
}

export default function IceBreakerWidget({
  currentUserProfile,
  otherUserProfile,
  onSendMessage,
  disabled,
}: IceBreakerWidgetProps) {
  const [suggestions, setSuggestions] = useState<IceBreakerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);

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
      setError('Failed to generate suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/60">Generating conversation starters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Icon icon="mdi:alert-circle" className="w-12 h-12 text-error" />
        <p className="text-error">{error}</p>
        <button className="btn btn-primary btn-sm" onClick={fetchSuggestions}>
          <Icon icon="mdi:refresh" className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6 px-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Icon icon="mdi:robot-excited" className="w-8 h-8 text-primary" />
          <h3 className="text-2xl font-bold text-base-content">AI Ice Breaker</h3>
        </div>
        <p className="text-base-content/60 max-w-md">
          Not sure what to say? Try one of these conversation starters!
        </p>
      </div>

      {/* Scrollable Cards */}
      <div className="w-full max-w-5xl overflow-x-auto pb-4">
        <div className="flex gap-4 px-2">
          {suggestions.map((suggestion, index) => (
            <IceBreakerCard
              key={index}
              suggestion={suggestion}
              onSend={(text, type) => onSendMessage(text, type)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        className="btn btn-outline btn-sm"
        onClick={fetchSuggestions}
        disabled={loading || disabled}
      >
        <Icon icon="mdi:refresh" className="w-4 h-4" />
        Generate New Suggestions
      </button>
    </div>
  );
}
