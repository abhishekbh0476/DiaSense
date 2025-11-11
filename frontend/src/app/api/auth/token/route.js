import { NextResponse } from 'next/server';
import { withAuth } from '../../../../middleware/auth.js';

// GET current user's token for client-side use
async function getToken(request) {
  try {
    // If we reach here, the user is authenticated (thanks to withAuth middleware)
    // Extract token from the request (it was validated by middleware)
    const authHeader = request.headers.get('authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get from cookies
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies.token;
      }
    }

    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'No token found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        token: token
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get token error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve token'
    }, { status: 500 });
  }
}

// Export wrapped handler with authentication
export const GET = withAuth(getToken);

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}

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
