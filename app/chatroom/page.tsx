'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Image from 'next/image';
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
import IceBreakerWidget from './components/IceBreakerWidget';
import { MessageType } from '@/types/chat';
import { UserProfile } from '@/types/profile';
import { GreenHomeBackground } from '@/components/magicui/green-home-background';

function ChatroomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(null);
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

  // Filter chats based on search and remove unidentified users
  const filteredChats = chatListItems.filter((chat) => {
    // Remove chats with unidentified users (Unknown User, default names, or no name)
    if (chat.type === 'individual') {
      const invalidNames = ['Unknown User', 'Người dùng', 'User', 'user'];
      if (!chat.otherUserName || invalidNames.includes(chat.otherUserName)) {
        return false;
      }
    }
    
    // Apply search filter
    const searchLower = searchQuery.toLowerCase();
    if (chat.type === 'group') {
      return chat.name?.toLowerCase().includes(searchLower);
    } else {
      return chat.otherUserName?.toLowerCase().includes(searchLower);
    }
  });

  // Select chat and mark as read
  const handleChatSelect = async (chatId: string) => {
    setSelectedChatId(chatId);
    if (currentUser?.uid) {
      markChatRead(chatId, currentUser.uid);
      
      // Fetch other user's profile for individual chats
      const selectedChat = chats.find(c => c.id === chatId);
      if (selectedChat && selectedChat.type === 'individual') {
        const otherUserId = selectedChat.participants.find((id) => id !== currentUser.uid);
        if (otherUserId) {
          try {
            const profileRef = doc(db, 'profiles', otherUserId);
            const profileDoc = await getDoc(profileRef);
            if (profileDoc.exists()) {
              setOtherUserProfile(profileDoc.data() as UserProfile);
            }
          } catch (error) {
            console.error('Error fetching other user profile:', error);
          }
        }
      }
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
      <div className ="relative overflow-x-hidden">
        <div className="h-screen flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-hidden bg-gray-100">
      <div className="h-screen max-h-screen overflow-hidden">
        <div className="flex h-full max-h-full">
          {/* Sidebar - Chat List */}
          <div className="w-full md:w-1/3 border-r border-gray-200 bg-white flex flex-col">

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
                    ? 'No conversations found'
                    : 'No conversations yet'}
                </p>
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
              <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center justify-between text-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        {selectedChat.type === 'group' ? (
                          selectedChat.avatar ? (
                            <Image src={selectedChat.avatar} alt={selectedChat.name || 'Group'} width={40} height={40} className="rounded-full text-gray-700" unoptimized />
                          ) : (
                            <div className="bg-primary text-primary-content text-gray-700 flex items-center justify-center w-full h-full">
                              <Icon icon="mdi:account-group" className="text-xl" />
                            </div>
                          )
                        ) : (
                          <>
                            {chatListItems
                              .find((c) => c.id === selectedChat.id)
                              ?.otherUserAvatar ? (
                              <Image
                                src={
                                  chatListItems.find((c) => c.id === selectedChat.id)
                                    ?.otherUserAvatar!
                                }
                                alt="Avatar"
                                width={40}
                                height={40}
                                className="rounded-full"
                                unoptimized
                              />
                            ) : (
                              <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full text-gray-700">
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
                            ? 'Active'
                            : 'Offline'}
                        </p>
                      )}
                      {chatListItems.find((c) => c.id === selectedChat.id)?.isTyping && (
                        <p className="text-xs text-primary italic">Typing...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 pb-2 min-h-0 bg-gray-50">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    {currentUserProfile && otherUserProfile ? (
                      <IceBreakerWidget
                        currentUserProfile={currentUserProfile}
                        otherUserProfile={otherUserProfile}
                        onSendMessage={handleSendMessage}
                        disabled={sending}
                      />
                    ) : (
                      <p className="text-gray-500">No messages yet</p>
                    )}
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
                currentUserProfile={currentUserProfile || undefined}
                otherUserProfile={otherUserProfile || undefined}
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
                  Select a conversation
                </h3>
                <p className="text-gray-600">
                  Select a conversation from the left to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default function ChatroomPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-base-200"><span className="loading loading-spinner loading-lg"></span></div>}>
      <ChatroomContent />
    </Suspense>
  );
}
