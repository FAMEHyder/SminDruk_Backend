import crypto from "crypto";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import PlatformSettings from "../models/platformSettings.model.js";
import SmmCategory from "../models/smmCategory.model.js";
import SmmService from "../models/smmService.model.js";
import SmmOrder from "../models/smmOrder.model.js";
import Wallet from "../models/wallet.model.js";
import WalletTransaction from "../models/walletTransaction.model.js";
import SmmRefill from "../models/smmRefill.model.js";
import SmmSupportTicket from "../models/smmSupportTicket.model.js";
import { getProviderAdapter } from "../utils/smmProviderAdapter.js";

const pageMeta = (page = 1, limit = 20) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
};

const ensureMarketplaceEnabled = async () => {
  if (process.env.SMM_MODULE_ENABLED?.trim().toLowerCase() === "false") {
    throw ApiError.forbidden("The SMM marketplace is currently unavailable.");
  }
  const settings = await PlatformSettings.findOne({ key: "default" }).lean();
  if (settings?.featureFlags?.smmMarketplaceEnabled === false) {
    throw ApiError.forbidden("The SMM marketplace is currently unavailable.");
  }
};

const getWallet = async (workspaceId, session) =>
  Wallet.findOneAndUpdate(
    { workspace: workspaceId },
    { $setOnInsert: { workspace: workspaceId, balance: 0, currency: "USD" } },
    { new: true, upsert: true, session }
  );

const listCategories = asyncHandler(async (_req, res) => {
  await ensureMarketplaceEnabled();
  const categories = await SmmCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  return new ApiResponse(200, "SMM categories fetched successfully.", categories).send(res);
});

const listServices = asyncHandler(async (req, res) => {
  await ensureMarketplaceEnabled();
  const { categoryId, platform, search } = req.query;
  const filter = { isActive: true };
  if (categoryId) filter.category = categoryId;
  if (platform) filter.platform = String(platform).toLowerCase();
  if (search) filter.$or = [{ name: new RegExp(String(search), "i") }, { description: new RegExp(String(search), "i") }];

  const services = await SmmService.find(filter)
    .select("-providerCostPerThousand -markupType -markupValue -providerName -providerServiceId")
    .populate("category", "name slug platform")
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return new ApiResponse(200, "SMM services fetched successfully.", services).send(res);
});

const getService = asyncHandler(async (req, res) => {
  await ensureMarketplaceEnabled();
  const service = await SmmService.findOne({ _id: req.params.id, isActive: true })
    .select("-providerCostPerThousand -markupType -markupValue -providerName -providerServiceId")
    .populate("category", "name slug platform")
    .lean();
  if (!service) throw ApiError.notFound("SMM service not found.");
  return new ApiResponse(200, "SMM service fetched successfully.", service).send(res);
});

const getWalletSummary = asyncHandler(async (req, res) => {
  await ensureMarketplaceEnabled();
  const wallet = await getWallet(req.workspaceId);
  return new ApiResponse(200, "Wallet fetched successfully.", wallet).send(res);
});

const listWalletTransactions = asyncHandler(async (req, res) => {
  await ensureMarketplaceEnabled();
  const { page, limit, skip } = pageMeta(req.query.page, req.query.limit);
  const [items, total] = await Promise.all([
    WalletTransaction.find({ workspace: req.workspaceId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WalletTransaction.countDocuments({ workspace: req.workspaceId }),
  ]);
  return new ApiResponse(200, "Wallet transactions fetched successfully.", items, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  }).send(res);
});

const listOrders = asyncHandler(async (req, res) => {
  await ensureMarketplaceEnabled();
  const { page, limit, skip } = pageMeta(req.query.page, req.query.limit);
  const filter = { workspace: req.workspaceId };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    SmmOrder.find(filter)
      .populate({ path: "service", select: "name platform ratePerThousand category", populate: { path: "category", select: "name" } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SmmOrder.countDocuments(filter),
  ]);
  return new ApiResponse(200, "SMM orders fetched successfully.", items, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  }).send(res);
});

const getOrder = asyncHandler(async (req, res) => {
  await ensureMarketplaceEnabled();
  const order = await SmmOrder.findOne({ _id: req.params.id, workspace: req.workspaceId })
    .populate({ path: "service", populate: { path: "category", select: "name" } })
    .lean();
  if (!order) throw ApiError.notFound("SMM order not found.");
  return new ApiResponse(200, "SMM order fetched successfully.", order).send(res);
});

const createOrder = asyncHandler(async (req, res) => {
  await ensureMarketplaceEnabled();
  const { serviceId, link, quantity } = req.body;
  const service = await SmmService.findOne({ _id: serviceId, isActive: true }).lean();
  if (!service) throw ApiError.notFound("SMM service is unavailable.");
  if (quantity < service.minQuantity || quantity > service.maxQuantity) {
    throw ApiError.badRequest(`Quantity must be between ${service.minQuantity} and ${service.maxQuantity}.`);
  }

  const charge = Number(((quantity / 1000) * service.ratePerThousand).toFixed(4));
  const providerCost = Number(((quantity / 1000) * (service.providerCostPerThousand ?? service.ratePerThousand)).toFixed(4));
  const commission = Number((charge - providerCost).toFixed(4));
  const providerConfigured = Boolean(service.providerName && service.providerServiceId);

  // Provider wallets are separate from customer wallets. Confirm the upstream
  // balance first so customer funds are never debited for an order that cannot
  // be submitted to its selected provider.
  if (providerConfigured) {
    try {
      const providerBalance = await getProviderAdapter(service.providerName).getBalance();
      const available = Number(providerBalance?.balance ?? providerBalance?.available ?? 0);
      if (!Number.isFinite(available) || available < providerCost) {
        throw ApiError.badRequest("This service is temporarily unavailable because the provider balance is low.");
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.badRequest("This service is temporarily unavailable because the provider cannot be reached.");
    }
  }
  const session = await mongoose.startSession();
  let order;
  try {
    await session.withTransaction(async () => {
      const wallet = await getWallet(req.workspaceId, session);
      if (wallet.balance < charge) throw ApiError.badRequest("Insufficient wallet balance.");

      const balanceBefore = wallet.balance;
      wallet.balance = Number((balanceBefore - charge).toFixed(4));
      wallet.lastTransactionAt = new Date();
      await wallet.save({ session });

      [order] = await SmmOrder.create(
        [{
          workspace: req.workspaceId,
          createdBy: req.user._id,
          service: service._id,
          publicOrderId: `SMD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
          link,
          quantity,
          charge,
          providerCost,
          commission,
          currency: service.currency,
        }],
        { session }
      );

      await WalletTransaction.create(
        [{
          workspace: req.workspaceId,
          wallet: wallet._id,
          type: "debit",
          amount: charge,
          balanceBefore,
          balanceAfter: wallet.balance,
          referenceType: "order",
          referenceId: order._id,
          description: `Order ${order.publicOrderId}: ${service.name}`,
          createdBy: req.user._id,
        }],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  if (providerConfigured) {
    try {
      const result = await getProviderAdapter(service.providerName).createOrder({
        service: service.providerServiceId,
        link,
        quantity,
      });
      if (!result?.order) throw new Error("Provider did not return an order id.");
      order = await SmmOrder.findByIdAndUpdate(
        order._id,
        { status: "processing", providerOrderId: String(result.order), providerPayload: { submittedAt: new Date() } },
        { new: true }
      );
    } catch (error) {
      // The funded local order is kept pending for a controlled retry after the
      // provider is available. Credentials and raw provider responses are not exposed.
      order = await SmmOrder.findByIdAndUpdate(
        order._id,
        { failureReason: "Provider submission is pending retry." },
        { new: true }
      );
    }
  }

  return new ApiResponse(201, "SMM order placed successfully.", order).send(res);
});

const getDashboard = asyncHandler(async (req, res) => {
  await ensureMarketplaceEnabled();
  const wallet = await getWallet(req.workspaceId);
  const [statusCounts, recentOrders] = await Promise.all([
    SmmOrder.aggregate([
      { $match: { workspace: new mongoose.Types.ObjectId(req.workspaceId) } },
      { $group: { _id: "$status", count: { $sum: 1 }, totalSpent: { $sum: "$charge" } } },
    ]),
    SmmOrder.find({ workspace: req.workspaceId })
      .populate("service", "name platform")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);
  const counts = Object.fromEntries(statusCounts.map((item) => [item._id, item.count]));
  return new ApiResponse(200, "SMM dashboard fetched successfully.", {
    wallet,
    stats: {
      totalOrders: statusCounts.reduce((sum, item) => sum + item.count, 0),
      totalSpent: statusCounts.reduce((sum, item) => sum + item.totalSpent, 0),
      pendingOrders: counts.pending || 0,
      processingOrders: counts.processing || 0,
      completedOrders: counts.completed || 0,
    },
    recentOrders,
  }).send(res);
});

const listRefills = asyncHandler(async (req, res) => {
  await ensureMarketplaceEnabled();
  const refills = await SmmRefill.find({ workspace: req.workspaceId })
    .populate({ path: "order", populate: { path: "service", select: "name platform" } })
    .sort({ createdAt: -1 })
    .lean();
  return new ApiResponse(200, "SMM refills fetched successfully.", refills).send(res);
});

const createRefill = asyncHandler(async (req, res) => {
  await ensureMarketplaceEnabled();
  const order = await SmmOrder.findOne({ _id: req.body.orderId, workspace: req.workspaceId })
    .populate("service", "refillSupported");
  if (!order) throw ApiError.notFound("SMM order not found.");
  if (order.status !== "completed" || !order.service?.refillSupported) {
    throw ApiError.badRequest("This order is not eligible for a refill.");
  }
  const existing = await SmmRefill.findOne({ order: order._id, status: { $in: ["pending", "processing"] } });
  if (existing) throw ApiError.conflict("A refill request is already active for this order.");
  const refill = await SmmRefill.create({ workspace: req.workspaceId, order: order._id, requestedBy: req.user._id });
  return new ApiResponse(201, "Refill requested successfully.", refill).send(res);
});

const listSupportTickets = asyncHandler(async (req, res) => {
  await ensureMarketplaceEnabled();
  const tickets = await SmmSupportTicket.find({ workspace: req.workspaceId, createdBy: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  return new ApiResponse(200, "SMM support tickets fetched successfully.", tickets).send(res);
});

const createSupportTicket = asyncHandler(async (req, res) => {
  await ensureMarketplaceEnabled();
  const ticket = await SmmSupportTicket.create({
    workspace: req.workspaceId,
    createdBy: req.user._id,
    subject: req.body.subject,
    message: req.body.message,
  });
  return new ApiResponse(201, "SMM support ticket created successfully.", ticket).send(res);
});

export {
  createOrder,
  getDashboard,
  getOrder,
  getService,
  getWalletSummary,
  listCategories,
  listOrders,
  listServices,
  listWalletTransactions,
  listRefills,
  createRefill,
  listSupportTickets,
  createSupportTicket,
};
