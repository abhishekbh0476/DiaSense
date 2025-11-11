import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import GlucoseReading from '../../../../models/GlucoseReading';
import Medication from '../../../../models/Medication';
import { verifyToken } from '../../../../lib/jwt';

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
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get glucose stats
    const glucoseReadings = await GlucoseReading.find({
      userId: decoded.userId,
      timestamp: { $gte: startDate }
    }).lean();

    // Get active medications
    const activeMedications = await Medication.find({
      userId: decoded.userId,
      isActive: true
    }).lean();

    // Calculate stats
    const totalReadings = glucoseReadings.length;
    const avgGlucose = totalReadings > 0 
      ? glucoseReadings.reduce((sum, reading) => sum + reading.value, 0) / totalReadings 
      : 0;
    
    const inRangeReadings = glucoseReadings.filter(r => r.value >= 70 && r.value <= 140).length;
    const timeInRange = totalReadings > 0 ? (inRangeReadings / totalReadings) * 100 : 0;

    return NextResponse.json({
      glucoseStats: {
        totalReadings,
        avgGlucose: Math.round(avgGlucose),
        timeInRange: Math.round(timeInRange),
        lowReadings: glucoseReadings.filter(r => r.value < 70).length,
        highReadings: glucoseReadings.filter(r => r.value > 140).length
      },
      medicationStats: {
        activeMedications: activeMedications.length,
        totalMedications: activeMedications.length
      },
      period: {
        days,
        startDate,
        endDate: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
