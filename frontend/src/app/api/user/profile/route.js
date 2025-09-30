import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';
import { withAuth } from '../../../../middleware/auth.js';
import { validateData, profileUpdateSchema } from '../../../../lib/validation.js';

// GET user profile
async function getProfile(request) {
  try {
    console.log('Profile API called');
    console.log('User ID from middleware:', request.userId);
    
    await connectToDatabase();

    // Get user with all data except password
    const user = await User.findById(request.userId).select('-password');
    
    if (!user) {
      console.log('User not found with ID:', request.userId);
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    console.log('User profile retrieved successfully for:', user.email);
    return NextResponse.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: user.toSafeObject()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PUT update user profile
async function updateProfile(request) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validation = validateData(body, profileUpdateSchema);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      }, { status: 400 });
    }

    await connectToDatabase();

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      request.userId,
      { $set: validation.data },
      { 
        new: true, 
        runValidators: true,
        select: '-password'
      }
    );

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.toSafeObject()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Update profile error:', error);
    
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
      message: 'Failed to update profile'
    }, { status: 500 });
  }
}

// DELETE user account
async function deleteAccount(request) {
  try {
    await connectToDatabase();

    // Soft delete - update account status instead of actually deleting
    const updatedUser = await User.findByIdAndUpdate(
      request.userId,
      { 
        accountStatus: 'deleted',
        email: `deleted_${Date.now()}_${request.user.email}` // Prevent email conflicts
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Create response and clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    }, { status: 200 });

    // Clear authentication cookies
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete account'
    }, { status: 500 });
  }
}

// Export wrapped handlers with authentication
export const GET = withAuth(getProfile);
export const PUT = withAuth(updateProfile);
export const DELETE = withAuth(deleteAccount);

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}
