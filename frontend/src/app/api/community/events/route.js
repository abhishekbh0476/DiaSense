import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Event from '../../../../models/Event';
import { verifyToken } from '../../../../lib/jwt';

// GET all events
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Build query
    let query = { 
      isPublic: true,
      status: 'upcoming',
      date: { $gte: new Date() }
    };
    
    if (type) {
      query.type = type;
    }

    // Fetch events from database
    const events = await Event.find(query)
      .sort({ date: 1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ 
      success: true,
      events: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST create new event
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

    const eventData = await request.json();
    
    if (!eventData.title || !eventData.description || !eventData.date || !eventData.time) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title, description, date, and time are required' 
      }, { status: 400 });
    }

    // Create and save event to database
    const newEvent = new Event({
      ...eventData,
      date: new Date(eventData.date),
      organizerId: decoded.userId,
      organizer: `${decoded.firstName} ${decoded.lastName}` || 'Anonymous',
      maxAttendees: eventData.maxAttendees ? parseInt(eventData.maxAttendees) : 50
    });

    const savedEvent = await newEvent.save();
    console.log('Event created and saved to database:', savedEvent._id);

    return NextResponse.json({ 
      success: true,
      message: 'Event created successfully!',
      event: savedEvent
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
