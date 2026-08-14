import { authenticate, isAdmin } from "../middleware/auth.middleware.js";
import express from "express";
import * as adminController from "../controller/admin.controller.js";
import * as smmAdminController from "../controller/smmAdmin.controller.js";

const router = express.Router();

router.use(authenticate, isAdmin);

// Dashboard
router.get("/dashboard/overview", adminController.getDashboardOverview);
router.get("/reports/overview", adminController.getPlatformReports);
router.get("/analytics", adminController.getAnalyticsOverview);

// Users
router.get("/users", adminController.manageUsers);
router.get("/users/activity", adminController.getUserActivity);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id", adminController.updateUser);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.post("/users/:id/verify-email", adminController.verifyUserEmail);
router.post("/users/:id/reset-password", adminController.resetUserPassword);
router.delete("/users/:id", adminController.deleteUser);

// Workspaces
router.get("/workspaces", adminController.manageWorkspaces);
router.post("/workspaces", adminController.createWorkspaceAdmin);
router.patch("/workspaces/:id", adminController.updateWorkspaceAdmin);
router.delete("/workspaces/:id", adminController.deleteWorkspaceAdmin);

// Posts
router.get("/posts", adminController.managePosts);
router.delete("/posts/:id", adminController.deletePostAdmin);

// Social accounts
router.get("/social-accounts", adminController.getSocialAccountsOverview);
router.post("/social-accounts/:source/:id/refresh-token", adminController.manualRefreshSocialToken);

// Scheduler
router.get("/scheduler", adminController.getSchedulerStatus);
router.post("/scheduler/run", adminController.runSchedulerJob);

// Subscriptions & plans
router.get("/plans", adminController.managePlans);
router.get("/subscriptions", adminController.manageSubscriptions);
router.patch("/subscriptions/:id", adminController.updateSubscriptionAdmin);

// Payments
router.get("/payments", adminController.managePayments);

// SMM marketplace (provider sync remains intentionally separate)
router.get("/smm/overview", smmAdminController.getOverview);
router.get("/smm/categories", smmAdminController.listCategories);
router.post("/smm/categories", smmAdminController.createCategory);
router.patch("/smm/categories/:id", smmAdminController.updateCategory);
router.delete("/smm/categories/:id", smmAdminController.deleteCategory);
router.get("/smm/services", smmAdminController.listServices);
router.post("/smm/services", smmAdminController.createService);
router.patch("/smm/services/:id", smmAdminController.updateService);
router.delete("/smm/services/:id", smmAdminController.deleteService);
router.get("/smm/orders", smmAdminController.listOrders);
router.patch("/smm/orders/:id/status", smmAdminController.updateOrderStatus);
router.post("/smm/wallet/credit", smmAdminController.creditWallet);

// AI
router.get("/ai", adminController.getAiOverview);

// Media
router.get("/media", adminController.manageMedia);
router.delete("/media/:id", adminController.deleteMediaAdmin);

// Notifications
router.get("/notifications", adminController.manageNotifications);
router.post("/notifications/broadcast", adminController.broadcastNotification);

// Support
router.get("/support", adminController.manageSupport);
router.patch("/support/:id", adminController.updateSupportTicket);

// Blogs
router.get("/blogs", adminController.manageBlogs);

// Audit logs
router.get("/logs", adminController.viewLogs);

// Settings & system
router.get("/api-settings", adminController.getApiSettings);
router.get("/settings", adminController.getPlatformSettings);
router.patch("/settings", adminController.updatePlatformSettings);
router.get("/security", adminController.getSecurityOverview);
router.get("/system", adminController.getSystemStatus);

export default router;
