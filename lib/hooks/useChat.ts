// Custom Hooks for Chat Functionality

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Chat,
  Message,
  ChatListItem,
  UserStatus,
  ChatNotification,
  CreateMessageData,
  MessageType,
} from '@/types/chat';
import {
  subscribeToUserChats,
  subscribeToChatMessages,
  subscribeToUserStatus,
  subscribeToUsersStatus,
  subscribeToUserNotifications,
  sendMessage,
  markChatAsRead,
  markMessageAsRead,
  setTypingIndicator,
  updateUserOnlineStatus,
  createChat,
} from '@/lib/chatService';
import { Timestamp } from 'firebase/firestore';

// ============= useUserChats Hook =============

export function useUserChats(userId: string | null) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserChats(userId, (updatedChats) => {
      setChats(updatedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { chats, loading, error };
}

// ============= useChatMessages Hook =============

export function useChatMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToChatMessages(chatId, (updatedMessages) => {
      setMessages(updatedMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  return { messages, loading, error };
}

// ============= useSendMessage Hook =============

export function useSendMessage(
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar?: string
) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (data: CreateMessageData) => {
      if (!currentUserId) {
        setError('User not authenticated');
        return null;
      }

      setSending(true);
      setError(null);

      try {
        const messageId = await sendMessage(
          currentUserId,
          currentUserName,
          data,
          currentUserAvatar
        );
        setSending(false);
        return messageId;
      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message');
        setSending(false);
        return null;
      }
    },
    [currentUserId, currentUserName, currentUserAvatar]
  );

  return { send, sending, error };
}

// ============= useTypingIndicator Hook =============

export function useTypingIndicator(chatId: string | null, userId: string | null) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback(() => {
    if (!chatId || !userId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing indicator
    setTypingIndicator(chatId, userId, true);

    // Auto-clear after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setTypingIndicator(chatId, userId, false);
    }, 3000);
  }, [chatId, userId]);

  const stopTyping = useCallback(() => {
    if (!chatId || !userId) return;

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Clear typing indicator
    setTypingIndicator(chatId, userId, false);
  }, [chatId, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (chatId && userId) {
        setTypingIndicator(chatId, userId, false);
      }
    };
  }, [chatId, userId]);

  return { startTyping, stopTyping };
}

// ============= useOnlineStatus Hook =============

export function useOnlineStatus(userId: string | null) {
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserStatus(userId, (updatedStatus) => {
      setStatus(updatedStatus);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { status, loading };
}

// ============= useMultipleOnlineStatus Hook =============

export function useMultipleOnlineStatus(userIds: string[]) {
  const [statuses, setStatuses] = useState<{ [userId: string]: UserStatus }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userIds.length) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUsersStatus(userIds, (updatedStatuses) => {
      setStatuses(updatedStatuses);
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(userIds)]);

  return { statuses, loading };
}

// ============= useUserOnlinePresence Hook =============

export function useUserOnlinePresence(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    // Set online when component mounts
    updateUserOnlineStatus(userId, true);

    // Set offline when tab is closed or refreshed
    const handleBeforeUnload = () => {
      updateUserOnlineStatus(userId, false);
    };

    // Set offline when window loses focus (optional)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateUserOnlineStatus(userId, false);
      } else {
        updateUserOnlineStatus(userId, true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Update online status every 5 minutes as heartbeat
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        updateUserOnlineStatus(userId, true);
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      updateUserOnlineStatus(userId, false);
    };
  }, [userId]);
}

// ============= useNotifications Hook =============

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserNotifications(
      userId,
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
        setUnreadCount(updatedNotifications.filter((n) => !n.read).length);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { notifications, unreadCount, loading };
}

// ============= useMarkAsRead Hook =============

export function useMarkAsRead() {
  const markChatRead = useCallback(
    async (chatId: string, userId: string) => {
      try {
        await markChatAsRead(chatId, userId);
      } catch (error) {
        console.error('Error marking chat as read:', error);
      }
    },
    []
  );

  const markMessageRead = useCallback(
    async (chatId: string, messageId: string, userId: string) => {
      try {
        await markMessageAsRead(chatId, messageId, userId);
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    },
    []
  );

  return { markChatRead, markMessageRead };
}

// ============= useChatListItems Hook =============

export function useChatListItems(
  userId: string | null,
  chats: Chat[]
): ChatListItem[] {
  const participantIds = chats.flatMap((chat) =>
    chat.participants.filter((id) => id !== userId)
  );
  const { statuses } = useMultipleOnlineStatus(participantIds);

  return chats.map((chat) => {
    let chatListItem: ChatListItem = {
      ...chat,
      currentUserUnreadCount: userId ? chat.unreadCount?.[userId] || 0 : 0,
      isTyping: false,
      typingUserNames: [],
    };

    // For individual chats, get other user's info
    if (chat.type === 'individual' && userId) {
      const otherUserId = chat.participants.find((id) => id !== userId);
      if (otherUserId) {
        const otherUserDetails = chat.participantDetails?.[otherUserId];
        const otherUserStatus = statuses[otherUserId];

        chatListItem.otherUserName = otherUserDetails?.name || 'Unknown User';
        chatListItem.otherUserAvatar = otherUserDetails?.avatar;
        chatListItem.otherUserOnline = otherUserStatus?.online || false;
        chatListItem.otherUserLastSeen = otherUserStatus?.lastSeen;
      }
    }

    // Check if someone is typing
    if (chat.typingUsers && chat.typingUsers.length > 0) {
      const typingOthers = chat.typingUsers.filter((id) => id !== userId);
      if (typingOthers.length > 0) {
        chatListItem.isTyping = true;
        chatListItem.typingUserNames = typingOthers.map((id) => {
          const details = chat.participantDetails?.[id];
          return details?.name || 'Someone';
        });
      }
    }

    return chatListItem;
  });
}

// ============= useCreateChat Hook =============

export function useCreateChat(currentUserId: string) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (
      type: 'individual' | 'group',
      participantIds: string[],
      name?: string,
      avatar?: string
    ) => {
      if (!currentUserId) {
        setError('User not authenticated');
        return null;
      }

      setCreating(true);
      setError(null);

      try {
        const chatId = await createChat(currentUserId, {
          type,
          participants: [currentUserId, ...participantIds],
          name,
          avatar,
        });
        setCreating(false);
        return chatId;
      } catch (err) {
        console.error('Error creating chat:', err);
        setError('Failed to create chat');
        setCreating(false);
        return null;
      }
    },
    [currentUserId]
  );

  return { create, creating, error };
}

// ============= useFileUpload Hook =============

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File, type: MessageType) => {
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      return 'File size exceeds 50MB limit';
    }

    if (type === 'image') {
      if (!file.type.startsWith('image/')) {
        return 'File must be an image';
      }
    } else if (type === 'video') {
      if (!file.type.startsWith('video/')) {
        return 'File must be a video';
      }
    }

    return null;
  }, []);

  const upload = useCallback(
    async (file: File, type: MessageType) => {
      const validationError = validateFile(file, type);
      if (validationError) {
        setError(validationError);
        return null;
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Upload logic is handled in sendMessage
        setUploading(false);
        setProgress(100);
        return file;
      } catch (err) {
        console.error('Error uploading file:', err);
        setError('Failed to upload file');
        setUploading(false);
        return null;
      }
    },
    [validateFile]
  );

  return { upload, uploading, progress, error };
}
