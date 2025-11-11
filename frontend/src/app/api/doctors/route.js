import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
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

    const doctors = await Doctor.find({ userId: decoded.userId })
      .sort({ verified: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
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
      specialty,
      hospital,
      email,
      phone,
      address,
      licenseNumber,
      reportSharing,
      nextAppointment,
      notes
    } = await request.json();
    
    if (!name || !specialty || !hospital || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({
      userId: decoded.userId,
      email: email.toLowerCase()
    });

    if (existingDoctor) {
      return NextResponse.json({ error: 'Doctor with this email already exists' }, { status: 400 });
    }

    const doctor = new Doctor({
      userId: decoded.userId,
      name,
      specialty,
      hospital,
      email: email.toLowerCase(),
      phone,
      address,
      licenseNumber,
      verified: false, // Requires verification
      reportSharing: reportSharing || {
        enabled: true,
        frequency: 'monthly'
      },
      nextAppointment: nextAppointment ? new Date(nextAppointment) : null,
      notes
    });

    await doctor.save();

    return NextResponse.json({ 
      message: 'Doctor added successfully',
      doctor: doctor.toObject()
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding doctor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
