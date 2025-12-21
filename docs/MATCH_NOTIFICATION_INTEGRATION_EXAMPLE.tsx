// Example Integration Guide for Match Notification Modal with Ice Breakers

/**
 * This file demonstrates how to integrate the MatchNotificationModal
 * into your app's notification system.
 * 
 * You can add this to your layout.tsx or a dedicated notifications component.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import MatchNotificationModal from '@/app/components/MatchNotificationModal';
import { createChatWithIceBreaker } from '@/lib/iceBreakerService';
import { UserProfile } from '@/types/profile';

// Example: Handling match notifications in your component

function YourComponent() {
  const router = useRouter();
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUserData, setMatchedUserData] = useState<{
    userId: string;
    userName: string;
    userPhoto?: string;
    userSlug?: string;
  } | null>(null);
  const [matchedUserProfile, setMatchedUserProfile] = useState<UserProfile | null>(null);

  // When a new match is detected
  const handleNewMatch = async (matchedUserId: string, matchedUserInfo: any) => {
    // Fetch the matched user's full profile for ice breaker generation
    try {
      const profileRef = doc(db, 'profiles', matchedUserId);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        setMatchedUserProfile(profileDoc.data() as UserProfile);
        setMatchedUserData(matchedUserInfo);
        setShowMatchModal(true);
      }
    } catch (error) {
      console.error('Error fetching matched user profile:', error);
      // Still show modal without ice breakers
      setMatchedUserData(matchedUserInfo);
      setShowMatchModal(true);
    }
  };

  // Handle "Chat Now" action from modal
  const handleChatNow = async (initialMessage?: string) => {
    if (!matchedUserData || !currentUserProfile) return;

    try {
      // Create chat with optional ice breaker message
      const chatId = await createChatWithIceBreaker({
        currentUserId: currentUserProfile.userId,
        currentUserName: currentUserProfile.displayName || 'User',
        currentUserAvatar: currentUserProfile.photoURL,
        partnerId: matchedUserData.userId,
        initialMessage: initialMessage,
      });

      // Navigate to the chat
      router.push(`/chatroom?chatId=${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      // Fallback: just navigate to chatroom
      router.push('/chatroom');
    }
  };

  return (
    <>
      {/* Your existing component JSX */}
      
      {/* Match Notification Modal */}
      {showMatchModal && matchedUserData && currentUserProfile && (
        <MatchNotificationModal
          matchedUser={matchedUserData}
          currentUserProfile={currentUserProfile}
          matchedUserProfile={matchedUserProfile || undefined}
          onClose={() => {
            setShowMatchModal(false);
            setMatchedUserData(null);
            setMatchedUserProfile(null);
          }}
          onChatNow={handleChatNow}
        />
      )}
    </>
  );
}

/**
 * Integration Steps:
 * 
 * 1. Import the necessary components and services
 * 2. Add state for modal visibility and matched user data
 * 3. Fetch matched user's profile when match occurs
 * 4. Show modal with ice breaker suggestions
 * 5. Handle chat creation with optional initial message
 * 
 * The modal will automatically:
 * - Generate 3 ice breaker suggestions based on both profiles
 * - Show match celebration UI
 * - Allow user to select a suggestion or write their own
 * - Create chat and send initial message when "Chat Now" is clicked
 */

export default YourComponent;
