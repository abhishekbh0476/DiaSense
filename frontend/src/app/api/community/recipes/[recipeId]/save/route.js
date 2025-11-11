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

    // Check if user already saved this recipe
    const hasSaved = recipe.saves.includes(decoded.userId);
    
    if (hasSaved) {
      // Unsave the recipe
      recipe.saves = recipe.saves.filter(userId => userId.toString() !== decoded.userId);
    } else {
      // Save the recipe
      recipe.saves.push(decoded.userId);
    }

    await recipe.save();

    return NextResponse.json({ 
      message: hasSaved ? 'Recipe removed from saved' : 'Recipe saved',
      saved: !hasSaved,
      saveCount: recipe.saves.length
    });
  } catch (error) {
    console.error('Error saving recipe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
