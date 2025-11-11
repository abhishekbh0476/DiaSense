import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import GlucoseReading from '../../../models/GlucoseReading';
import Alert from '../../../models/Alert';
import { verifyToken } from '../../../lib/jwt';

export async function GET(request) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 7;
    const limit = parseInt(searchParams.get('limit')) || 100;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const readings = await GlucoseReading.find({
      userId: decoded.userId,
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

    // Get statistics
    const stats = await GlucoseReading.getAverageGlucose(decoded.userId, days);
    
    // Calculate time in range
    const totalReadings = readings.length;
    const inRangeReadings = readings.filter(r => r.value >= 70 && r.value <= 140).length;
    const timeInRange = totalReadings > 0 ? (inRangeReadings / totalReadings) * 100 : 0;
    
    const lowReadings = readings.filter(r => r.value < 70).length;
    const highReadings = readings.filter(r => r.value > 140).length;

    return NextResponse.json({ 
      readings: readings.map(reading => ({
        ...reading,
        status: reading.value < 70 ? 'low' : reading.value > 140 ? 'high' : 'normal'
      })),
      stats: {
        average: stats[0]?.avgGlucose || 0,
        min: stats[0]?.minGlucose || 0,
        max: stats[0]?.maxGlucose || 0,
        count: totalReadings,
        timeInRange: Math.round(timeInRange),
        lowReadings,
        highReadings
      }
    });
  } catch (error) {
    console.error('Error fetching glucose readings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { 
      value, 
      mealContext, 
      notes, 
      symptoms = [], 
      medicationTaken = false,
      exerciseRecent = false,
      stressLevel,
      sleepQuality 
    } = await request.json();
    
    if (!value || value < 20 || value > 600) {
      return NextResponse.json({ error: 'Invalid glucose value' }, { status: 400 });
    }

    const reading = new GlucoseReading({
      userId: decoded.userId,
      value,
      mealContext,
      notes,
      symptoms,
      medicationTaken,
      exerciseRecent,
      stressLevel,
      sleepQuality,
      timestamp: new Date()
    });

    await reading.save();

    // Check for alerts
    let alertType = null;
    let alertMessage = '';
    
    if (value < 70) {
      alertType = value < 54 ? 'critical' : 'warning';
      alertMessage = `Low blood sugar detected: ${value} mg/dL`;
    } else if (value > 250) {
      alertType = 'critical';
      alertMessage = `Very high blood sugar detected: ${value} mg/dL`;
    } else if (value > 180) {
      alertType = 'warning';
      alertMessage = `High blood sugar detected: ${value} mg/dL`;
    }

    if (alertType) {
      const alert = new Alert({
        userId: decoded.userId,
        type: alertType,
        category: 'glucose',
        title: alertType === 'critical' ? 'Critical Glucose Level' : 'Glucose Alert',
        message: alertMessage,
        data: {
          glucoseValue: value
        },
        priority: alertType === 'critical' ? 5 : 3
      });
      
      await alert.save();
    }

    return NextResponse.json({ 
      message: 'Glucose reading saved successfully',
      reading: {
        ...reading.toObject(),
        status: value < 70 ? 'low' : value > 140 ? 'high' : 'normal'
      },
      alert: alertType ? { type: alertType, message: alertMessage } : null
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving glucose reading:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
