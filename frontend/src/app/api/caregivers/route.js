import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import Caregiver from '../../../models/Caregiver';
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

    const caregivers = await Caregiver.find({ userId: decoded.userId })
      .sort({ emergencyContact: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ caregivers });
  } catch (error) {
    console.error('Error fetching caregivers:', error);
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
      relationship,
      email,
      phone,
      emergencyContact = false,
      alertsEnabled = true,
      alertPreferences,
      accessLevel = 'limited'
    } = await request.json();
    
    if (!name || !relationship || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if caregiver already exists
    const existingCaregiver = await Caregiver.findOne({
      userId: decoded.userId,
      email: email.toLowerCase()
    });

    if (existingCaregiver) {
      return NextResponse.json({ error: 'Caregiver with this email already exists' }, { status: 400 });
    }

    const caregiver = new Caregiver({
      userId: decoded.userId,
      name,
      relationship,
      email: email.toLowerCase(),
      phone,
      emergencyContact,
      alertsEnabled,
      alertPreferences: alertPreferences || {
        lowGlucose: true,
        highGlucose: true,
        missedMedication: true,
        emergencyOnly: false
      },
      accessLevel,
      inviteStatus: 'pending',
      inviteToken: Math.random().toString(36).substring(2, 15)
    });

    await caregiver.save();

    // TODO: Send invitation email to caregiver

    return NextResponse.json({ 
      message: 'Caregiver added successfully',
      caregiver: caregiver.toObject()
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding caregiver:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
