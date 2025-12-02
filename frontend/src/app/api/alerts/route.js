import Twilio from 'twilio';
import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import Alert from '../../../models/Alert';
import Caregiver from '../../../models/Caregiver';
import Doctor from '../../../models/Doctor';
import { verifyToken } from '../../../lib/jwt';
// Twilio will be used to send SMS when available
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
let twilioClient = null;
if (accountSid && authToken) {
  try {
    twilioClient = Twilio(accountSid, authToken);
  } catch (e) {
    // capture init error (sanitized) and continue — we won't expose secrets
    twilioInitError = e && e.message ? String(e.message) : String(e);
    // eslint-disable-next-line no-console
    console.warn('Twilio init failed (see twilioInitError):', twilioInitError);
  }
}
let twilioInitError = null;
let twilioConfigured = false;
if (twilioClient && fromNumber) twilioConfigured = true;
// Log configuration status so developers can quickly see Twilio availability
/* eslint-disable no-console */
console.log('[alerts.route] Twilio configured:', twilioConfigured ? 'YES' : 'NO', '| fromNumber set:', !!fromNumber, twilioInitError ? '| initError: ' + twilioInitError : '');
/* eslint-enable no-console */

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
      const smsResults = [];

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
          // send SMS if possible
          if (twilioClient && contact.phone) {
            try {
              const locationText = data.location && data.location.lat && data.location.lng
                ? `Location: https://maps.google.com/?q=${data.location.lat},${data.location.lng}`
                : 'Location not available';

              const messageBody = `EMERGENCY ALERT for user:\nType: ${type}\nMessage: ${message}\n${locationText}`;
              const res = await twilioClient.messages.create({ to: contact.phone, from: fromNumber, body: messageBody });
              smsResults.push({ to: contact.phone, sid: res.sid, status: res.status });
            } catch (err) {
              smsResults.push({ to: contact.phone, error: String(err) });
            }
          }
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
          if (twilioClient && doctor.phone) {
            try {
              const locationText = data.location && data.location.lat && data.location.lng
                ? `Location: https://maps.google.com/?q=${data.location.lat},${data.location.lng}`
                : 'Location not available';
              const messageBody = `EMERGENCY ALERT for user:\nType: ${type}\nMessage: ${message}\n${locationText}`;
              const res = await twilioClient.messages.create({ to: doctor.phone, from: fromNumber, body: messageBody });
              smsResults.push({ to: doctor.phone, sid: res.sid, status: res.status });
            } catch (err) {
              smsResults.push({ to: doctor.phone, error: String(err) });
            }
          }
        }
      }
      alert.sentTo = sentTo;
      // Attach any SMS send results
      if (smsResults && smsResults.length) {
        alert.smsResults = smsResults;
      }

      // Log what was sent
      console.log(`Alert sent to ${sentTo.length} contacts:`, { type, title, message, smsCount: smsResults?.length || 0 });
    }

    await alert.save();

    return NextResponse.json({ 
      message: 'Alert created successfully',
      alert: alert.toObject(),
      twilioConfigured
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
