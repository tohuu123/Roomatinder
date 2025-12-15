'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  useUserChats,
  useChatMessages,
  useSendMessage,
  useTypingIndicator,
  useUserOnlinePresence,
  useMarkAsRead,
  useChatListItems,
  useNotifications,
  useCreateChat,
} from '@/lib/hooks/useChat';
import { groupMessagesByDate, getDateSeparatorLabel } from '@/lib/utils/chatUtils';
import MessageBubble from './components/MessageBubble';
import ChatListItemComponent from './components/ChatListItem';
import MessageInput from './components/MessageInput';
import { MessageType } from '@/types/chat';
import { UserProfile } from '@/types/profile';
import { GreenHomeBackground } from '@/components/magicui/green-home-background';

export default function ChatroomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle chat ID from URL query params
  useEffect(() => {
    const chatId = searchParams?.get('chatId');
    if (chatId) {
      setSelectedChatId(chatId);
    }
  }, [searchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Fetch current user profile
  useEffect(() => {
    if (!currentUser) return;

    const fetchProfile = async () => {
      const profileRef = doc(db, 'profiles', currentUser.uid);
      const profileDoc = await getDoc(profileRef);
      if (profileDoc.exists()) {
        setCurrentUserProfile(profileDoc.data() as UserProfile);
      }
    };

    fetchProfile();
  }, [currentUser]);

  // Custom hooks
  const { chats, loading: chatsLoading } = useUserChats(currentUser?.uid || null);
  const { messages, loading: messagesLoading } = useChatMessages(selectedChatId);
  const { send, sending } = useSendMessage(
    currentUser?.uid || '',
    currentUserProfile?.displayName || currentUser?.displayName || 'User',
    currentUserProfile?.photoURL || currentUser?.photoURL || undefined
  );
  const { startTyping, stopTyping } = useTypingIndicator(selectedChatId, currentUser?.uid || null);
  const { markChatRead } = useMarkAsRead();
  const { notifications, unreadCount } = useNotifications(currentUser?.uid || null);
  const { create: createChat, creating } = useCreateChat(currentUser?.uid || '');

  // Set user online presence
  useUserOnlinePresence(currentUser?.uid || null);

  // Transform chats into chat list items with online status
  const chatListItems = useChatListItems(currentUser?.uid || null, chats);

  // Filter chats based on search
  const filteredChats = chatListItems.filter((chat) => {
    const searchLower = searchQuery.toLowerCase();
    if (chat.type === 'group') {
      return chat.name?.toLowerCase().includes(searchLower);
    } else {
      return chat.otherUserName?.toLowerCase().includes(searchLower);
    }
  });

  // Select chat and mark as read
  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    if (currentUser?.uid) {
      markChatRead(chatId, currentUser.uid);
    }
    // Scroll to bottom immediately when chat is selected
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 100);
  };

  // Group messages by date
  const messageGroups = groupMessagesByDate(messages);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Send message handler
  const handleSendMessage = async (
    content: string,
    type: MessageType,
    file?: File
  ) => {
    if (!selectedChatId) return;

    await send({
      chatId: selectedChatId,
      content,
      type,
      mediaFile: file,
    });
  };

  // Create new chat from matches
  const handleCreateChatWithMatch = async (matchedUserId: string) => {
    if (!currentUser?.uid) return;

    // Check if chat already exists
    const existingChat = chats.find(
      (chat) =>
        chat.type === 'individual' &&
        chat.participants.includes(matchedUserId) &&
        chat.participants.includes(currentUser.uid)
    );

    if (existingChat) {
      setSelectedChatId(existingChat.id);
      setShowNewChatModal(false);
      return;
    }

    // Create new chat
    const chatId = await createChat('individual', [matchedUserId]);
    if (chatId) {
      setSelectedChatId(chatId);
      setShowNewChatModal(false);
    }
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  if (!currentUser) {
    return (
      <GreenHomeBackground>
        <div className="h-screen flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </GreenHomeBackground>
    );
  }

  return (
    <GreenHomeBackground>
      <div className="h-screen max-h-screen overflow-hidden">
        <div className="flex h-full max-h-full">
          {/* Sidebar - Chat List */}
          <div className="w-full md:w-1/3 border-r border-base-300 bg-base-100 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-base-300">
            <div className="flex justify-between items-center mb-3">
              <h1 className="text-xl font-bold">Tin nhắn</h1>
              <div className="flex items-center space-x-2">
                {/* Notification Badge */}
                {unreadCount > 0 && (
                  <div className="indicator">
                    <span className="indicator-item badge badge-primary badge-sm">
                      {unreadCount}
                    </span>
                    <button className="btn btn-ghost btn-sm btn-circle">
                      <Icon icon="mdi:bell" className="text-xl" />
                    </button>
                  </div>
                )}
                {/* New Chat Button */}
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="btn btn-ghost btn-sm btn-circle"
                  title="Tạo cuộc trò chuyện mới"
                >
                  <Icon icon="mdi:plus" className="text-xl" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm cuộc trò chuyện..."
                className="input input-bordered w-full pl-10 input-sm"
              />
              <Icon
                icon="mdi:search"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {chatsLoading ? (
              <div className="flex items-center justify-center h-full">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <Icon icon="mdi:chat-outline" className="text-6xl text-gray-400 mb-2" />
                <p className="text-gray-600">
                  {searchQuery
                    ? 'Không tìm thấy cuộc trò chuyện'
                    : 'Chưa có cuộc trò chuyện nào'}
                </p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="btn btn-primary btn-sm mt-4"
                >
                  Bắt đầu trò chuyện
                </button>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <ChatListItemComponent
                  key={chat.id}
                  chat={chat}
                  currentUserId={currentUser.uid}
                  isSelected={selectedChatId === chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="hidden md:flex flex-1 flex-col max-h-screen overflow-hidden">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-base-300 bg-base-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        {selectedChat.type === 'group' ? (
                          selectedChat.avatar ? (
                            <img src={selectedChat.avatar} alt={selectedChat.name} />
                          ) : (
                            <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full">
                              <Icon icon="mdi:account-group" className="text-xl" />
                            </div>
                          )
                        ) : (
                          <>
                            {chatListItems
                              .find((c) => c.id === selectedChat.id)
                              ?.otherUserAvatar ? (
                              <img
                                src={
                                  chatListItems.find((c) => c.id === selectedChat.id)
                                    ?.otherUserAvatar
                                }
                                alt="Avatar"
                              />
                            ) : (
                              <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full">
                                <Icon icon="mdi:account" className="text-xl" />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <h2 className="font-semibold">
                        {selectedChat.type === 'group'
                          ? selectedChat.name
                          : chatListItems.find((c) => c.id === selectedChat.id)
                              ?.otherUserName}
                      </h2>
                      {selectedChat.type === 'individual' && (
                        <p className="text-xs text-gray-500">
                          {chatListItems.find((c) => c.id === selectedChat.id)
                            ?.otherUserOnline
                            ? '🟢 Đang hoạt động'
                            : 'Ngoại tuyến'}
                        </p>
                      )}
                      {chatListItems.find((c) => c.id === selectedChat.id)?.isTyping && (
                        <p className="text-xs text-primary italic">Đang nhập...</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="btn btn-ghost btn-sm btn-circle" title="Gọi thoại">
                      <Icon icon="mdi:phone" className="text-xl" />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-circle" title="Gọi video">
                      <Icon icon="mdi:video" className="text-xl" />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-circle" title="Thông tin">
                      <Icon icon="mdi:information-outline" className="text-xl" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 pb-2 min-h-0">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Chưa có tin nhắn nào</p>
                  </div>
                ) : (
                  <div className="space-y-6 pb-4">
                    {messageGroups.map((group) => (
                      <div key={group.date}>
                        {/* Date Separator */}
                        <div className="flex items-center justify-center mb-4">
                          <div className="badge badge-ghost badge-sm">
                            {getDateSeparatorLabel(group.date)}
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="space-y-3">
                          {group.messages.map((message, index) => {
                            const isOwn = message.senderId === currentUser.uid;
                            const prevMessage = group.messages[index - 1];
                            const showAvatar =
                              !prevMessage || prevMessage.senderId !== message.senderId;
                            const showName =
                              selectedChat.type === 'group' &&
                              !isOwn &&
                              (!prevMessage || prevMessage.senderId !== message.senderId);

                            return (
                              <MessageBubble
                                key={message.id}
                                message={message}
                                isOwn={isOwn}
                                showAvatar={showAvatar}
                                showName={showName}
                                isGroupChat={selectedChat.type === 'group'}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={startTyping}
                onStopTyping={stopTyping}
                disabled={sending}
              />
            </>
          ) : (
            /* No Chat Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Icon
                  icon="mdi:chat-outline"
                  className="text-6xl text-gray-400 mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Chọn một cuộc trò chuyện
                </h3>
                <p className="text-gray-600">
                  Chọn cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </GreenHomeBackground>
  );
}
