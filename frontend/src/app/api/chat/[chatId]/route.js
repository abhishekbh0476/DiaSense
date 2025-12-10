import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import Chat from '../../../../models/Chat.js';
import { withAuth } from '../../../../middleware/auth.js';
import mongoose from 'mongoose';

// GET specific chat with messages
async function getChat(request, context) {
  try {
  let params = context?.params;
  if (params && typeof params.then === 'function') {
    params = await params;
  }
  const { chatId } = params || {};

    // Validate chat ID
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid chat ID'
      }, { status: 400 });
    }

    console.log('Getting chat:', chatId, 'for user:', request.userId);

    await connectToDatabase();

    const chat = await Chat.findOne({ 
      _id: chatId, 
      userId: request.userId,
      isActive: true 
    });

    if (!chat) {
      return NextResponse.json({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Chat retrieved successfully',
      data: {
        chat
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get chat error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve chat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// POST send message and get AI response
async function sendMessage(request, context) {
  try {
    console.log('=== SEND MESSAGE START ===');
    console.log('Context:', context);
    console.log('User ID:', request.userId);
    
  let params = context?.params;
  if (params && typeof params.then === 'function') {
    params = await params;
  }
  console.log('Params:', params);
    
  if (!params?.chatId) {
      console.log('❌ No chatId in params');
      return NextResponse.json({
        success: false,
        message: 'Chat ID is required'
      }, { status: 400 });
    }
    
    const { chatId } = params;
    console.log('Chat ID:', chatId);
    
    const body = await request.json();
    console.log('Request body:', body);
    const { message, model = 'gpt-3.5-turbo' } = body;

    // Validate chat ID
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      console.log('Invalid chat ID format');
      return NextResponse.json({
        success: false,
        message: 'Invalid chat ID'
      }, { status: 400 });
    }

    if (!message || !message.trim()) {
      console.log('Empty message provided');
      return NextResponse.json({
        success: false,
        message: 'Message is required'
      }, { status: 400 });
    }

    console.log('Sending message to chat:', chatId, 'for user:', request.userId);

    await connectToDatabase();
    console.log('Database connected');

    const chat = await Chat.findOne({ 
      _id: chatId, 
      userId: request.userId,
      isActive: true 
    });
    console.log('Chat found:', !!chat);

    if (!chat) {
      console.log('Chat not found for user:', request.userId, 'chatId:', chatId);
      return NextResponse.json({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    // Add user message to chat
    console.log('Adding user message to chat');
    await chat.addMessage('user', message.trim());
    console.log('User message added successfully');

    try {
      // Call Python backend server.py
      console.log('Calling Python AI backend...');
      
      // Get recent messages for context (optional)
      const recentMessages = chat.getRecentMessages(6);
      
      const requestData = {
        message: message.trim(),
        conversation_history: recentMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      };
      
      console.log('🚀 FRONTEND: Sending to Python backend');
      console.log('📤 Request URL:', 'http://localhost:5000/api/chat');
      console.log('📤 Request data:', requestData);
      
      const aiResponse = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('📥 Backend response status:', aiResponse.status);
      console.log('📥 Backend response headers:', Object.fromEntries(aiResponse.headers.entries()));

      if (!aiResponse.ok) {
        throw new Error(`AI service responded with status: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      console.log('📥 FRONTEND: AI response received:', aiData);

      // Add AI response to chat
      const aiMessage = aiData.response || aiData.message || 'Sorry, I could not generate a response.';
      const tokens = aiData.tokens || 0;
      
      console.log('💬 Adding AI message to chat:', aiMessage.substring(0, 100) + '...');
      await chat.addMessage('assistant', aiMessage, tokens);
      console.log('✅ AI message added to chat');

      // Reload chat to get updated data
      const updatedChat = await Chat.findById(chatId);

      return NextResponse.json({
        success: true,
        message: 'Message sent and response received',
        data: {
          chat: updatedChat,
          userMessage: message.trim(),
          aiResponse: aiMessage,
          tokens: tokens
        }
      }, { status: 200 });

    } catch (aiError) {
      console.error('AI service error:', aiError);
      
      // Add error message as AI response
      const errorMessage = 'Sorry, I\'m having trouble connecting to the AI service right now. Please try again later.';
      await chat.addMessage('assistant', errorMessage);

      const updatedChat = await Chat.findById(chatId);

      return NextResponse.json({
        success: true,
        message: 'Message saved, but AI service unavailable',
        data: {
          chat: updatedChat,
          userMessage: message.trim(),
          aiResponse: errorMessage,
          error: 'AI service unavailable'
        }
      }, { status: 200 });
    }

  } catch (error) {
    console.error('=== SEND MESSAGE ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== END ERROR ===');
    
    return NextResponse.json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// PUT update chat (e.g., change title)
async function updateChat(request, context) {
  try {
    let params = context?.params;
    if (params && typeof params.then === 'function') {
      params = await params;
    }
    const { chatId } = params || {};
    const body = await request.json();
    const { title } = body;

    // Validate chat ID
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid chat ID'
      }, { status: 400 });
    }

    await connectToDatabase();

    const updatedChat = await Chat.findOneAndUpdate(
      { 
        _id: chatId, 
        userId: request.userId,
        isActive: true 
      },
      { title },
      { new: true }
    );

    if (!updatedChat) {
      return NextResponse.json({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Chat updated successfully',
      data: {
        chat: updatedChat
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Update chat error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update chat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// DELETE chat (soft delete)
async function deleteChat(request, context) {
  try {
    let params = context?.params;
    if (params && typeof params.then === 'function') {
      params = await params;
    }
    const { chatId } = params || {};

    // Validate chat ID
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid chat ID'
      }, { status: 400 });
    }

    await connectToDatabase();

    const deletedChat = await Chat.findOneAndUpdate(
      { 
        _id: chatId, 
        userId: request.userId,
        isActive: true 
      },
      { isActive: false },
      { new: true }
    );

    if (!deletedChat) {
      return NextResponse.json({
        success: false,
        message: 'Chat not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Chat deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete chat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Export wrapped handlers with authentication
export const GET = withAuth(getChat);
export const POST = withAuth(sendMessage);
export const PUT = withAuth(updateChat);
export const DELETE = withAuth(deleteChat);
