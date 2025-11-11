import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

console.log('MongoDB URI check:', {
  exists: !!MONGODB_URI,
  preview: MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'NOT SET'
});

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  console.error('Please create a .env.local file in your project root with:');
  console.error('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/glucotrack');
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Creating new MongoDB connection...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('MongoDB connection established');
  } catch (e) {
    console.error('❌ MongoDB connection failed:', e.message);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export { connectDB };
export default connectDB;
