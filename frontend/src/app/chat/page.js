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
  const [hoveredChatId, setHoveredChatId] = useState(null);
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
      <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-900/5 via-white to-blue-50/20 overflow-hidden">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col overflow-hidden shadow-2xl border-r border-slate-700/50 backdrop-blur-xl relative z-10`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700/50 backdrop-blur-sm">
          <button
            onClick={createNewChat}
            className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-600 hover:from-blue-700 hover:via-blue-600 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-blue-500/40 transform hover:scale-[1.03] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            <svg className="w-5 h-5 relative z-10 transform group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="relative z-10">New Chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/30">
          {isLoadingChats ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-600 border-t-blue-500"></div>
                <span className="text-xs text-slate-400">Loading chats...</span>
              </div>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-slate-400 text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 bg-slate-800/50 rounded-lg mx-auto flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="font-medium text-sm">No conversations</p>
              <p className="text-xs">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat._id}
                  onMouseEnter={() => setHoveredChatId(chat._id)}
                  onMouseLeave={() => setHoveredChatId(null)}
                  onClick={() => loadChat(chat._id)}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    currentChat?._id === chat._id
                      ? 'bg-gradient-to-r from-blue-600/90 to-emerald-600/90 text-white shadow-lg shadow-blue-500/20'
                      : 'hover:bg-slate-800/40 text-slate-300 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate text-sm leading-tight">
                        {chat.title}
                      </h3>
                      <p className="text-xs opacity-60 mt-1">
                        {formatTime(chat.lastMessageAt)}
                      </p>
                    </div>
                    {(hoveredChatId === chat._id || currentChat?._id === chat._id) && (
                      <button
                        onClick={(e) => deleteChat(chat._id, e)}
                        className="flex-shrink-0 p-1.5 hover:bg-red-600/80 rounded-lg transition-all duration-200 hover:scale-110 transform"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-slate-700/50 backdrop-blur-sm bg-slate-900/50">
          <div className="flex items-center space-x-3 px-2 py-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ring-2 ring-slate-700/50">
              <span className="text-sm font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-100">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 backdrop-blur-sm border border-white/40 shadow-xl overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-white via-slate-50/80 to-blue-50/50 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex items-center justify-between shadow-sm relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2.5 hover:bg-slate-100 rounded-lg transition-all duration-200 text-slate-700 hover:text-slate-900 group"
              >
                <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex-1">
                <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 via-blue-700 to-emerald-600 bg-clip-text text-transparent">
                  {currentChat?.title || 'GlucoTrack AI Assistant'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">AI-Powered Health Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50/80 rounded-full border border-emerald-200/50">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                <span className="text-xs font-medium text-emerald-700">Online</span>
              </div>
            </div>
          </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {!currentChat || currentChat.messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-blue-500/20 blur-3xl rounded-full"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 via-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-700 to-emerald-600 bg-clip-text text-transparent">
                  Welcome to GlucoTrack AI
                </h2>
                <p className="text-slate-600 max-w-md text-sm leading-relaxed">
                  I'm here to help you with diabetes management, health questions, and provide personalized insights. 
                  Start a conversation by typing a message below.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                  onClick={() => setMessage("What should I know about managing my blood sugar levels?")}
                  className="p-4 text-left bg-white hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-emerald-50/50 border border-slate-200 hover:border-blue-300/50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
                >
                  <div className="font-semibold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">Blood Sugar Management</div>
                  <div className="text-xs text-slate-600 group-hover:text-slate-700">Learn about glucose monitoring and control</div>
                </button>
                <button
                  onClick={() => setMessage("Can you help me understand my medication schedule?")}
                  className="p-4 text-left bg-white hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-emerald-50/50 border border-slate-200 hover:border-blue-300/50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
                >
                  <div className="font-semibold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">Medication Help</div>
                  <div className="text-xs text-slate-600 group-hover:text-slate-700">Get guidance on your medications</div>
                </button>
                <button
                  onClick={() => setMessage("What foods should I eat to maintain healthy glucose levels?")}
                  className="p-4 text-left bg-white hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-emerald-50/50 border border-slate-200 hover:border-blue-300/50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
                >
                  <div className="font-semibold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">Nutrition Advice</div>
                  <div className="text-xs text-slate-600 group-hover:text-slate-700">Discover diabetes-friendly foods</div>
                </button>
                <button
                  onClick={() => setMessage("How can I track my progress effectively?")}
                  className="p-4 text-left bg-white hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-emerald-50/50 border border-slate-200 hover:border-blue-300/50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
                >
                  <div className="font-semibold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">Progress Tracking</div>
                  <div className="text-xs text-slate-600 group-hover:text-slate-700">Learn about effective monitoring</div>
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentChat.messages.map((msg, index) => (
                <div
                  key={msg._id || index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`flex max-w-4xl ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 ${msg.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg font-medium text-sm ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-br from-blue-600 to-emerald-600 text-white ring-2 ring-blue-400/30' 
                          : 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700'
                      }`}>
                        {msg.role === 'user' ? (
                          <span>
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
                      <div className={`px-5 py-3.5 rounded-2xl max-w-2xl shadow-lg transition-all duration-300 hover:shadow-xl group ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-emerald-600 text-white rounded-tr-sm hover:scale-105 transform'
                          : 'bg-white border border-slate-200/60 text-slate-900 rounded-tl-sm hover:bg-slate-50'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      </div>
                      <div className={`mt-2 text-xs font-medium ${msg.role === 'user' ? 'text-blue-500/70' : 'text-slate-400'}`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex max-w-4xl gap-3">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200/60 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-lg">
                      <div className="flex space-x-2">
                        <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
        <div className="bg-gradient-to-t from-slate-50/80 via-white to-white/95 backdrop-blur-md border-t border-slate-200/40 p-5 shadow-2xl">
          <form onSubmit={sendMessage} className="space-y-3">
            <div className="flex space-x-3">
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-emerald-500/10 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-xl pointer-events-none"></div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  placeholder="Ask me anything about your health... (Shift+Enter for new line)"
                  className="relative w-full px-5 py-3.5 bg-white border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300/50 transition-all duration-200 resize-none shadow-sm focus:shadow-lg focus:shadow-blue-500/10 text-slate-900 placeholder-slate-400"
                  rows="3"
                  disabled={isTyping}
                />
              </div>
              <button
                type="submit"
                disabled={!message.trim() || isTyping}
                className={`flex-shrink-0 p-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform active:scale-95 group relative overflow-hidden ${
                  message.trim() && !isTyping
                    ? 'bg-gradient-to-br from-blue-600 via-emerald-600 to-blue-700 text-white hover:from-blue-700 hover:via-emerald-700 hover:to-blue-800 hover:scale-105'
                    : 'bg-slate-200/60 text-slate-400 cursor-not-allowed'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {isTyping ? (
                  <div className="relative flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <svg className="w-5 h-5 relative transform group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="text-xs text-slate-500 text-center font-medium px-2">
              💡 AI responses are generated by your backend. Please verify medical info with healthcare professionals.
            </div>
          </form>
        </div>
      </div>
      </div>
    </Layout>
  );
}
