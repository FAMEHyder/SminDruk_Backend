import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import SmmCategory from "../models/smmCategory.model.js";
import SmmService from "../models/smmService.model.js";
import SmmOrder from "../models/smmOrder.model.js";
import Wallet from "../models/wallet.model.js";
import WalletTransaction from "../models/walletTransaction.model.js";
import { getProviderAdapter } from "../utils/smmProviderAdapter.js";

const pageMeta = (page = 1, limit = 20) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
};

const toSlug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const importProviderServices = async (providerName) => {
  const providerServices = await getProviderAdapter(providerName).getServices();
  if (!Array.isArray(providerServices)) throw ApiError.badRequest("Provider returned an invalid service catalog.");
  const categories = new Map();
  for (const item of providerServices) {
    const categoryName = String(item.category || "Other").trim() || "Other";
    let category = categories.get(categoryName);
    if (!category) {
      const slug = toSlug(categoryName);
      category = await SmmCategory.findOneAndUpdate(
        { slug: `${providerName}-${slug}` },
        { $setOnInsert: { name: categoryName, slug: `${providerName}-${slug}`, platform: "other", isActive: false } },
        { new: true, upsert: true }
      );
      categories.set(categoryName, category);
    }
    const providerServiceId = String(item.service);
    await SmmService.findOneAndUpdate(
      { providerName, providerServiceId },
      { $set: { category: category._id, name: String(item.name || `Provider service ${providerServiceId}`), description: String(item.description || ""), platform: "other", minQuantity: Math.max(Number(item.min) || 1, 1), maxQuantity: Math.max(Number(item.max) || 1, Number(item.min) || 1), ratePerThousand: Math.max(Number(item.rate) || 0, 0), currency: "USD", refillSupported: Boolean(item.refill), cancelSupported: Boolean(item.cancel), providerName, providerServiceId, isActive: false }, $setOnInsert: { slug: `${providerName}-${providerServiceId}` } },
      { new: true, upsert: true, runValidators: true }
    );
  }
  return { imported: providerServices.length };
};

const listCategories = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageMeta(req.query.page, req.query.limit);
  const filter = {};
  if (req.query.search) filter.name = new RegExp(String(req.query.search), "i");
  if (req.query.status === "active") filter.isActive = true;
  if (req.query.status === "inactive") filter.isActive = false;
  const [items, total] = await Promise.all([
    SmmCategory.find(filter).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit).lean(),
    SmmCategory.countDocuments(filter),
  ]);
  return new ApiResponse(200, "SMM categories fetched successfully.", items, { page, limit, total, totalPages: Math.ceil(total / limit) }).send(res);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, platform, icon, sortOrder, isActive } = req.body;
  const category = await SmmCategory.create({
    name,
    slug: toSlug(slug || name),
    description,
    platform,
    icon,
    sortOrder,
    isActive,
  });
  return new ApiResponse(201, "SMM category created successfully.", category).send(res);
});

const updateCategory = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.slug) data.slug = toSlug(data.slug);
  const category = await SmmCategory.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!category) throw ApiError.notFound("SMM category not found.");
  return new ApiResponse(200, "SMM category updated successfully.", category).send(res);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await SmmService.exists({ category: req.params.id });
  if (inUse) throw ApiError.conflict("This category has services and cannot be deleted.");
  const category = await SmmCategory.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound("SMM category not found.");
  return new ApiResponse(200, "SMM category deleted successfully.").send(res);
});

const listServices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageMeta(req.query.page, req.query.limit);
  const filter = {};
  if (req.query.categoryId) filter.category = req.query.categoryId;
  if (req.query.platform) filter.platform = req.query.platform;
  if (req.query.provider) filter.providerName = req.query.provider;
  if (req.query.status === "active") filter.isActive = true;
  if (req.query.status === "inactive") filter.isActive = false;
  if (req.query.search) filter.$or = [{ name: new RegExp(String(req.query.search), "i") }, { description: new RegExp(String(req.query.search), "i") }];
  const [items, total] = await Promise.all([
    SmmService.find(filter).populate("category", "name").sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit).lean(),
    SmmService.countDocuments(filter),
  ]);
  return new ApiResponse(200, "SMM services fetched successfully.", items, { page, limit, total, totalPages: Math.ceil(total / limit) }).send(res);
});

const createService = asyncHandler(async (req, res) => {
  const data = { ...req.body, slug: toSlug(req.body.slug || req.body.name) };
  if (data.maxQuantity < data.minQuantity) throw ApiError.badRequest("Maximum quantity must be greater than minimum quantity.");
  const service = await SmmService.create(data);
  return new ApiResponse(201, "SMM service created successfully.", service).send(res);
});

const updateService = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.slug) data.slug = toSlug(data.slug);
  if (data.maxQuantity !== undefined && data.minQuantity !== undefined && data.maxQuantity < data.minQuantity) {
    throw ApiError.badRequest("Maximum quantity must be greater than minimum quantity.");
  }
  const service = await SmmService.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!service) throw ApiError.notFound("SMM service not found.");
  return new ApiResponse(200, "SMM service updated successfully.", service).send(res);
});

const deleteService = asyncHandler(async (req, res) => {
  const orderExists = await SmmOrder.exists({ service: req.params.id });
  if (orderExists) {
    const service = await SmmService.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!service) throw ApiError.notFound("SMM service not found.");
    return new ApiResponse(200, "Service archived because it has order history.", service).send(res);
  }
  const service = await SmmService.findByIdAndDelete(req.params.id);
  if (!service) throw ApiError.notFound("SMM service not found.");
  return new ApiResponse(200, "SMM service deleted successfully.").send(res);
});

const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageMeta(req.query.page, req.query.limit);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.workspaceId) filter.workspace = req.query.workspaceId;
  const [items, total] = await Promise.all([
    SmmOrder.find(filter).populate("service", "name platform").populate("workspace", "name").populate("createdBy", "firstName lastName email").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SmmOrder.countDocuments(filter),
  ]);
  return new ApiResponse(200, "SMM orders fetched successfully.", items, { page, limit, total, totalPages: Math.ceil(total / limit) }).send(res);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const allowed = ["pending", "processing", "completed", "partial", "cancelled", "refunded", "failed"];
  if (!allowed.includes(req.body.status)) throw ApiError.badRequest("Invalid SMM order status.");
  const update = { status: req.body.status };
  if (req.body.failureReason !== undefined) update.failureReason = req.body.failureReason;
  if (["completed", "cancelled", "refunded", "failed"].includes(req.body.status)) update.completedAt = new Date();
  const order = await SmmOrder.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!order) throw ApiError.notFound("SMM order not found.");
  return new ApiResponse(200, "SMM order status updated successfully.", order).send(res);
});

const creditWallet = asyncHandler(async (req, res) => {
  const { workspaceId, amount, description = "Manual wallet credit" } = req.body;
  if (!Number.isFinite(amount) || amount <= 0) throw ApiError.badRequest("A positive credit amount is required.");
  const session = await mongoose.startSession();
  let wallet;
  try {
    await session.withTransaction(async () => {
      wallet = await Wallet.findOneAndUpdate(
        { workspace: workspaceId },
        { $setOnInsert: { workspace: workspaceId, balance: 0, currency: "USD" } },
        { new: true, upsert: true, session }
      );
      const balanceBefore = wallet.balance;
      wallet.balance = Number((balanceBefore + amount).toFixed(4));
      wallet.lastTransactionAt = new Date();
      await wallet.save({ session });
      await WalletTransaction.create([{
        workspace: workspaceId, wallet: wallet._id, type: "credit", amount, balanceBefore,
        balanceAfter: wallet.balance, referenceType: "manual_credit", description, createdBy: req.user._id,
      }], { session });
    });
  } finally {
    await session.endSession();
  }
  return new ApiResponse(200, "Wallet credited successfully.", wallet).send(res);
});

const getOverview = asyncHandler(async (_req, res) => {
  const [categories, activeServices, orders, statusRows, walletRows] = await Promise.all([
    SmmCategory.countDocuments(), SmmService.countDocuments({ isActive: true }), SmmOrder.countDocuments(),
    SmmOrder.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$charge" } } }]),
    Wallet.aggregate([{ $group: { _id: null, balance: { $sum: "$balance" } } }]),
  ]);
  const byStatus = Object.fromEntries(statusRows.map((row) => [row._id, row.count]));
  return new ApiResponse(200, "SMM overview fetched successfully.", {
    stats: {
      categories, activeServices, totalOrders: orders, pendingOrders: byStatus.pending || 0,
      completedOrders: byStatus.completed || 0, totalSales: statusRows.reduce((sum, row) => sum + row.revenue, 0),
      walletLiability: walletRows[0]?.balance || 0,
    },
  }).send(res);
});

const syncProviderServices = asyncHandler(async (_req, res) => {
  const result = await importProviderServices("smmzio");
  return new ApiResponse(200, "SMMZIO services imported as disabled drafts. Review and enable them before customers can order.", result).send(res);
});

const syncPakProviderServices = asyncHandler(async (_req, res) => {
  const result = await importProviderServices("paksmmcheap");
  return new ApiResponse(200, "Pak services imported as disabled drafts. Review and enable them before customers can order.", result).send(res);
});

export {
  createCategory, createService, creditWallet, deleteCategory, deleteService,
  getOverview, listCategories, listOrders, listServices, syncPakProviderServices, syncProviderServices, updateCategory, updateOrderStatus, updateService,
};
