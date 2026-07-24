import mongoose from "mongoose";
import dns from "dns";
import logger from "../utils/logger.js";
import { getMongoUrl } from "../utils/env.js";
/**
 * On some Windows/VPN/router setups, Node's own DNS resolver fails to resolve
 * the `_mongodb._tcp.*` SRV record used by `mongodb+srv://` URIs (ECONNREFUSED),
 * even though the OS resolver works fine. Pointing Node at a public resolver
 * fixes this without requiring the user to switch to a non-SRV connection string.
 */
dns.setServers(["8.8.8.8", "1.1.1.1"]);

/**
 * Establishes the MongoDB Atlas connection using Mongoose.
 * Reads the connection string from the MONGO_URL environment variable.
 */
const connectDB = async () => {
  const mongoUrl = getMongoUrl();
  if (!mongoUrl) {
    throw new Error("MONGO_URL is not set. Add it in Railway → Variables.");
  }

  try {
    const dbName = process.env.MONGO_DB_NAME?.trim() || "smindruk";
    const conn = await mongoose.connect(mongoUrl, {
      dbName,
      maxPoolSize: 25,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 10000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected.");
  });
};

export default connectDB;