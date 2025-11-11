import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import Alert from '../../../models/Alert';
import Caregiver from '../../../models/Caregiver';
import Doctor from '../../../models/Doctor';
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
    const type = searchParams.get('type');
    const resolved = searchParams.get('resolved') === 'true';
    const limit = parseInt(searchParams.get('limit')) || 50;

    let query = { userId: decoded.userId };
    
    if (type) {
      query.type = type;
    }
    
    if (resolved !== undefined) {
      query.resolved = resolved;
    }

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
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
      type,
      category,
      title,
      message,
      data = {},
      sendToContacts = true
    } = await request.json();
    
    if (!type || !category || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const alert = new Alert({
      userId: decoded.userId,
      type,
      category,
      title,
      message,
      data,
      priority: type === 'emergency' ? 5 : type === 'critical' ? 4 : 3
    });

    // Send to contacts if requested
    if (sendToContacts) {
      const sentTo = [];

      // Get emergency contacts for critical/emergency alerts
      if (type === 'emergency' || type === 'critical') {
        const emergencyContacts = await Caregiver.find({
          userId: decoded.userId,
          emergencyContact: true,
          alertsEnabled: true
        });

        for (const contact of emergencyContacts) {
          sentTo.push({
            type: 'caregiver',
            contactId: contact._id,
            sentAt: new Date(),
            acknowledged: false
          });
        }
      }

      // Get doctors for medical alerts
      if (category === 'glucose' || category === 'medication') {
        const doctors = await Doctor.find({
          userId: decoded.userId,
          verified: true
        });

        for (const doctor of doctors) {
          sentTo.push({
            type: 'doctor',
            contactId: doctor._id,
            sentAt: new Date(),
            acknowledged: false
          });
        }
      }

      alert.sentTo = sentTo;

      // TODO: Send actual notifications (email, SMS, push notifications)
      console.log(`Alert sent to ${sentTo.length} contacts:`, { type, title, message });
    }

    await alert.save();

    return NextResponse.json({ 
      message: 'Alert created successfully',
      alert: alert.toObject()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
