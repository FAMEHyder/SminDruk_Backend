import { redis } from "../redis/connection.js";

await redis.set("name", "Zeeshan");

const val = await redis.get("name");

console.log(val);
