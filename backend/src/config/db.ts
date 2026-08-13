import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB connected');
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));
}

export async function pingDB(): Promise<boolean> {
  try {
    await mongoose.connection.db?.admin().ping();
    return true;
  } catch {
    return false;
  }
}
