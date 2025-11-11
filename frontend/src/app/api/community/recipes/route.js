import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/mongodb';
import Recipe from '../../../../models/Recipe';
import { verifyToken } from '../../../../lib/jwt';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const tags = searchParams.get('tags')?.split(',');
    const difficulty = searchParams.get('difficulty');
    const maxPrepTime = parseInt(searchParams.get('maxPrepTime'));
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;

    let query = { isApproved: true, diabetesFriendly: true };
    
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (maxPrepTime) {
      query.prepTime = { $lte: maxPrepTime };
    }

    const skip = (page - 1) * limit;

    const recipes = await Recipe.find(query)
      .populate('authorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Recipe.countDocuments(query);

    // Add computed fields
    const recipesWithStats = recipes.map(recipe => ({
      ...recipe,
      averageRating: recipe.ratings.length > 0 
        ? (recipe.ratings.reduce((sum, r) => sum + r.rating, 0) / recipe.ratings.length).toFixed(1)
        : 0,
      likeCount: recipe.likes.length,
      saveCount: recipe.saves.length,
      totalTime: recipe.prepTime + (recipe.cookTime || 0)
    }));

    return NextResponse.json({ 
      recipes: recipesWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
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
      title,
      description,
      ingredients,
      instructions,
      nutrition,
      servings,
      prepTime,
      cookTime = 0,
      difficulty = 'medium',
      tags = [],
      glycemicIndex,
      image
    } = await request.json();
    
    if (!title || !ingredients || !instructions || !servings || !prepTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user info for author name
    const User = (await import('../../../../models/User')).default;
    const user = await User.findById(decoded.userId).select('firstName lastName');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const recipe = new Recipe({
      title,
      description,
      authorId: decoded.userId,
      authorName: `${user.firstName} ${user.lastName}`,
      ingredients,
      instructions,
      nutrition,
      servings,
      prepTime,
      cookTime,
      difficulty,
      tags,
      diabetesFriendly: true,
      glycemicIndex,
      image,
      isApproved: false // Requires approval
    });

    await recipe.save();

    return NextResponse.json({ 
      message: 'Recipe submitted successfully and is pending approval',
      recipe: recipe.toObject()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
