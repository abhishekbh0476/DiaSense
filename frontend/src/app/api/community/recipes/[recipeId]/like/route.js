import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../../lib/mongodb';
import Recipe from '../../../../../../models/Recipe';
import { verifyToken } from '../../../../../../lib/jwt';

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

    const { recipeId } = params;
    const recipe = await Recipe.findById(recipeId);
    
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Check if user already liked this recipe
    const hasLiked = recipe.likes.includes(decoded.userId);
    
    if (hasLiked) {
      // Unlike the recipe
      recipe.likes = recipe.likes.filter(userId => userId.toString() !== decoded.userId);
    } else {
      // Like the recipe
      recipe.likes.push(decoded.userId);
    }

    await recipe.save();

    return NextResponse.json({ 
      message: hasLiked ? 'Recipe unliked' : 'Recipe liked',
      liked: !hasLiked,
      likeCount: recipe.likes.length
    });
  } catch (error) {
    console.error('Error liking recipe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
