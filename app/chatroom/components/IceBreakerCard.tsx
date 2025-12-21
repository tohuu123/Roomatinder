'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { IceBreakerSuggestion } from '@/types/icebreaker';

interface IceBreakerCardProps {
  suggestion: IceBreakerSuggestion;
  onSend: (text: string, type: 'text') => void;
  disabled?: boolean;
}

export default function IceBreakerCard({ suggestion, onSend, disabled }: IceBreakerCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getIconByType = (type: string) => {
    switch (type) {
      case 'common':
        return 'mdi:heart-multiple';
      case 'lifestyle':
        return 'mdi:home-heart';
      case 'curiosity':
        return 'mdi:head-question';
      default:
        return 'mdi:message-text';
    }
  };

  const getColorByType = (type: string) => {
    switch (type) {
      case 'common':
        return 'border-primary bg-primary/5';
      case 'lifestyle':
        return 'border-secondary bg-secondary/5';
      case 'curiosity':
        return 'border-accent bg-accent/5';
      default:
        return 'border-base-300 bg-base-100';
    }
  };

  return (
    <div
      className={`card card-border ${getColorByType(suggestion.type)} min-w-80 cursor-pointer transition-all duration-200 ${
        isHovered ? 'scale-105 shadow-lg' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !disabled && onSend(suggestion.text, 'text')}
    >
      <div className="card-body p-4 space-y-3">
        {/* Icon and Type */}
        <div className="flex items-center gap-2">
          <Icon icon={getIconByType(suggestion.type)} className="w-5 h-5 text-base-content/70" />
          <span className="text-xs text-base-content/50 uppercase font-medium">
            {suggestion.type === 'common' && 'Common Interest'}
            {suggestion.type === 'lifestyle' && 'Lifestyle Match'}
            {suggestion.type === 'curiosity' && 'Curious Question'}
          </span>
        </div>

        {/* Reason */}
        {suggestion.reason && (
          <p className="text-sm text-base-content/60 italic">
            💡 {suggestion.reason}
          </p>
        )}

        {/* Message Text */}
        <p className="text-base font-medium text-base-content">
          {suggestion.text}
        </p>

        {/* Send Button */}
        <div className="card-actions justify-end">
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onSend(suggestion.text, 'text');
            }}
            disabled={disabled}
          >
            <Icon icon="mdi:send" className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
