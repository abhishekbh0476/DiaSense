'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Layout from '../../components/Layout';

export default function ChatPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      setIsLoadingChats(true);
      const response = await axios.get('/api/chat');
      if (response.data.success) {
        setChats(response.data.data.chats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await axios.post('/api/chat', {
        title: 'New Conversation'
      });
      
      if (response.data.success) {
        const newChat = response.data.data.chat;
        setChats(prev => [newChat, ...prev]);
        setCurrentChat(newChat);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const loadChat = async (chatId) => {
    try {
      const response = await axios.get(`/api/chat/${chatId}`);
      if (response.data.success) {
        setCurrentChat(response.data.data.chat);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isTyping) return;

    let chatToUse = currentChat;

    // Create new chat if none exists
    if (!chatToUse) {
      try {
        const response = await axios.post('/api/chat', {
          title: 'New Conversation'
        });
        
        if (response.data.success) {
          chatToUse = response.data.data.chat;
          setCurrentChat(chatToUse);
          setChats(prev => [chatToUse, ...prev]);
        }
      } catch (error) {
        console.error('Failed to create chat:', error);
        return;
      }
    }

    const userMessage = message.trim();
    setMessage('');
    setIsTyping(true);

    // Optimistically add user message to UI
    const tempUserMessage = {
      _id: Date.now(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setCurrentChat(prev => ({
      ...prev,
      messages: [...(prev?.messages || []), tempUserMessage]
    }));

    try {
      const response = await axios.post(`/api/chat/${chatToUse._id}`, {
        message: userMessage
      });

      if (response.data.success) {
        // Update with actual chat data from server
        setCurrentChat(response.data.data.chat);
        
        // Update chat in sidebar
        setChats(prev => prev.map(chat => 
          chat._id === chatToUse._id 
            ? { ...chat, lastMessageAt: new Date(), title: response.data.data.chat.title }
            : chat
        ));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage = {
        _id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setCurrentChat(prev => ({
        ...prev,
        messages: [...(prev?.messages || []), errorMessage]
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    
    try {
      await axios.delete(`/api/chat/${chatId}`);
      setChats(prev => prev.filter(chat => chat._id !== chatId));
      
      if (currentChat?._id === chatId) {
        setCurrentChat(null);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', {
        weekday: 'short'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (isLoading) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your chat...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout showFooter={false}>
      <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col overflow-hidden shadow-2xl border-r border-slate-700/50 backdrop-blur-xl`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700/50">
          <button
            onClick={createNewChat}
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] hover:shadow-blue-500/25"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoadingChats ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-gray-400 text-center py-8 px-4">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => loadChat(chat._id)}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    currentChat?._id === chat._id
                      ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg'
                      : 'hover:bg-slate-800/50 text-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate text-sm">
                        {chat.title}
                      </h3>
                      <p className="text-xs opacity-75 mt-1">
                        {formatTime(chat.lastMessageAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteChat(chat._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600 rounded transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-sm font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-md border border-white/20 shadow-xl">
          {/* Chat Header */}
          <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              {currentChat?.title || 'GlucoTrack AI Assistant'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>AI Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!currentChat || currentChat.messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                Welcome to GlucoTrack AI
              </h2>
              <p className="text-slate-600 max-w-md">
                I'm here to help you with diabetes management, health questions, and provide personalized insights. 
                Start a conversation by typing a message below.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <button
                  onClick={() => setMessage("What should I know about managing my blood sugar levels?")}
                  className="p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="font-medium text-slate-900 mb-1">Blood Sugar Management</div>
                  <div className="text-sm text-slate-600">Learn about glucose monitoring and control</div>
                </button>
                <button
                  onClick={() => setMessage("Can you help me understand my medication schedule?")}
                  className="p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="font-medium text-slate-900 mb-1">Medication Help</div>
                  <div className="text-sm text-slate-600">Get guidance on your medications</div>
                </button>
                <button
                  onClick={() => setMessage("What foods should I eat to maintain healthy glucose levels?")}
                  className="p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="font-medium text-slate-900 mb-1">Nutrition Advice</div>
                  <div className="text-sm text-slate-600">Discover diabetes-friendly foods</div>
                </button>
                <button
                  onClick={() => setMessage("How can I track my progress effectively?")}
                  className="p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="font-medium text-slate-900 mb-1">Progress Tracking</div>
                  <div className="text-sm text-slate-600">Learn about effective monitoring</div>
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentChat.messages.map((msg, index) => (
                <div
                  key={msg._id || index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-4xl ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 ${msg.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white' 
                          : 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700'
                      }`}>
                        {msg.role === 'user' ? (
                          <span className="text-sm font-medium">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                          </span>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-3 rounded-2xl max-w-2xl shadow-lg ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-900'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex max-w-4xl">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white/95 backdrop-blur-md border-t border-slate-200/60 p-6 shadow-lg">
          <form onSubmit={sendMessage} className="flex space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
                rows="3"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!message.trim() || isTyping}
                className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all duration-200 ${
                  message.trim() && !isTyping
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 shadow-lg hover:scale-105'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isTyping ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-2 text-xs text-slate-500 text-center">
            AI responses are generated by your backend server. Please verify medical information with healthcare professionals.
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}
