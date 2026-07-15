/**
 * Reads Backend/.env and prints KEY=VALUE lines for Railway Raw Editor.
 * Run: node scripts/print-railway-env.cjs
 * Then paste output into Railway → Variables → Raw Editor → Deploy.
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");

if (!fs.existsSync(envPath)) {
  console.error("No .env file found at:", envPath);
  console.error("Create Backend/.env from .env.example first.");
  process.exit(1);
}

const raw = fs.readFileSync(envPath, "utf8");
const lines = raw.split(/\r?\n/);
const output = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;

  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  if (key) output.push(`${key}=${value}`);
}

// Ensure production flag for Railway
if (!output.some((l) => l.startsWith("NODE_ENV="))) {
  output.unshift("NODE_ENV=production");
}

console.log("\n--- Copy everything below into Railway → Variables → Raw Editor ---\n");
console.log(output.join("\n"));
console.log("\n--- End ---\n");
