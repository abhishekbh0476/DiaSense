import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import CommunityGroup from '../../../../models/CommunityGroup';
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
    const category = searchParams.get('category');
    const region = searchParams.get('region');
    const joined = searchParams.get('joined') === 'true';

    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (region) {
      query.region = region;
    }

    if (joined) {
      query['members.userId'] = decoded.userId;
    }

    const groups = await CommunityGroup.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ lastActivity: -1 })
      .lean();

    // Add user membership status
    const groupsWithMembership = groups.map(group => ({
      ...group,
      memberCount: group.members.length,
      isJoined: group.members.some(member => member.userId.toString() === decoded.userId),
      userRole: group.members.find(member => member.userId.toString() === decoded.userId)?.role || null
    }));

    return NextResponse.json({ groups: groupsWithMembership });
  } catch (error) {
    console.error('Error fetching community groups:', error);
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
      description,
      category,
      region = 'global',
      isPrivate = false,
      rules = [],
      tags = []
    } = await request.json();
    
    if (!name || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const group = new CommunityGroup({
      name,
      description,
      category,
      region,
      createdBy: decoded.userId,
      moderators: [decoded.userId],
      members: [{
        userId: decoded.userId,
        role: 'admin',
        joinedAt: new Date()
      }],
      isPrivate,
      rules,
      tags,
      lastActivity: new Date()
    });

    await group.save();

    return NextResponse.json({ 
      message: 'Community group created successfully',
      group: group.toObject()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating community group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
