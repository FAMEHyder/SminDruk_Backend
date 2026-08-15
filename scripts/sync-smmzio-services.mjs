import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import SmmCategory from "../models/smmCategory.model.js";
import SmmService from "../models/smmService.model.js";
import { SmmZioProviderAdapter } from "../utils/smmProviderAdapter.js";

dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env"),
  override: true,
});

const toSlug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function run() {
  await connectDB();
  const providerServices = await new SmmZioProviderAdapter().getServices();
  if (!Array.isArray(providerServices)) throw new Error("SMMZIO returned an invalid service catalog.");

  const categories = new Map();
  let imported = 0;
  for (const item of providerServices) {
    const categoryName = String(item.category || "Other").trim() || "Other";
    let category = categories.get(categoryName);
    if (!category) {
      category = await SmmCategory.findOneAndUpdate(
        { slug: toSlug(categoryName) },
        { $setOnInsert: { name: categoryName, slug: toSlug(categoryName), platform: "other", isActive: false } },
        { new: true, upsert: true }
      );
      categories.set(categoryName, category);
    }

    const providerServiceId = String(item.service);
    await SmmService.findOneAndUpdate(
      { providerName: "smmzio", providerServiceId },
      {
        $set: {
          category: category._id,
          name: String(item.name || `SMMZIO service ${providerServiceId}`),
          description: String(item.description || ""),
          platform: "other",
          minQuantity: Math.max(Number(item.min) || 1, 1),
          maxQuantity: Math.max(Number(item.max) || 1, Number(item.min) || 1),
          ratePerThousand: Math.max(Number(item.rate) || 0, 0),
          currency: "USD",
          refillSupported: Boolean(item.refill),
          cancelSupported: Boolean(item.cancel),
          providerName: "smmzio",
          providerServiceId,
          isActive: false,
        },
        $setOnInsert: { slug: `smmzio-${providerServiceId}` },
      },
      { upsert: true, runValidators: true }
    );
    imported += 1;
  }

  console.log(`SMMZIO sync complete: ${imported} services imported as drafts across ${categories.size} categories.`);
}

run()
  .catch((error) => {
    console.error(`SMMZIO sync failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
