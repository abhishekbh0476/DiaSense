import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Story from '../../../../models/Story';
import { verifyToken } from '../../../../lib/jwt';

// GET all success stories
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Build query
    let query = { 
      isPublished: true,
      moderationStatus: 'approved'
    };
    
    if (category) {
      query.category = category;
    }

    // Fetch stories from database
    const stories = await Story.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ 
      success: true,
      stories: stories
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST create new success story
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

    const storyData = await request.json();
    
    if (!storyData.title || !storyData.content) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title and content are required' 
      }, { status: 400 });
    }

    // Create and save story to database
    const newStory = new Story({
      ...storyData,
      authorId: decoded.userId,
      author: `${decoded.firstName} ${decoded.lastName}` || 'Anonymous'
    });

    const savedStory = await newStory.save();
    console.log('Story created and saved to database:', savedStory._id);

    return NextResponse.json({ 
      success: true,
      message: 'Story shared successfully!',
      story: savedStory
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
