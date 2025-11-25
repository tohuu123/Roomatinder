// Chat Type Definitions for Roomatinder

import { Timestamp } from 'firebase/firestore';

// Message Status
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

// Message Types
export type MessageType = 'text' | 'image' | 'video' | 'file';

// Chat Types
export type ChatType = 'individual' | 'group';

// Message Interface
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  timestamp: Timestamp;
  editedAt?: Timestamp;
  deletedAt?: Timestamp;
  replyTo?: string; // Message ID being replied to
  
  // For media messages
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
  mediaThumbnail?: string;
  
  // Read receipts
  readBy?: string[]; // Array of user IDs who have read the message
  deliveredTo?: string[]; // Array of user IDs who have received the message
}

// Chat Interface
export interface Chat {
  id: string;
  type: ChatType;
  participants: string[]; // Array of user IDs
  participantDetails?: {
    [userId: string]: {
      name: string;
      avatar?: string;
      online?: boolean;
      lastSeen?: Timestamp;
    }
  };
  
  // Group chat specific
  name?: string; // For group chats
  avatar?: string; // For group chats
  admins?: string[]; // Group admin user IDs
  
  // Last message info
  lastMessage?: string;
  lastMessageType?: MessageType;
  lastMessageTime?: Timestamp;
  lastMessageSenderId?: string;
  
  // Unread counts per user
  unreadCount?: {
    [userId: string]: number;
  };
  
  // Typing indicators
  typingUsers?: string[]; // Array of user IDs currently typing
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  
  // Settings
  muted?: {
    [userId: string]: boolean;
  };
  archived?: {
    [userId: string]: boolean;
  };
}

// User Online Status
export interface UserStatus {
  userId: string;
  online: boolean;
  lastSeen: Timestamp;
  deviceInfo?: string;
}

// Typing Indicator
export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: Timestamp;
}

// Notification
export interface ChatNotification {
  id: string;
  userId: string; // Recipient user ID
  chatId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: MessageType;
  timestamp: Timestamp;
  read: boolean;
  clicked: boolean;
}

// File Upload Progress
export interface FileUploadProgress {
  messageId: string;
  progress: number; // 0-100
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

// Chat Creation Data
export interface CreateChatData {
  type: ChatType;
  participants: string[];
  name?: string; // For group chats
  avatar?: string; // For group chats
}

// Message Creation Data
export interface CreateMessageData {
  chatId: string;
  content: string;
  type: MessageType;
  replyTo?: string;
  mediaFile?: File;
}

// Helper type for message groups (grouped by date)
export interface MessageGroup {
  date: string;
  messages: Message[];
}

// Chat List Item (with computed values)
export interface ChatListItem extends Chat {
  otherUserName?: string; // For 1-1 chats
  otherUserAvatar?: string;
  otherUserOnline?: boolean;
  otherUserLastSeen?: Timestamp;
  currentUserUnreadCount: number;
  isTyping?: boolean;
  typingUserNames?: string[];
}

// Match Status (for creating chats from matches)
export interface MatchStatus {
  userId: string;
  matchedUserId: string;
  chatId?: string;
  matchedAt: Timestamp;
}
