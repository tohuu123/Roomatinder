'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { UserProfile } from '@/types/profile';
import { IceBreakerSuggestion } from '@/types/icebreaker';

interface MatchNotificationModalProps {
  matchedUser: {
    userId: string;
    userName: string;
    userPhoto?: string;
    userSlug?: string;
  };
  currentUserProfile: UserProfile;
  matchedUserProfile?: UserProfile;
  onClose: () => void;
  onChatNow: (message?: string) => void;
}

export default function MatchNotificationModal({
  matchedUser,
  currentUserProfile,
  matchedUserProfile,
  onClose,
  onChatNow,
}: MatchNotificationModalProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<IceBreakerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  useEffect(() => {
    if (matchedUserProfile) {
      fetchSuggestions();
    }
  }, [matchedUserProfile]);

  const fetchSuggestions = async () => {
    if (!matchedUserProfile) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ice-breaker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meProfile: currentUserProfile,
          partnerProfile: matchedUserProfile,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching ice breakers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (message?: string) => {
    onChatNow(message);
    onClose();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center mb-4">
            <Icon icon="mdi:heart-multiple" className="w-16 h-16 text-error animate-pulse" />
          </div>
          <h3 className="font-bold text-3xl mb-2">It's a Match! 🎉</h3>
          <p className="text-base-content/70">
            You and {matchedUser.userName} liked each other!
          </p>
        </div>

        {/* User Info */}
        <div className="flex justify-center mb-6">
          <div className="avatar">
            <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              {matchedUser.userPhoto ? (
                <Image
                  src={matchedUser.userPhoto}
                  alt={matchedUser.userName}
                  width={96}
                  height={96}
                  className="rounded-full"
                  unoptimized
                />
              ) : (
                <div className="bg-primary flex items-center justify-center w-full h-full">
                  <Icon icon="mdi:account" className="text-primary-content text-4xl" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ice Breaker Suggestions */}
        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-center mb-4">Start the conversation:</h4>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedSuggestion === suggestion.text
                    ? 'border-primary bg-primary/10'
                    : 'border-base-300 hover:border-primary/50 hover:bg-base-200'
                }`}
                onClick={() => setSelectedSuggestion(suggestion.text)}
              >
                {suggestion.reason && (
                  <p className="text-xs text-base-content/50 mb-2">
                    💡 {suggestion.reason}
                  </p>
                )}
                <p className="text-sm font-medium">{suggestion.text}</p>
              </button>
            ))}
            
            {/* Manual Message Option */}
            <button
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedSuggestion === 'manual'
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 hover:border-primary/50 hover:bg-base-200'
              }`}
              onClick={() => setSelectedSuggestion('manual')}
            >
              <p className="text-xs text-base-content/50 mb-2">
                ✏️ Or write your own...
              </p>
              <p className="text-sm font-medium">Compose your own message</p>
            </button>
          </div>
        ) : null}

        {/* Actions */}
        <div className="modal-action flex-col sm:flex-row gap-3">
          <button
            className="btn btn-outline flex-1"
            onClick={() => {
              if (matchedUser.userSlug) {
                router.push(`/profile/${matchedUser.userSlug}`);
              } else {
                router.push(`/profile/${matchedUser.userId}`);
              }
              onClose();
            }}
          >
            <Icon icon="mdi:account" className="w-5 h-5" />
            View Profile
          </button>
          
          <button
            className="btn btn-primary flex-1"
            onClick={() => {
              if (selectedSuggestion && selectedSuggestion !== 'manual') {
                handleSendMessage(selectedSuggestion);
              } else {
                handleSendMessage();
              }
            }}
          >
            <Icon icon="mdi:chat" className="w-5 h-5" />
            {selectedSuggestion && selectedSuggestion !== 'manual' ? 'Send & Chat' : 'Chat Now'}
          </button>
        </div>

        {/* Close Button */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
