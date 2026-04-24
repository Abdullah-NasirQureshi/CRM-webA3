import mongoose from "mongoose";

export default async function globalTeardown() {
  // Close any open mongoose connections after all tests
  await mongoose.disconnect();
}
