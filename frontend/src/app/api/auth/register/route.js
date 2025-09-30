import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';
import { generateToken, generateRefreshToken } from '../../../../lib/jwt.js';
import { validateData, registerSchema } from '../../../../lib/validation.js';

export async function POST(request) {
  try {
    console.log('Registration attempt started...');
    
    // Parse request body
    const body = await request.json();
    console.log('Request body received:', { ...body, password: '[HIDDEN]', confirmPassword: '[HIDDEN]' });
    
    // Validate input data
    const validation = validateData(body, registerSchema);
    if (!validation.isValid) {
      console.log('Validation failed:', validation.errors);
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      }, { status: 400 });
    }

    const { firstName, lastName, email, password, dateOfBirth, diabetesType } = validation.data;
    console.log('Validation successful for email:', email);

    // Connect to database
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Database connected successfully');

    // Check if user already exists
    console.log('Checking for existing user...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return NextResponse.json({
        success: false,
        message: 'User with this email already exists'
      }, { status: 409 });
    }
    console.log('No existing user found, proceeding with creation...');

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password, // Will be hashed by the pre-save middleware
      dateOfBirth: new Date(dateOfBirth),
      diabetesType: diabetesType || '',
      subscribeNewsletter: false,
      lastLogin: new Date()
    });

    console.log('User object created, attempting to save...');
    
    // Save user to database
    const savedUser = await newUser.save();
    console.log('User saved successfully with ID:', savedUser._id);

    // Generate tokens
    const tokenPayload = {
      userId: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: savedUser._id });
    console.log('Tokens generated successfully');

    // Get user data without password
    const userData = savedUser.toSafeObject();
    console.log('User data prepared for response');

    // Create response with tokens in cookies
    const response = NextResponse.json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userData,
        accessToken
      }
    }, { status: 201 });
    
    console.log('Response created successfully');

    // Set secure HTTP-only cookies
    response.cookies.set('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: 'User with this email already exists'
      }, { status: 409 });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Registration failed. Please try again.'
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
