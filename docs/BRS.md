# Social Media Management SaaS

# Backend Requirements Specification (BRS v1.0)

> Project codename: **Zarshan Backend** (product name: **SocialFlow**)
> This document defines the backend requirements only. It contains **no real
> secrets** — every credential is referenced by its environment variable name.
> Actual values live in a local `.env` file (never committed to git); see
> `.env.example` for the full list of placeholders.

## 1. Project Overview

### Project Name

SocialFlow – Social Media Management SaaS

### Objective

Develop a scalable REST API using **Express.js** and **MongoDB** that enables
users to connect multiple social media accounts, create posts, publish
instantly, schedule posts using cron jobs, manage media, generate AI content,
receive analytics, and manage subscriptions.

---

## 2. Technology Stack

| Concern             | Technology                                              |
| -------------------- | -------------------------------------------------------- |
| Runtime              | Node.js                                                   |
| Framework            | Express.js                                                |
| Database             | MongoDB Atlas                                             |
| ODM                  | Mongoose                                                  |
| Authentication       | JWT, Facebook OAuth, Google OAuth, GitHub OAuth (Passport)|
| Scheduler            | node-cron                                                 |
| File Upload          | Multer                                                    |
| Image/Video Storage  | Cloudinary                                                |
| AI                   | OpenAI API                                                |
| Email                | Nodemailer                                                |
| Validation           | Zod                                                        |
| Logging              | Morgan (HTTP) + Winston (application)                     |
| API Documentation    | Swagger (swagger-jsdoc + swagger-ui-express)               |
| Payments             | Stripe, PayPal                                             |
| Security             | Helmet, CORS, bcrypt, express-rate-limit                    |

---

## 3. Environment Configuration

The backend loads configuration from a `.env` file at the project root
(never committed). Copy `.env.example` to `.env` and fill in real values
locally or in your deployment provider's secret manager.

Required environment variables (see `.env.example` for the authoritative,
placeholder-only list):

* `PORT`, `NODE_ENV`, `API_URL`, `FRONTEND_URL`
* `MONGO_URL`
* `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`
* `FB_APP_ID`, `FB_APP_SECRET`, `FB_CALLBACK_URL`
* `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
* `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`
* `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
* `OPENAI_API_KEY`
* `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
* `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
* `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`

> **Security note:** never hardcode real values for the variables above in
> any requirements/spec document or in source control. Placeholders only.

---

## 4. Folder Structure

The project intentionally uses a **flat, simplified structure** (as
requested), instead of nesting everything under `src/`:

```text
zarshan-backend/
│
├── index.js              # App entry point (Express app + server bootstrap)
├── config/                # Environment-driven configuration
│   ├── db.js               # MongoDB (Mongoose) connection
│   ├── passport.js         # Google / GitHub / Facebook OAuth strategies
│   └── swagger.js          # Swagger/OpenAPI spec generation
├── routes/                # Express routers (one file per module)
├── controller/             # Route handlers / business logic entry points
├── models/                 # Mongoose schemas (14 collections)
├── middleware/              # auth, error, rate-limit, validation, upload
├── utils/                   # apiResponse, apiError, asyncHandler, jwt,
│                            # email, cloudinary, openai, logger, validators,
│                            # scheduler (node-cron)
├── media/
│   └── uploads/             # Temp local storage before pushing to Cloudinary
├── docs/
│   └── BRS.md                # This document
├── logs/                     # Winston log files (error.log, combined.log)
├── .env.example               # Placeholder environment variables
└── package.json
```

---

## 5. Authentication Module

### Features

* Register, Login, Logout, Refresh Token
* Forgot Password, Reset Password, Email Verification
* Google Login, GitHub Login, Facebook Login

### APIs

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh-token
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/verify-email
GET  /api/v1/auth/google
GET  /api/v1/auth/github
GET  /api/v1/auth/facebook
```

**Status:** Fully implemented (`controller/auth.controller.js`), including
refresh-token rotation, hashed reset tokens, and Passport-based OAuth
callbacks.

---

## 6. User Module

Get Profile · Update Profile · Upload Avatar · Delete Account · Change Password

**Status:** Fully implemented (`controller/user.controller.js`).

---

## 7. Workspace Module

Create · Update · Delete · Switch Workspace · Invite Members

**Status:** Fully implemented (`controller/workspace.controller.js`).

---

## 8. Team Module

Roles: Owner, Admin, Editor, Viewer
Invite Member · Remove Member · Update Permissions

**Status:** Fully implemented (`controller/team.controller.js`).

---

## 9. Social Account Integration

Platforms: Facebook, Instagram, LinkedIn, X, TikTok, Pinterest
Connect · Disconnect · Refresh Token · Sync Account · Check Connection Status

**Status:** Data model + CRUD implemented
(`controller/socialAccount.controller.js`). Real per-platform OAuth
handshakes are marked `TODO` and should be added per platform (each has a
different consent flow and token lifecycle).

---

## 10. Post Module

Types: Text, Image, Carousel, Video, Reel, Story
Actions: Publish Now · Schedule · Draft · Duplicate · Delete · Edit

**Status:** Fully implemented (`controller/post.controller.js`).

---

## 11. Direct Publishing

```
Create Post → Validate Request → Upload Media → Call Platform API →
Success → Save Published Status → Return Response
```

**Status:** Flow implemented end-to-end in `publishPostNow`; the actual
platform API call (`publishNow` helper) is stubbed with a `TODO` for each
social network's publish endpoint.

---

## 12. Scheduler Module

* Technology: `node-cron`, frequency `* * * * *` (every minute)
* Every run: find scheduled posts due → publish eligible posts → update
  status → save logs → notify user
* Status values: `draft`, `scheduled`, `publishing`, `published`, `failed`
* Retry: maximum 3 attempts

**Status:** Fully implemented (`utils/scheduler.js`), started from
`index.js` on boot. A manual trigger endpoint
(`POST /api/v1/posts/run-scheduler`) is included for testing.

---

## 13. Media Module

* Images: JPG, PNG, WEBP, GIF · Videos: MP4, MOV
* Upload · Delete · Preview · Search · Filter

**Status:** Fully implemented (`controller/media.controller.js`,
`middleware/upload.middleware.js`, `utils/cloudinary.js`).

---

## 14. AI Module (OpenAI)

Caption Generator · Hashtag Generator · Rewrite Caption · Translate Caption ·
Content Ideas · CTA Generator

**Status:** Fully implemented (`controller/ai.controller.js`,
`utils/openai.js`). Falls back to a clearly-labelled mock response if
`OPENAI_API_KEY` is not configured, so the API remains usable in local dev
without a paid key.

---

## 15. Analytics Module

Stores: Likes, Shares, Comments, Reach, Impressions, Clicks, Followers
Reports: Daily, Weekly, Monthly

**Status:** Fully implemented (`controller/analytics.controller.js`).
Ingestion (`recordMetrics`) is designed to be called by a scheduled sync
worker that pulls data from each platform's insights/analytics API.

---

## 16. Notification Module

Types: In-App, Email
Events: Publish Success, Publish Failed, Schedule Success, Team Invitation,
Password Changed

**Status:** Fully implemented (`controller/notification.controller.js`).
Email delivery reuses `utils/sendEmail.js`; in-app notifications are stored
in the `notifications` collection for the frontend to poll/subscribe to.

---

## 17. Blog Module

Create · Update · Delete · Publish · Categories · Tags

**Status:** Fully implemented (`controller/blog.controller.js`). Public
read endpoints, admin-only write endpoints.

---

## 18. Contact Module

Contact Form · Newsletter · Support Request

**Status:** Fully implemented (`controller/contact.controller.js`).

---

## 19. Payment Module

Gateways: Stripe, PayPal
Checkout · Verify Payment · Payment History · Webhooks

**Status:** Stripe checkout + webhook flow implemented
(`controller/payment.controller.js`); PayPal endpoints are stubbed with
`TODO`s since they require a separate Orders/Subscriptions API integration.

---

## 20. Subscription Module

Plans: Free, Starter, Professional, Agency, Enterprise
Upgrade · Downgrade · Usage Limits · Plan Validation

**Status:** Fully implemented (`controller/subscription.controller.js`),
including a `PLAN_LIMITS` table and usage-vs-limit checks.

---

## 21. Admin Module

Manage Users, Posts, Reports, Payments, Blogs, Plans · View Logs · Platform
Settings

**Status:** Fully implemented (`controller/admin.controller.js`), gated by
the `isAdmin` middleware.

---

## 22. MongoDB Collections

```
users
workspaces
team_members
social_accounts
posts
media
notifications
analytics
subscriptions
payments
blogs
contact_messages
audit_logs
refresh_tokens
```

All 14 collections are modeled under `models/` using Mongoose schemas.

---

## 23. Middleware

* `authenticate` — JWT authentication (`middleware/auth.middleware.js`)
* `isAdmin` / `authorize(...)` — role-based authorization
* `globalLimiter` / `authLimiter` — rate limiting (`express-rate-limit`)
* `helmet()`, `cors()` — security headers + CORS
* `errorHandler`, `notFoundHandler` — centralized error handling
* `morgan` — HTTP request logging
* `validate(schema)` — Zod-based input validation
* `upload` — Multer file upload handling

---

## 24. Logging

Winston writes to `logs/error.log` and `logs/combined.log`, and Mongo-backed
`audit_logs` capture: user login, failed login, post publish, scheduled
publish, cron job runs, payments, and errors.

---

## 25. API Standards

* RESTful APIs, JSON responses, standard HTTP status codes
* API versioning under `/api/v1`
* Pagination, filtering, sorting, and search supported on list endpoints
* Swagger documentation served at `/api/v1/docs`

---

## 26. Security Requirements

* JWT authentication with short-lived access tokens + rotating refresh tokens
* bcrypt password hashing
* Environment-variable-based configuration (no secrets in code)
* Rate limiting on all routes, stricter limits on auth routes
* Helmet (secure headers), CORS allow-list via `FRONTEND_URL`
* Zod request validation to mitigate injection/XSS-prone input
* Mongoose schema typing to reduce MongoDB injection risk

---

## 27. Development Phases

| Phase | Scope |
| ----- | ----- |
| 1 | Authentication, User Management, Workspace, Team |
| 2 | Social Media Integration, Media Upload, Post Creation, Direct Publishing |
| 3 | Scheduler (node-cron), Notifications, Analytics |
| 4 | AI Features, Payments, Subscription Plans, Admin Panel, Swagger Docs |

All four phases are scaffolded in this codebase; Phases 1–3 are fully wired
end-to-end, and Phase 4 has working AI + Stripe flows with PayPal and a few
platform-API integrations marked as `TODO` for real credentials/business
rules to be filled in.

---

## 28. Backend Architecture

```text
                Client (Next.js)
                       │
                 REST API (HTTPS)
                       │
                Express.js Routes
                       │
                  Controllers
                       │
              Business Logic Layer
                       │
     ┌─────────────────┴─────────────────┐
     │                                   │
 Mongoose Models                   node-cron Scheduler
     │                                   │
     └─────────────────┬─────────────────┘
                       │
                  MongoDB Atlas
                       │
     ┌─────────────────┼─────────────────┐
     │                 │                 │
 Cloudinary       OpenAI API      Social Media APIs
 (Media)           (AI)      (Facebook, Instagram, etc.)
```

### Recommendation

The backend follows a **modular architecture**: each feature (Auth, Posts,
Scheduler, AI, Analytics, Notifications, Payments, ...) has its own model,
controller, route, and validation layer. This keeps the code maintainable,
testable, and makes it straightforward to add new social platforms or
features later.
