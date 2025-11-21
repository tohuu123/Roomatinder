"use client";

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image';
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function ChatroomPage() {
  const [selectedChatId, setSelectedChatId] = useState<string>('help');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for chats
  const [chats, setChats] = useState<Chat[]>([
    {
      id: 'help',
      name: 'Help Center',
      avatar: 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg',
      lastMessage: 'Xin chào! Tôi có thể giúp gì cho bạn?',
      lastMessageTime: '2 phút',
      unreadCount: 1
    }
  ]);

  // Mock messages data
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>({
    help: [
      {
        id: '1',    
        senderId: 'help',
        senderName: 'Help Center',
        content: 'Xin chào! Chào mừng bạn đến với Roomatinder. Tôi có thể giúp gì cho bạn?',
        timestamp: new Date(Date.now() - 300000),
        type: 'text'
      }
    ]
  });

  const selectedChat = chats.find(chat => chat.id === selectedChatId);
  const chatMessages = messages[selectedChatId] || [];

  // Function to mark chat as read
  const markAsRead = (chatId: string) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  };

  // Function to handle chat selection
  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    markAsRead(chatId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedChatId) {
      const message: Message = {
        id: Date.now().toString(),
        senderId: 'me',
        senderName: 'Bạn',
        content: newMessage.trim(),
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => ({
        ...prev,
        [selectedChatId]: [...(prev[selectedChatId] || []), message]
      }));

      setNewMessage('');

      // Simulate help response for help chat
      if (selectedChatId === 'help') {
        setTimeout(() => {
          const helpResponse: Message = {
            id: (Date.now() + 1).toString(),
            senderId: 'help',
            senderName: 'Help Center',
            content: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ hỗ trợ bạn sớm nhất có thể.',
            timestamp: new Date(),
            type: 'text'
          };

          setMessages(prev => ({
            ...prev,
            [selectedChatId]: [...(prev[selectedChatId] || []), helpResponse]
          }));
        }, 1000);
      }
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-screen bg-base-100 overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar - Chat List */}
        <div className="w-1/3 border-r border-base-300 bg-base-100">
          {/* Header */}
          <div className="p-4 border-b border-base-300">
            <h1 className="text-xl font-bold text-gray-900 mb-3">Tin nhắn</h1>
            
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
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" 
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="overflow-y-auto flex-1">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatSelect(chat.id)}
                className={`flex items-center p-4 hover:bg-base-200 cursor-pointer transition-colors ${
                  selectedChatId === chat.id ? 'bg-primary/10 border-r-4 border-primary' : ''
                }`}
              >
                <div className="avatar">
                  <div className="w-12 rounded-full">
                    <img src={chat.avatar} alt={chat.name} />
                  </div>
                </div>
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {chat.name}
                    </h3>
                    <span className="text-xs text-gray-600">
                      {chat.lastMessageTime}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">
                    {chat.lastMessage}
                  </p>
                </div>

                {chat.unreadCount > 0 && (
                  <div className="badge badge-primary badge-sm">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-base-300 bg-base-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="avatar">
                      <div className="w-10 rounded-full">
                        <img src={selectedChat.avatar} alt={selectedChat.name} />
                      </div>
                    </div>
                    <div className="ml-3">
                      <h2 className="font-semibold text-gray-900">
                        {selectedChat.name}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="btn btn-ghost btn-sm btn-circle">
                      <Icon icon="mdi:phone" className="text-lg" />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-circle">
                      <Icon icon="mdi:video" className="text-lg" />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-circle">
                      <Icon icon="mdi:information" className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-base-50 max-h-[calc(100vh-140px)]">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${message.senderId === 'me' ? 'order-1' : 'order-2'}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            message.senderId === 'me'
                              ? 'bg-primary text-primary-content ml-auto'
                              : 'bg-base-200 text-gray-900'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className={`text-xs text-gray-600 mt-1 ${
                          message.senderId === 'me' ? 'text-right' : 'text-left'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-base-300 bg-base-100">
                <div className="flex items-center space-x-2">
                  <button className="btn btn-ghost btn-sm btn-circle">
                    <Icon icon="mdi:plus" className="text-lg" />
                  </button>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Nhập tin nhắn..."
                      className="input input-bordered w-full pr-12 text-gray-900"
                    />
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
                    >
                      <Icon icon="mdi:emoticon-happy" className="text-lg" />
                    </button>
                  </div>

                  <button className="btn btn-ghost btn-sm btn-circle">
                    <Icon icon="mdi:microphone" className="text-lg" />
                  </button>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="btn btn-primary btn-sm btn-circle"
                  >
                    <Icon icon="mdi:send" className="text-lg" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No Chat Selected */
            <div className="flex-1 flex items-center justify-center bg-base-50 h-full">
              <div className="text-center">
                <Icon icon="mdi:chat-outline" className="text-6xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Chọn một cuộc trò chuyện
                </h3>
                <p className="text-gray-600">
                  Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
