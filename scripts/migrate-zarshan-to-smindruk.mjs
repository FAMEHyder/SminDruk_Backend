/**
 * One-time migration: copy every collection from DB "zarshan" → "smindruk".
 *
 * Usage (from Backend folder):
 *   node scripts/migrate-zarshan-to-smindruk.mjs
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const SOURCE_DB = "zarshan";
const TARGET_DB = "smindruk";
const mongoUrl = process.env.MONGO_URL?.trim() || process.env.MONGODB_URI?.trim();

if (!mongoUrl) {
  console.error("MONGO_URL is missing in Backend/.env");
  process.exit(1);
}

const BATCH = 500;

async function copyCollection(sourceDb, targetDb, name) {
  const source = sourceDb.collection(name);
  const target = targetDb.collection(name);

  const total = await source.countDocuments();
  if (total === 0) {
    console.log(`  · ${name}: empty, skipped`);
    return { name, copied: 0 };
  }

  // Replace target contents so re-runs are safe
  await target.deleteMany({});

  let copied = 0;
  const cursor = source.find({}).batchSize(BATCH);

  let batch = [];
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= BATCH) {
      await target.insertMany(batch, { ordered: false });
      copied += batch.length;
      batch = [];
      process.stdout.write(`  · ${name}: ${copied}/${total}\r`);
    }
  }
  if (batch.length) {
    await target.insertMany(batch, { ordered: false });
    copied += batch.length;
  }

  // Indexes
  const indexes = await source.indexes();
  for (const idx of indexes) {
    if (idx.name === "_id_") continue;
    const { key, name: indexName, v, ns, ...options } = idx;
    try {
      await target.createIndex(key, { ...options, name: indexName });
    } catch (err) {
      console.warn(`  ! index ${indexName} on ${name}: ${err.message}`);
    }
  }

  console.log(`  · ${name}: ${copied} docs copied`);
  return { name, copied };
}

async function main() {
  console.log(`Connecting…`);
  const conn = await mongoose.connect(mongoUrl, {
    dbName: SOURCE_DB,
    serverSelectionTimeoutMS: 30000,
  });

  const client = conn.connection.getClient();
  const sourceDb = client.db(SOURCE_DB);
  const targetDb = client.db(TARGET_DB);

  const collections = (await sourceDb.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."));

  console.log(`Source: ${SOURCE_DB} (${collections.length} collections)`);
  console.log(`Target: ${TARGET_DB}`);
  console.log("---");

  let totalDocs = 0;
  for (const name of collections.sort()) {
    const result = await copyCollection(sourceDb, targetDb, name);
    totalDocs += result.copied;
  }

  console.log("---");
  console.log(`Done. ${totalDocs} documents migrated ${SOURCE_DB} → ${TARGET_DB}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Migration failed:", err.message);
  console.error(err.stack);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
