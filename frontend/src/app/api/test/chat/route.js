import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Chat API test endpoint called');
    
    return NextResponse.json({
      success: true,
      message: 'Chat API is working',
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('Chat API test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Chat API test failed',
      error: error.message
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('Chat API POST test endpoint called');
    
    return NextResponse.json({
      success: true,
      message: 'Chat API POST is working',
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (error) {
    console.error('Chat API POST test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Chat API POST test failed',
      error: error.message
    }, { status: 500 });
  }
}
