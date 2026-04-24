import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined");

const globalWithMongoose = global as typeof globalThis & {
  _mongoosePromise?: Promise<typeof mongoose>;
};

export async function connectDB(): Promise<typeof mongoose> {
  if (globalWithMongoose._mongoosePromise) {
    return globalWithMongoose._mongoosePromise;
  }
  globalWithMongoose._mongoosePromise = mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  });
  return globalWithMongoose._mongoosePromise;
}
