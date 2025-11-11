import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/mongodb';
import CommunityGroup from '../../../../../models/CommunityGroup';
import { verifyToken } from '../../../../../lib/jwt';

export async function POST(request, { params }) {
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

    const { groupId } = params;
    const group = await CommunityGroup.findById(groupId);
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = group.members.find(member => 
      member.userId.toString() === decoded.userId
    );

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 });
    }

    // Add user to group
    group.members.push({
      userId: decoded.userId,
      role: 'member',
      joinedAt: new Date()
    });

    group.lastActivity = new Date();
    await group.save();

    return NextResponse.json({ 
      message: 'Successfully joined group',
      group: group.toObject()
    });
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
