import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import Chat from '../../../../models/Chat.js';
import { withAuth } from '../../../../middleware/auth.js';

// POST cleanup chat data
async function cleanupChats(request) {
  try {
    console.log('🧹 Starting chat cleanup for user:', request.userId);
    
    await connectToDatabase();

    // Find all chats for the user
    const chats = await Chat.find({ 
      userId: request.userId,
      isActive: true 
    });

    console.log('Found', chats.length, 'chats to check');

    let fixedCount = 0;
    for (const chat of chats) {
      let needsUpdate = false;
      
      // Fix missing messages array
      if (!chat.messages || !Array.isArray(chat.messages)) {
        console.log('Fixing messages array for chat:', chat._id);
        chat.messages = [];
        needsUpdate = true;
      }
      
      // Fix missing lastMessageAt
      if (!chat.lastMessageAt) {
        console.log('Fixing lastMessageAt for chat:', chat._id);
        chat.lastMessageAt = chat.createdAt || new Date();
        needsUpdate = true;
      }
      
      // Fix missing totalTokens
      if (typeof chat.totalTokens !== 'number') {
        console.log('Fixing totalTokens for chat:', chat._id);
        chat.totalTokens = 0;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await chat.save();
        fixedCount++;
      }
    }

    console.log('✅ Cleanup complete. Fixed', fixedCount, 'chats');

    return NextResponse.json({
      success: true,
      message: 'Chat cleanup completed',
      data: {
        totalChats: chats.length,
        fixedChats: fixedCount
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to cleanup chats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Export wrapped handler with authentication
export const POST = withAuth(cleanupChats);
