import { checkQueue } from "../queues/postQueue.js"; // adjust path if needed

// For debugging, call it periodically or at the end of each job
const debugQueue = async () => {
  const counts = await checkQueue();
  console.log("Queue status checked:", counts);
};

// Example: call after processing a job
await debugQueue();
