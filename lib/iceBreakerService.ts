// Ice Breaker Service - Handles creating chats and sending ice breaker messages

import { createChat, sendMessage } from './chatService';

export interface CreateChatWithMessageParams {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  partnerId: string;
  initialMessage?: string;
}

/**
 * Creates a new chat and optionally sends an initial ice breaker message
 * Returns the chat ID
 */
export async function createChatWithIceBreaker({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  partnerId,
  initialMessage,
}: CreateChatWithMessageParams): Promise<string> {
  try {
    // Create the chat
    const chatId = await createChat(currentUserId, {
      type: 'individual',
      participants: [currentUserId, partnerId],
    });

    // If there's an initial message, send it
    if (initialMessage && initialMessage.trim()) {
      await sendMessage(
        currentUserId,
        currentUserName,
        {
          chatId,
          content: initialMessage.trim(),
          type: 'text',
        },
        currentUserAvatar
      );
    }

    return chatId;
  } catch (error) {
    console.error('Error creating chat with ice breaker:', error);
    throw error;
  }
}
