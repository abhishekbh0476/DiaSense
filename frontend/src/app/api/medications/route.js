import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import User from '../../../models/User.js';
import { withAuth } from '../../../middleware/auth.js';
import { validateData, medicationSchema } from '../../../lib/validation.js';

// GET medications
async function getMedications(request) {
  try {
    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('active');

    // Build query
    const user = await User.findById(request.userId).select('medications');
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    let medications = user.medications;

    // Filter by active status if specified
    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      medications = medications.filter(med => med.isActive === activeFilter);
    }

    // Sort by creation date (newest first)
    medications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({
      success: true,
      message: 'Medications retrieved successfully',
      data: {
        medications
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get medications error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve medications'
    }, { status: 500 });
  }
}

// POST new medication
async function addMedication(request) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validation = validateData(body, medicationSchema);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      }, { status: 400 });
    }

    await connectToDatabase();

    // Add medication to user
    const user = await User.findByIdAndUpdate(
      request.userId,
      {
        $push: {
          medications: validation.data
        }
      },
      { new: true, select: 'medications' }
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Get the newly added medication
    const newMedication = user.medications[user.medications.length - 1];

    return NextResponse.json({
      success: true,
      message: 'Medication added successfully',
      data: {
        medication: newMedication
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Add medication error:', error);
    
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
      message: 'Failed to add medication'
    }, { status: 500 });
  }
}

// Export wrapped handlers with authentication
export const GET = withAuth(getMedications);
export const POST = withAuth(addMedication);

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
