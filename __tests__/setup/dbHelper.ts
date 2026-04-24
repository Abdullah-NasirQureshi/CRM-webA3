import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export async function setupTestDB() {
  await connectDB();
}

export async function teardownTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  (global as any)._mongoosePromise = undefined;
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
