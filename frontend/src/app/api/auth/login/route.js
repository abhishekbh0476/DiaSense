import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';
import { generateToken, generateRefreshToken } from '../../../../lib/jwt.js';
import { validateData, loginSchema } from '../../../../lib/validation.js';

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input data
    const validation = validateData(body, loginSchema);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      }, { status: 400 });
    }

    const { email, password, rememberMe } = validation.data;

    // Connect to database
    await connectDB();

    // Find user by email and include password
    const user = await User.findByEmail(email);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      return NextResponse.json({
        success: false,
        message: 'Account is not active. Please contact support.'
      }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: user._id });

    // Get user data without password
    const userData = user.toSafeObject();

    // Determine token expiry based on rememberMe
    const accessTokenExpiry = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days or 7 days
    const refreshTokenExpiry = rememberMe ? 90 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000; // 90 days or 30 days

    // Create response with tokens
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        accessToken,
        expiresIn: accessTokenExpiry
      }
    }, { status: 200 });

    // Set secure HTTP-only cookies
    response.cookies.set('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: accessTokenExpiry
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenExpiry
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json({
      success: false,
      message: 'Login failed. Please try again.'
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
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
