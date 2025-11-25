// Chat List Item Component

'use client';

import { ChatListItem } from '@/types/chat';
import { Icon } from '@iconify/react';
import {
  formatMessageTime,
  getMessagePreview,
  getTypingText,
  getChatDisplayName,
  getChatAvatar,
} from '@/lib/utils/chatUtils';

interface ChatListItemComponentProps {
  chat: ChatListItem;
  currentUserId: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function ChatListItemComponent({
  chat,
  currentUserId,
  isSelected,
  onClick,
}: ChatListItemComponentProps) {
  const displayName = getChatDisplayName(chat, currentUserId);
  const avatarUrl = getChatAvatar(chat, currentUserId);
  const isOnline = chat.type === 'individual' && chat.otherUserOnline;

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-4 hover:bg-base-200 cursor-pointer transition-colors border-b border-base-300 ${
        isSelected ? 'bg-primary/10 border-r-4 border-primary' : ''
      }`}
    >
      {/* Avatar with Online Indicator */}
      <div className="avatar">
        <div className="w-12 h-12 rounded-full relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} />
          ) : (
            <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full">
              <span className="text-lg font-bold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {isOnline && (
            <span className="status status-success status-sm absolute bottom-0 right-0"></span>
          )}
        </div>
      </div>

      {/* Chat Info */}
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-semibold text-base-content truncate">
            {displayName}
          </h3>
          {chat.lastMessageTime && (
            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
              {formatMessageTime(chat.lastMessageTime)}
            </span>
          )}
        </div>

        {/* Last Message or Typing Indicator */}
        <div className="flex items-center">
          {chat.isTyping && chat.typingUserNames ? (
            <p className="text-sm text-primary italic">
              {getTypingText(chat.typingUserNames)}
            </p>
          ) : (
            <p className="text-sm text-gray-600 truncate">
              {chat.lastMessage
                ? getMessagePreview(
                    chat.lastMessage,
                    chat.lastMessageType || 'text',
                    chat.type === 'group' && chat.lastMessageSenderId !== currentUserId
                      ? chat.participantDetails?.[chat.lastMessageSenderId || '']?.name
                      : undefined
                  )
                : 'Chưa có tin nhắn'}
            </p>
          )}
        </div>
      </div>

      {/* Unread Badge */}
      {chat.currentUserUnreadCount > 0 && (
        <div className="badge badge-primary badge-sm ml-2 flex-shrink-0">
          {chat.currentUserUnreadCount > 99 ? '99+' : chat.currentUserUnreadCount}
        </div>
      )}
    </div>
  );
}
