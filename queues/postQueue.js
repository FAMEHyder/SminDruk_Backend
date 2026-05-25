import { Queue } from "bullmq";
import Redis from "ioredis";

// ✅ Local Docker Redis connection
const bullConnection = new Redis({
  host: "127.0.0.1",   // Docker Redis localhost par expose hota hai
  port: 6379,          // Default Redis port
  maxRetriesPerRequest: null, // BullMQ requirement
});

// Create queue
export const postQueue = new Queue("facebook-posts", {
  connection: bullConnection,
});

// Queue status check
export const checkQueue = async () => {
  try {
    const counts = await postQueue.getJobCounts();
    console.log("Queue 'facebook-posts' job counts:", counts);
    return counts;
  } catch (err) {
    console.error("Queue check failed:", err.message);
    return null;
  }
};
