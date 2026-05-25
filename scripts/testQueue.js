import { postQueue, checkQueue } from "../queues/postQueue.js";

console.log("🚀 Script started");

(async () => {
  try {
    console.log("Adding job...");

    await postQueue.add("test-job", { msg: "Hello Redis" });

    console.log("Job added");

    const counts = await checkQueue();

    console.log("Queue counts:", counts);

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    process.exit(0);
  }
})();

