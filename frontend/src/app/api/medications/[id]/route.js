import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb.js';
import User from '../../../../models/User.js';
import { withAuth } from '../../../../middleware/auth.js';
import { validateData, medicationSchema } from '../../../../lib/validation.js';
import mongoose from 'mongoose';

// GET specific medication
async function getMedication(request, { params }) {
  try {
    const { id } = params;

    // Validate medication ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid medication ID'
      }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(request.userId).select('medications');
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    const medication = user.medications.id(id);
    
    if (!medication) {
      return NextResponse.json({
        success: false,
        message: 'Medication not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Medication retrieved successfully',
      data: {
        medication
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get medication error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve medication'
    }, { status: 500 });
  }
}

// PUT update medication
async function updateMedication(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate medication ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid medication ID'
      }, { status: 400 });
    }

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

    // Update medication using array filters
    const user = await User.findOneAndUpdate(
      { 
        _id: request.userId,
        'medications._id': id
      },
      {
        $set: {
          'medications.$.name': validation.data.name,
          'medications.$.dosage': validation.data.dosage,
          'medications.$.frequency': validation.data.frequency,
          'medications.$.reminderTimes': validation.data.reminderTimes,
          'medications.$.isActive': validation.data.isActive
        }
      },
      { new: true, select: 'medications' }
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User or medication not found'
      }, { status: 404 });
    }

    const updatedMedication = user.medications.id(id);

    return NextResponse.json({
      success: true,
      message: 'Medication updated successfully',
      data: {
        medication: updatedMedication
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Update medication error:', error);
    
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
      message: 'Failed to update medication'
    }, { status: 500 });
  }
}

// DELETE medication
async function deleteMedication(request, { params }) {
  try {
    const { id } = params;

    // Validate medication ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid medication ID'
      }, { status: 400 });
    }

    await connectToDatabase();

    // Remove medication from user's medications array
    const user = await User.findByIdAndUpdate(
      request.userId,
      {
        $pull: {
          medications: { _id: id }
        }
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Medication deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Delete medication error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete medication'
    }, { status: 500 });
  }
}

// Export wrapped handlers with authentication
export const GET = withAuth(getMedication);
export const PUT = withAuth(updateMedication);
export const DELETE = withAuth(deleteMedication);

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}
