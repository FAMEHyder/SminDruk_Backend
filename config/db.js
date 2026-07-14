import mongoose from "mongoose";
import dns from "dns";
import logger from "../utils/logger.js";

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
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      dbName: process.env.MONGO_DB_NAME || "zarshan",
    });
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected.");
  });
};

export default connectDB;
