import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('MONGODB_URI preview:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'NOT SET');
    
    await connectToDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful!',
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'MongoDB connection failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
