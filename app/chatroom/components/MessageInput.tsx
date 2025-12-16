// Message Input Component with Media Upload

'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { MessageType } from '@/types/chat';
import { isSupportedFileType, getFileTypeCategory } from '@/lib/utils/chatUtils';

interface MessageInputProps {
  onSendMessage: (content: string, type: MessageType, file?: File) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
}

export default function MessageInput({
  onSendMessage,
  onTyping,
  onStopTyping,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (value: string) => {
    setMessage(value);

    // Trigger typing indicator
    onTyping();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 2000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isSupportedFileType(file.type)) {
      alert('File type not supported');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    if (selectedFile) {
      const fileType = getFileTypeCategory(selectedFile.type);
      onSendMessage(message.trim(), fileType, selectedFile);
      handleRemoveFile();
      setMessage('');
    } else if (message.trim()) {
      onSendMessage(message.trim(), 'text');
      setMessage('');
    }

    onStopTyping();
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Common emojis
  const commonEmojis = ['😊', '😂', '❤️', '👍', '🎉', '😍', '🔥', '✨', '💯', '👏'];

  return (
    <div className="p-4 border-t border-base-300 bg-base-100 flex-shrink-0">
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-base-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {filePreview && selectedFile.type.startsWith('image/') ? (
                <Image
                  src={filePreview}
                  alt="Preview"
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded"
                  unoptimized
                />
              ) : filePreview && selectedFile.type.startsWith('video/') ? (
                <video
                  src={filePreview}
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <Icon icon="mdi:file-document" className="text-4xl text-primary" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <Icon icon="mdi:close" className="text-xl" />
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="mb-3 p-3 bg-base-200 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setMessage(message + emoji);
                  setShowEmojiPicker(false);
                }}
                className="btn btn-ghost btn-sm text-2xl"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center space-x-2">
        {/* Attach File Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="btn btn-ghost btn-sm btn-circle bg-gray-600 text-white hover:bg-gray-800 transition-colors duration-200"
          title="Đính kèm tệp"
        >
          <Icon icon="mdi:paperclip" className="text-xl" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
        />

        {/* Message Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled}
            className="input input-bordered w-full pr-12 text-gray-700"
          />
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
            title="Emoji"
          >
            <Icon icon="mdi:emoticon-happy-outline" className="text-xl" />
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !selectedFile)}
          className="btn btn-primary btn-circle"
          title="Send"
        >
          <Icon icon="mdi:send" className="text-xl" />
        </button>
      </div>
    </div>
  );
}
