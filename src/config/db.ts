import mongoose from "mongoose";

// Cache the connection across serverless invocations (Vercel warm starts)
let cached = (global as any).mongoose as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI!, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        console.log("MongoDB Connected");
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("MongoDB connection error:", error);
    throw error; // let the request handler return a 500 gracefully
  }

  return cached.conn;
};