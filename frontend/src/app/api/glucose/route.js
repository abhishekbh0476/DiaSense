import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import User from '../../../models/User.js';
import { withAuth } from '../../../middleware/auth.js';
import { validateData, glucoseReadingSchema } from '../../../lib/validation.js';

// GET glucose readings
async function getGlucoseReadings(request) {
  try {
    await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const mealContext = searchParams.get('mealContext');

    // Build aggregation pipeline
    const pipeline = [
      { $match: { _id: request.userId } },
      { $unwind: '$glucoseReadings' },
    ];

    // Add date filters if provided
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      pipeline.push({
        $match: { 'glucoseReadings.timestamp': dateFilter }
      });
    }

    // Add meal context filter if provided
    if (mealContext) {
      pipeline.push({
        $match: { 'glucoseReadings.mealContext': mealContext }
      });
    }

    // Sort by timestamp (newest first)
    pipeline.push({
      $sort: { 'glucoseReadings.timestamp': -1 }
    });

    // Add pagination
    const skip = (page - 1) * limit;
    pipeline.push(
      { $skip: skip },
      { $limit: limit }
    );

    // Project only the glucose reading data
    pipeline.push({
      $project: {
        _id: '$glucoseReadings._id',
        value: '$glucoseReadings.value',
        timestamp: '$glucoseReadings.timestamp',
        mealContext: '$glucoseReadings.mealContext',
        notes: '$glucoseReadings.notes'
      }
    });

    const readings = await User.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [
      { $match: { _id: request.userId } },
      { $unwind: '$glucoseReadings' },
    ];

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      countPipeline.push({
        $match: { 'glucoseReadings.timestamp': dateFilter }
      });
    }

    if (mealContext) {
      countPipeline.push({
        $match: { 'glucoseReadings.mealContext': mealContext }
      });
    }

    countPipeline.push({ $count: 'total' });
    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      message: 'Glucose readings retrieved successfully',
      data: {
        readings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get glucose readings error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve glucose readings'
    }, { status: 500 });
  }
}

// POST new glucose reading
async function addGlucoseReading(request) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validation = validateData(body, glucoseReadingSchema);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      }, { status: 400 });
    }

    await connectToDatabase();

    // Add glucose reading to user
    const user = await User.findByIdAndUpdate(
      request.userId,
      {
        $push: {
          glucoseReadings: {
            $each: [validation.data],
            $sort: { timestamp: -1 } // Keep readings sorted by timestamp
          }
        }
      },
      { new: true, select: 'glucoseReadings' }
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Get the newly added reading
    const newReading = user.glucoseReadings[0];

    return NextResponse.json({
      success: true,
      message: 'Glucose reading added successfully',
      data: {
        reading: newReading
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Add glucose reading error:', error);
    
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
      message: 'Failed to add glucose reading'
    }, { status: 500 });
  }
}

// Export wrapped handlers with authentication
export const GET = withAuth(getGlucoseReadings);
export const POST = withAuth(addGlucoseReading);

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
