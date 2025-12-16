// Message Bubble Component

'use client';

import Image from 'next/image';
import { Message } from '@/types/chat';
import { Icon } from '@iconify/react';
import { formatShortTime } from '@/lib/utils/chatUtils';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showName?: boolean;
  isGroupChat?: boolean;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showName = false,
  isGroupChat = false,
}: MessageBubbleProps) {
  const renderMessageContent = () => {
    if (message.deletedAt) {
      return (
        <div className="italic text-gray-500">
          <Icon icon="mdi:delete" className="inline mr-1" />
          Tin nhắn đã bị xóa
        </div>
      );
    }

    switch (message.type) {
      case 'image':
        return (
          <div className="max-w-sm">
            <Image
              src={message.mediaUrl!}
              alt={message.mediaName || 'Image'}
              width={384}
              height={256}
              className="rounded-lg w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.mediaUrl, '_blank')}
              unoptimized
            />
            {message.content && (
              <p className="mt-2 whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="max-w-sm">
            <video
              src={message.mediaUrl}
              controls
              className="rounded-lg w-full h-auto"
            >
              Trình duyệt của bạn không hỗ trợ video.
            </video>
            {message.content && (
              <p className="mt-2 whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        );

      case 'file':
        return (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <Icon icon="mdi:file-document" className="text-2xl" />
            <div className="flex-1">
              <p className="font-medium truncate">{message.mediaName}</p>
              {message.mediaSize && (
                <p className="text-xs opacity-70">
                  {(message.mediaSize / 1024).toFixed(2)} KB
                </p>
              )}
            </div>
            <Icon icon="mdi:download" className="text-xl" />
          </a>
        );

      default:
        return (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        );
    }
  };

  const renderStatus = () => {
    if (!isOwn) return null;

    let icon = '';
    let color = '';

    switch (message.status) {
      case 'sending':
        icon = 'mdi:clock-outline';
        color = 'text-gray-400';
        break;
      case 'sent':
        icon = 'mdi:check';
        color = 'text-gray-400';
        break;
      case 'delivered':
        icon = 'mdi:check-all';
        color = 'text-gray-400';
        break;
      case 'read':
        icon = 'mdi:check-all';
        color = 'text-blue-500';
        break;
      case 'error':
        icon = 'mdi:alert-circle';
        color = 'text-error';
        break;
      default:
        return null;
    }

    return <Icon icon={icon} className={`text-sm ${color} ml-1`} />;
  };

  return (
    <div className={`flex items-end space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="avatar">
          <div className="w-8 h-8 rounded-full">
            {message.senderAvatar ? (
              <Image src={message.senderAvatar} alt={message.senderName} width={32} height={32} className="rounded-full" unoptimized />
            ) : (
              <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full">
                <span className="text-xs font-bold">
                  {message.senderName?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spacer for alignment when no avatar */}
      {!showAvatar && !isOwn && <div className="w-8" />}

      {/* Message Content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Sender Name (for group chats) */}
        {showName && !isOwn && isGroupChat && (
          <p className="text-xs text-gray-600 mb-1 px-2">{message.senderName}</p>
        )}

        {/* Message Bubble */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-primary text-primary-content rounded-br-sm'
              : 'bg-base-200 text-base-content rounded-bl-sm'
          }`}
        >
          {renderMessageContent()}
        </div>

        {/* Timestamp and Status */}
        <div className={`flex items-center space-x-1 mt-1 px-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <p className="text-xs text-gray-500">
            {formatShortTime(message.timestamp)}
          </p>
          {renderStatus()}
        </div>
      </div>
    </div>
  );
}
