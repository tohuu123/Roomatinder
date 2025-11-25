// Helper function to create chat from matches

import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/firebase';
import { createChat } from '@/lib/chatService';
import { UserProfile } from '@/types/profile';

/**
 * Create or get existing chat between matched users
 */
export async function createChatFromMatch(
  currentUserId: string,
  matchedUserId: string
): Promise<string | null> {
  try {
    // Fetch both user profiles to get participant details
    const currentUserDoc = await getDoc(doc(db, 'profiles', currentUserId));
    const matchedUserDoc = await getDoc(doc(db, 'profiles', matchedUserId));

    if (!currentUserDoc.exists() || !matchedUserDoc.exists()) {
      throw new Error('User profile not found');
    }

    const currentUserProfile = currentUserDoc.data() as UserProfile;
    const matchedUserProfile = matchedUserDoc.data() as UserProfile;

    // Create participant details
    const participantDetails = {
      [currentUserId]: {
        name: currentUserProfile.displayName || 'User',
        avatar: currentUserProfile.photoURL,
      },
      [matchedUserId]: {
        name: matchedUserProfile.displayName || 'User',
        avatar: matchedUserProfile.photoURL,
      },
    };

    // Create chat - createChat will handle checking for existing chat
    const chatId = await createChat(currentUserId, {
      type: 'individual',
      participants: [currentUserId, matchedUserId],
    });

    if (!chatId) {
      throw new Error('Failed to create chat');
    }

    // Update chat with participant details
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      participantDetails,
    });

    return chatId;
  } catch (error) {
    console.error('Error creating chat from match:', error);
    throw error; // Throw error to see actual message
  }
}

/**
 * Check if chat exists between two users
 */
export function checkChatExists(
  userId1: string,
  userId2: string,
  chats: any[]
): string | null {
  const existingChat = chats.find(
    (chat) =>
      chat.type === 'individual' &&
      chat.participants.includes(userId1) &&
      chat.participants.includes(userId2)
  );

  return existingChat ? existingChat.id : null;
}
