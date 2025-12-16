// Chat Utility Functions

import { Message, MessageGroup } from '@/types/chat';
import { Timestamp } from 'firebase/firestore';

/**
 * Format timestamp to readable time
 */
export function formatMessageTime(timestamp: Timestamp | Date): string {
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60000) {
    return 'Vừa xong';
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} phút trước`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} giờ trước`;
  }

  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} ngày trước`;
  }

  // Show date
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format time for message (short format)
 */
export function formatShortTime(timestamp: Timestamp | Date): string {
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format last seen time
 */
export function formatLastSeen(timestamp: Timestamp | Date): string {
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60000) {
    return 'Vừa xem';
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `Xem ${minutes} phút trước`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `Xem ${hours} giờ trước`;
  }

  // Show date and time
  return `Xem ${date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  })} lúc ${date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/**
 * Group messages by date
 */
export function groupMessagesByDate(messages: Message[]): MessageGroup[] {
  const groups: { [key: string]: Message[] } = {};

  messages.forEach((message) => {
    // Skip messages without timestamp
    if (!message.timestamp) return;
    
    const date = message.timestamp instanceof Timestamp 
      ? message.timestamp.toDate() 
      : new Date(message.timestamp);
    
    // Validate date
    if (isNaN(date.getTime())) return;
    
    const dateKey = date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });

  return Object.entries(groups).map(([date, messages]) => ({
    date,
    messages,
  }));
}

/**
 * Get date separator label
 */
export function getDateSeparatorLabel(dateString: string): string {
  const date = new Date(dateString.split('/').reverse().join('-'));
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return 'Hôm nay';
  }

  if (date.getTime() === yesterday.getTime()) {
    return 'Hôm qua';
  }

  return dateString;
}

/**
 * Truncate message for preview
 */
export function truncateMessage(message: string, maxLength: number = 50): string {
  if (message.length <= maxLength) {
    return message;
  }
  return message.substring(0, maxLength) + '...';
}

/**
 * Get message preview text based on type
 */
export function getMessagePreview(
  content: string,
  type: string,
  senderName?: string
): string {
  let preview = '';

  switch (type) {
    case 'image':
      preview = '📷 Hình ảnh';
      break;
    case 'video':
      preview = '🎥 Video';
      break;
    case 'file':
      preview = '📎 Tệp đính kèm';
      break;
    default:
      preview = truncateMessage(content);
  }

  return senderName ? `${senderName}: ${preview}` : preview;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get typing indicator text
 */
export function getTypingText(userNames: string[]): string {
  if (userNames.length === 0) return '';
  if (userNames.length === 1) return `${userNames[0]} đang nhập...`;
  if (userNames.length === 2) return `${userNames[0]} và ${userNames[1]} đang nhập...`;
  return `${userNames[0]} và ${userNames.length - 1} người khác đang nhập...`;
}

/**
 * Check if message is from today
 */
export function isToday(timestamp: Timestamp | Date): boolean {
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  const today = new Date();
  
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if user is online (within last 5 minutes)
 */
export function isUserOnline(lastSeen: Timestamp | Date | undefined, online: boolean): boolean {
  if (online) return true;
  if (!lastSeen) return false;

  const lastSeenDate = lastSeen instanceof Timestamp ? lastSeen.toDate() : lastSeen;
  const now = new Date();
  const diff = now.getTime() - lastSeenDate.getTime();

  return diff < 5 * 60 * 1000; // 5 minutes
}

/**
 * Get chat name for display
 */
export function getChatDisplayName(
  chat: any,
  currentUserId: string
): string {
  if (chat.type === 'group') {
    return chat.name || 'Nhóm';
  }

  // For individual chats
  const otherUserId = chat.participants?.find((id: string) => id !== currentUserId);
  if (otherUserId && chat.participantDetails?.[otherUserId]) {
    return chat.participantDetails[otherUserId].name || 'User';
  }

  return 'User';
}

/**
 * Get chat avatar for display
 */
export function getChatAvatar(
  chat: any,
  currentUserId: string
): string | undefined {
  if (chat.type === 'group') {
    return chat.avatar;
  }

  // For individual chats
  const otherUserId = chat.participants?.find((id: string) => id !== currentUserId);
  if (otherUserId && chat.participantDetails?.[otherUserId]) {
    return chat.participantDetails[otherUserId].avatar;
  }

  return undefined;
}

/**
 * Validate message content
 */
export function validateMessage(content: string): string | null {
  if (!content || content.trim().length === 0) {
    return 'Tin nhắn không được để trống';
  }

  if (content.length > 5000) {
    return 'Tin nhắn quá dài (tối đa 5000 ký tự)';
  }

  return null;
}

/**
 * Generate chat ID for two users (deterministic)
 */
export function generateChatId(userId1: string, userId2: string): string {
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
}

/**
 * Check if file type is supported
 */
export function isSupportedFileType(fileType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  return supportedTypes.includes(fileType);
}

/**
 * Get file type category
 */
export function getFileTypeCategory(fileType: string): 'image' | 'video' | 'file' {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/')) return 'video';
  return 'file';
}
