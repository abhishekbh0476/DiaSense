import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import Chat from '../../../models/Chat.js';
import { withAuth } from '../../../middleware/auth.js';

// Chat API route loaded

// GET user's chats
async function getChats(request) {
  try {
    console.log('Getting chats for user:', request.userId);
    
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;

    const chats = await Chat.getUserChats(request.userId, limit);
    console.log('Chats retrieved:', chats.length);

    return NextResponse.json({
      success: true,
      message: 'Chats retrieved successfully',
      data: {
        chats
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve chats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// POST create new chat
async function createChat(request) {
  try {
    console.log('Creating new chat for user:', request.userId);
    
    const body = await request.json();
    const { title } = body;

    await connectToDatabase();

    const newChat = await Chat.createChat(request.userId, title);
    console.log('Chat created successfully with ID:', newChat._id);

    return NextResponse.json({
      success: true,
      message: 'Chat created successfully',
      data: {
        chat: newChat
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create chat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Export wrapped handlers with authentication
export const GET = withAuth(getChats);
export const POST = withAuth(createChat);

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}
