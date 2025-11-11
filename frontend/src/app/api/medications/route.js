import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import Medication from '../../../models/Medication';
import MedicationLog from '../../../models/MedicationLog';
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
    const activeOnly = searchParams.get('active') === 'true';
    
    const query = { userId: decoded.userId };
    if (activeOnly) {
      query.isActive = true;
    }

    const medications = await Medication.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Get adherence data for each medication
    const medicationsWithAdherence = await Promise.all(
      medications.map(async (med) => {
        const adherenceData = await MedicationLog.getAdherenceRate(decoded.userId, 30);
        const logs = await MedicationLog.find({
          userId: decoded.userId,
          medicationId: med._id,
          scheduledTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).sort({ scheduledTime: -1 }).limit(10);

        return {
          ...med,
          adherenceRate: adherenceData[0]?.adherenceRate || 0,
          recentLogs: logs
        };
      })
    );

    return NextResponse.json({ 
      medications: medicationsWithAdherence 
    });
  } catch (error) {
    console.error('Error fetching medications:', error);
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
      name, 
      type,
      dosage,
      frequency,
      instructions,
      prescribedBy,
      startDate,
      endDate,
      reminders
    } = await request.json();
    
    if (!name || !type || !dosage || !frequency || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const medication = new Medication({
      userId: decoded.userId,
      name,
      type,
      dosage,
      frequency,
      instructions,
      prescribedBy,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      reminders: reminders || { enabled: true, minutesBefore: 15 }
    });

    await medication.save();

    // Create medication logs for the next 30 days
    const logs = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      for (let i = 0; i < frequency.timesPerDay; i++) {
        if (frequency.times && frequency.times[i]) {
          const scheduledTime = new Date(date);
          scheduledTime.setHours(frequency.times[i].hour, frequency.times[i].minute, 0, 0);
          
          logs.push({
            userId: decoded.userId,
            medicationId: medication._id,
            scheduledTime,
            status: 'pending'
          });
        }
      }
    }

    if (logs.length > 0) {
      await MedicationLog.insertMany(logs);
    }

    return NextResponse.json({ 
      message: 'Medication added successfully',
      medication: medication.toObject()
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding medication:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
