# Smindruk — Enterprise Product Requirements Document & AI Knowledge Base

**Version:** 1.0.0

**Status:** Controlled Source of Truth

**Classification:** Internal — Engineering, Product, Support, AI RAG

**Brand:** Smindruk

**Tagline:** Social Media Management, Simplified

**User Application:** https://smindruk.vercel.app

**Admin Application:** https://dashboard-smindruk.vercel.app

**Public API:** https://smindruk.up.railway.app/api/v1

**Generated for:** Groq RAG chatbots, developers, QA, designers, DevOps, support, end users, product managers

This document is intentionally exhaustive. Do not summarize away details when answering questions from this knowledge base. Prefer quoting business rules, endpoint paths, statuses, and validation constraints exactly as written.

## Table of Contents

- 1. Product Overview
- 2. Vision
- 3. Mission
- 4. Goals
- 5. Target Audience
- 6. Personas
- 7. Subscription Plans
- 8. System Architecture
- 9. Authentication
- 10. Dashboard
- 11. Workspace Management
- 12. Team Management
- 13. Role Based Access Control (RBAC)
- 14. Social Account Connections (Overview)
- 15. Facebook Integration
- 16. Instagram Integration
- 17. LinkedIn Integration
- 18. X (Twitter) Integration
- 19. Threads Integration
- 20. TikTok Integration
- 21. Pinterest Integration
- 22. YouTube Integration
- 23. Google Business Profile Integration
- 24. Media Library
- 25. Post Composer
- 26. AI Caption Generator
- 27. AI Hashtag Generator
- 28. AI Rewrite
- 29. AI Translation
- 30. Additional AI Tools
- 31. Scheduler
- 32. Queue Management
- 33. Calendar View
- 34. Drafts
- 35. Bulk Upload & Bulk Scheduling
- 36. Trending Dataset & Connected Pages
- 37. Analytics
- 38. Reports
- 39. Unified Inbox (Roadmap)
- 40. Automation & Auto Reply (Roadmap)
- 41. Keyword Reply (Roadmap)
- 42. Notifications
- 43. Billing & Subscription
- 44. Coupons (Roadmap / Admin extensibility)
- 45. Invoices & Payments
- 46. Settings & Profile
- 47. Security
- 48. Public API & Webhooks
- 49. Integrations
- 50. Cron Jobs
- 51. Token Refresh System (Deep Dive)
- 52. Audit Logs
- 53. Admin Panel
- 54. Monitoring
- 55. Feature Flags
- 56. Support Center
- 57. Troubleshooting Guide
- 58. Error Reference
- 59. FAQ Master List
- 60. Future Roadmap
- 61. Database Schema (ER)
- 62. API Catalog
- 63. Glossary & Terminology
- 64. Appendix

## Chapter 1: Product Overview

Smindruk is a modern Social Media Management SaaS platform that enables individuals, brands, agencies, and enterprises to connect social channels, create content, schedule publishing, run AI-assisted writing, manage media, analyze performance, and administer workspaces with role-based access control.

The production system is composed of three applications: (1) the customer-facing Next.js web app deployed at https://smindruk.vercel.app, (2) the Express.js REST API deployed at https://smindruk.up.railway.app with versioned routes under /api/v1, and (3) the Admin Dashboard Next.js app at https://dashboard-smindruk.vercel.app. Persistence is MongoDB (database name smindruk). Media files are stored on Cloudinary. AI text generation uses Groq's OpenAI-compatible Chat Completions API (GROQ_API_KEY).

Facebook Pages are the first fully live social network for connect, publish, schedule, analytics insights sync, and trending dataset bulk posting. Other networks appear in the UI as Coming Soon with schema preparedness.

### 1.1 Dual Storage Model for Facebook Pages

Smindruk separates Facebook page storage by connect purpose. **Manage mode** stores pages in the SocialAccount collection with connectSource=manage for normal Create Post and scheduling, and these accounts count in admin Manage totals. **Trending / Include in dataset mode** upserts ConnectedPage documents (unique pageNumber for bulk ranges) and also upserts SocialAccount with connectSource=dataset so the owner can still create/schedule posts to their own pages, while admin Manage counts exclude connectSource=dataset.

| Mode | UI Label | Primary Store | Also Writes | Admin Count Bucket |
| --- | --- | --- | --- | --- |
| manage | I just want to manage my account | SocialAccount (connectSource=manage) | — | Manage |
| trending | Include in trending dataset | ConnectedPage | SocialAccount (connectSource=dataset) | Dataset |

### 1.2 High-Level Architecture (Text Diagram)

```text

[Browser: zarshan Next.js] ----HTTPS----> [Express API /api/v1]
[Browser: AdminDashboard]  ----HTTPS----> [Express API /api/v1/admin]
        |                                      |
        |                                      +--> MongoDB (smindruk)
        |                                      +--> Cloudinary
        |                                      +--> Groq AI
        |                                      +--> Facebook Graph API
        |                                      +--> Stripe webhooks
        +-- node-cron inside API process ------+
              * every minute: scheduled posts + bulk posts
              * daily 12:00 Asia/Karachi: Facebook token refresh

```

## Chapter 2: Vision

Vision: Become the most dependable, AI-augmented social operations system for teams who need reliable scheduling, clear workspace governance, and transparent token health — starting with Facebook Pages excellence and expanding to a full multi-network stack.

Vision principles: (1) Reliability over vanity metrics — scheduled posts must keep retrying rather than silently dying when recoverable errors occur. (2) Separation of dataset and manage inventories for agencies running numbered page fleets. (3) AI as a co-pilot inside the composer, not a separate disconnected toy. (4) Admin observability for token refresh, scheduler, and user lifecycle.

## Chapter 3: Mission

Mission: Give every Smindruk customer a single pane of glass to plan, create, approve (via roles), publish, and learn from social content — with enterprise-grade authentication, encryption of social tokens, cron-based automation, and an admin control plane.

## Chapter 4: Goals

| Goal | Metric | Notes |
| --- | --- | --- |
| Reliable scheduling | % posts published within 2 minutes of due time | Minute cron + retries |
| Token health | % accounts not cron_expired | 45-day refresh policy |
| AI assist adoption | % create-post sessions using AI tools | Groq-backed |
| Multi-tenant safety | Zero cross-workspace data leaks | workspace scoped queries |
| Admin ops speed | Time to refresh token / disable user | Admin dashboard |

## Chapter 5: Target Audience

Primary segments: solo creators, SMB marketing managers, social agencies managing many Facebook Pages, in-house brand teams, and platform operators (Smindruk admins). Secondary: developers integrating via API/webhooks as the public API surface matures.

## Chapter 6: Personas

### Ayesha — Brand Manager

Needs calendar, approvals via roles, analytics snapshots

Persona expectations from Smindruk: clear empty states, explicit Facebook connect mode choice, visible Refresh Required badges, and support-friendly error messages. This persona must never see another workspace's data.

### Omar — Agency Operator

Needs dataset page numbers, bulk post ranges, secret key fetch

Persona expectations from Smindruk: clear empty states, explicit Facebook connect mode choice, visible Refresh Required badges, and support-friendly error messages. This persona must never see another workspace's data.

### Sara — Content Editor

Needs composer, AI captions, media library

Persona expectations from Smindruk: clear empty states, explicit Facebook connect mode choice, visible Refresh Required badges, and support-friendly error messages. This persona must never see another workspace's data.

### Bilal — Platform Admin

Needs user delete cascades, token refresh, scheduler status

Persona expectations from Smindruk: clear empty states, explicit Facebook connect mode choice, visible Refresh Required badges, and support-friendly error messages. This persona must never see another workspace's data.

### Noor — Viewer Client

Needs read-only calendar and published links

Persona expectations from Smindruk: clear empty states, explicit Facebook connect mode choice, visible Refresh Required badges, and support-friendly error messages. This persona must never see another workspace's data.

## Chapter 7: Subscription Plans

**Document ID:** SMINDRUK-PRD-CH-07

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/pricing and /dashboard/settings`

**Product:** Smindruk — Social Media Management, Simplified

### 7.1 Purpose

Define commercial packaging and technical enforcement limits for workspaces.

### 7.2 Business Goal

Monetize Smindruk while clearly communicating capacity (accounts, posts/month, team seats, storage).

### 7.3 User Story

As a workspace owner, I want to understand and upgrade my plan so my team can connect more accounts and publish more content.

As a Smindruk workspace member with an appropriate role, I want to use **Subscription Plans** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 7.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Subscription Plans from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 7.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 7.6 UI Description & Layout

The Subscription Plans experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Subscription Plans Layout ───────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 7.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 7.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Upgrade | Start upgrade flow | Owner/admin | subscriptions/upgrade or payments/checkout |
| Manage billing | Open billing section | Owner | Settings |

### 7.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Plan | radio/cards | Yes | current plan | One of free|starter|professional|agency|enterprise |
| Billing cycle | toggle | Yes | monthly | monthly|yearly |

### 7.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 7.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 7.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 7.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 7.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 7.15 Business Rules

1. PLAN_LIMITS (backend authoritative): free 3 accounts / 30 posts/mo / 1 seat / 1GB; starter 8 / unlimited / 1 / 25GB; professional 20 / unlimited / 5 / 250GB; agency 50 / unlimited / 15 / 1000GB; enterprise unlimited.

2. Marketing prices on frontend: Free $0, Starter $15, Professional $39, Agency $89, Enterprise custom.

3. Billing cycles: monthly | yearly.

4. Subscription statuses: active | past_due | cancelled | expired.

5. PayPal path is stubbed; Stripe checkout/webhook is the live payment path.

### 7.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 7.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| Workspace | plan enum | plan, isActive |
| Subscription | billing state | plan, billingCycle, status, limits, usage |
| Payment | payment records | gateway, amount, status |

### 7.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | https://smindruk.up.railway.app/api/v1/subscriptions | JWT | Current subscription |
| POST | https://smindruk.up.railway.app/api/v1/subscriptions/upgrade | JWT | Upgrade plan |
| POST | https://smindruk.up.railway.app/api/v1/subscriptions/downgrade | JWT | Downgrade plan |
| GET | https://smindruk.up.railway.app/api/v1/subscriptions/usage | JWT | Usage vs limits |
| POST | https://smindruk.up.railway.app/api/v1/payments/checkout | JWT | Stripe checkout |

### 7.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 7.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 7.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 7.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 7.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 7.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 7.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 7.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 7.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 7.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 7.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 7.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 7.31 Frequently Asked Questions

**Q: Which limits are enforced in code?**

**A:** Backend PLAN_LIMITS on Subscription/workspace usage checks; UI also displays marketing feature lists that may include roadmap items.

**Q: Is PayPal live?**

**A:** Not fully wired; treat as roadmap. Use Stripe for production payments.

### 7.32 RAG Self-Contained Summary

Smindruk feature **Subscription Plans** exists to Define commercial packaging and technical enforcement limits for workspaces. Business goal: Monetize Smindruk while clearly communicating capacity (accounts, posts/month, team seats, storage). Primary route: /pricing and /dashboard/settings. Auth: JWT Bearer. Roles: owner, admin. Collections: Workspace, Subscription, Payment. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 7.33 Operational Runbook for Support Agents

When a customer asks about **Subscription Plans**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Subscription Plans, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 7.34 QA Test Checklist

- [ ] Happy path for Subscription Plans as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 7.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 8: System Architecture

Smindruk follows a modular Express architecture: routes → middleware (auth, validate, rate limit) → controllers → models/utils. The Next.js apps are SPA-style App Router clients using a typed API helper that automatically selects local vs live API base URLs based on hostname.

### 8.1 Technology Stack

| Layer | Technology |
| --- | --- |
| User UI | Next.js 15, React, Tailwind, shadcn/ui, Zod, react-hook-form |
| Admin UI | Next.js 15 on port 3001 |
| API | Node.js, Express ESM |
| DB | MongoDB Atlas + Mongoose |
| Auth | JWT access + refresh tokens, Passport OAuth (Google/GitHub/Facebook) |
| Jobs | node-cron |
| Media | Multer + Cloudinary |
| AI | Groq OpenAI-compatible API |
| Payments | Stripe (PayPal stub) |

### 8.2 Environment Variables (Selected)

| Variable | Purpose |
| --- | --- |
| MONGO_URL / MONGO_DB_NAME | Database connection (smindruk) |
| JWT_SECRET | Auth signing + encryption fallback |
| ENCRYPTION_KEY | AES-256-CBC key material for social tokens |
| FB_APP_ID / FB_APP_SECRET | Facebook OAuth + Graph |
| GROQ_API_KEY / GROQ_MODEL | AI generation |
| CLOUDINARY_* | Media storage |
| FB_TOKEN_REFRESH_AFTER_DAYS | Default 45 |
| FB_TOKEN_REFRESH_CRON_MAX_DAYS | Default 60 |
| FB_TOKEN_REFRESH_CRON | Default 0 12 * * * |
| CRON_TIMEZONE | Default Asia/Karachi |

## Chapter 9: Authentication

**Document ID:** SMINDRUK-PRD-CH-09

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/login, /register, /verify-email, /forgot-password, /reset-password`

**Product:** Smindruk — Social Media Management, Simplified

### 9.1 Purpose

Register, login, verify email, reset password, OAuth, and maintain secure sessions via JWT access + refresh tokens.

### 9.2 Business Goal

Protect customer data and enable passwordless-friendly OAuth while supporting long-lived Remember sessions until logout.

### 9.3 User Story

As a new user, I want to create an account and stay logged in until I logout so I can manage social content daily without friction.

As a Smindruk workspace member with an appropriate role, I want to use **Authentication** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 9.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Authentication from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 9.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 9.6 UI Description & Layout

The Authentication experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Authentication Layout ───────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 9.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 9.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Sign in | Login | Valid form | POST /auth/login |
| Create account | Register | Valid form | POST /auth/register |
| Continue with Google | OAuth | Configured env | OAuth redirect |
| Forgot password | Start reset | Always | Navigate |

### 9.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Email | email | Yes |  | Unique |
| Password | password | Yes |  | Hashed with bcrypt |
| First name / Last name | text | Yes |  | Register |
| Remember me | checkbox | No | true preferred | Persists tokens in localStorage |

### 9.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 9.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 9.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 9.13 Validation Rules

- Email required and unique
- Password minimum length enforced by validators
- Reset tokens hashed at rest

### 9.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **any authenticated user**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 9.15 Business Rules

1. Logged-in users visiting marketing landing may be redirected to dashboard.

2. Access token short-lived; refresh token rotated.

3. OAuth returns 501 if provider env vars missing.

4. User.role values: user | admin | superadmin.

### 9.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 9.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| User | Identity | email, password hash, role, OAuth ids, activeWorkspace |
| RefreshToken | Session rotation | token, expiresAt, revoked |

### 9.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /auth/register | Public | Create user |
| POST | /auth/login | Public | Issue tokens |
| POST | /auth/logout | JWT | Revoke refresh |
| POST | /auth/refresh-token | Public+refresh | Rotate tokens |
| POST | /auth/forgot-password | Public | Send reset |
| POST | /auth/reset-password | Public | Set new password |
| POST | /auth/verify-email | Public | Verify |
| GET | /auth/google (and github/facebook) | OAuth | Social login |

### 9.19 Request Example

```http
POST https://smindruk.up.railway.app/api/v1/auth/login
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "********"
}
```

### 9.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { "_id": "...", "email": "owner@example.com" },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

### 9.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 9.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 9.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 9.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 9.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 9.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 9.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 9.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 9.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 9.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 9.31 Frequently Asked Questions

**Q: Who can use Authentication?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 9.32 RAG Self-Contained Summary

Smindruk feature **Authentication** exists to Register, login, verify email, reset password, OAuth, and maintain secure sessions via JWT access + refresh tokens. Business goal: Protect customer data and enable passwordless-friendly OAuth while supporting long-lived Remember sessions until logout. Primary route: /login, /register, /verify-email, /forgot-password, /reset-password. Auth: JWT Bearer. Roles: any authenticated user. Collections: User, RefreshToken. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 9.33 Operational Runbook for Support Agents

When a customer asks about **Authentication**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Authentication, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 9.34 QA Test Checklist

- [ ] Happy path for Authentication as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 9.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 10: Dashboard

**Document ID:** SMINDRUK-PRD-CH-10

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard`

**Product:** Smindruk — Social Media Management, Simplified

### 10.1 Purpose

Provide an at-a-glance home for workspace activity: stats, shortcuts, and recent work.

### 10.2 Business Goal

Reduce time-to-action after login.

### 10.3 User Story

As a marketer, I want a dashboard overview so I know what needs attention (scheduled, failed, token refresh).

As a Smindruk workspace member with an appropriate role, I want to use **Dashboard** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 10.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Dashboard from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 10.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 10.6 UI Description & Layout

The Dashboard experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Dashboard Layout ────────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 10.7 UI Components

- Stat cards
- Quick links to Create Post / Connect / Calendar
- Notification bell

### 10.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 10.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 10.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 10.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 10.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 10.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 10.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 10.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 10.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 10.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| Post | Counts | status |
| Notification | Alerts | isRead |

### 10.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /posts/stats?workspaceId= | JWT | Post counters |
| GET | /notifications | JWT | Unread alerts |

### 10.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 10.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 10.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 10.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 10.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 10.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 10.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 10.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 10.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 10.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 10.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 10.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 10.31 Frequently Asked Questions

**Q: Who can use Dashboard?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 10.32 RAG Self-Contained Summary

Smindruk feature **Dashboard** exists to Provide an at-a-glance home for workspace activity: stats, shortcuts, and recent work. Business goal: Reduce time-to-action after login. Primary route: /dashboard. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: Post, Notification. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 10.33 Operational Runbook for Support Agents

When a customer asks about **Dashboard**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Dashboard, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 10.34 QA Test Checklist

- [ ] Happy path for Dashboard as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 10.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 11: Workspace Management

**Document ID:** SMINDRUK-PRD-CH-11

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard (workspace switcher) + API`

**Product:** Smindruk — Social Media Management, Simplified

### 11.1 Purpose

Create and switch multi-tenant workspaces owned by a user.

### 11.2 Business Goal

Agencies and multi-brand users isolate data per workspace.

### 11.3 User Story

As an agency owner, I want multiple workspaces so Client A never sees Client B posts.

As a Smindruk workspace member with an appropriate role, I want to use **Workspace Management** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 11.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Workspace Management from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 11.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 11.6 UI Description & Layout

The Workspace Management experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Workspace Management Layout ─────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 11.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 11.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 11.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 11.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 11.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 11.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 11.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 11.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 11.15 Business Rules

1. All social accounts, posts, media are scoped by workspace ObjectId

2. Deleting a user as admin cascades workspace-related data

3. Slug generated uniquely from name

### 11.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 11.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| Workspace | Tenant | name, slug, owner, plan, isActive |
| TeamMember | Membership | role, status |

### 11.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /workspaces | JWT | Create |
| GET | /workspaces | JWT | List mine |
| PATCH | /workspaces/:id | JWT | Update |
| POST | /workspaces/:id/switch | JWT | Set activeWorkspace |
| POST | /workspaces/:id/invite | JWT | Invite member |

### 11.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 11.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 11.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 11.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 11.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 11.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 11.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 11.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 11.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 11.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 11.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 11.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 11.31 Frequently Asked Questions

**Q: Who can use Workspace Management?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 11.32 RAG Self-Contained Summary

Smindruk feature **Workspace Management** exists to Create and switch multi-tenant workspaces owned by a user. Business goal: Agencies and multi-brand users isolate data per workspace. Primary route: /dashboard (workspace switcher) + API. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: Workspace, TeamMember. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 11.33 Operational Runbook for Support Agents

When a customer asks about **Workspace Management**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Workspace Management, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 11.34 QA Test Checklist

- [ ] Happy path for Workspace Management as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 11.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 12: Team Management

**Document ID:** SMINDRUK-PRD-CH-12

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `Team settings surfaces / API /teams`

**Product:** Smindruk — Social Media Management, Simplified

### 12.1 Purpose

Invite and manage members with roles inside a workspace.

### 12.2 Business Goal

Collaborate safely with least privilege.

### 12.3 User Story

As an owner, I want to invite an editor who can create posts but not delete the workspace.

As a Smindruk workspace member with an appropriate role, I want to use **Team Management** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 12.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Team Management from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 12.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 12.6 UI Description & Layout

The Team Management experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Team Management Layout ──────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 12.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 12.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 12.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 12.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 12.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 12.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Role | owner/admin/editor/viewer | editor | Permission set |

### 12.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 12.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 12.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 12.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 12.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| TeamMember | Roles | owner|admin|editor|viewer |

### 12.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /teams | JWT | List members |
| PATCH | /teams/:id | JWT | Update role |
| DELETE | /teams/:id | JWT | Remove |

### 12.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 12.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 12.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 12.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 12.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 12.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 12.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 12.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 12.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 12.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 12.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 12.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 12.31 Frequently Asked Questions

**Q: Who can use Team Management?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 12.32 RAG Self-Contained Summary

Smindruk feature **Team Management** exists to Invite and manage members with roles inside a workspace. Business goal: Collaborate safely with least privilege. Primary route: Team settings surfaces / API /teams. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: TeamMember. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 12.33 Operational Runbook for Support Agents

When a customer asks about **Team Management**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Team Management, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 12.34 QA Test Checklist

- [ ] Happy path for Team Management as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 12.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 13: Role Based Access Control (RBAC)

**Document ID:** SMINDRUK-PRD-CH-13

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `N/A`

**Product:** Smindruk — Social Media Management, Simplified

### 13.1 Purpose

Enforce authorization consistently across UI and API.

### 13.2 Business Goal

Prevent privilege escalation and accidental destructive actions.

### 13.3 User Story

As a viewer, I should see calendars but cannot publish.

As a Smindruk workspace member with an appropriate role, I want to use **Role Based Access Control (RBAC)** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 13.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Role Based Access Control (RBAC) from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 13.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 13.6 UI Description & Layout

The Role Based Access Control (RBAC) experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Role Based Access Control (RBAC) Layout ─────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 13.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 13.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 13.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 13.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 13.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 13.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 13.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 13.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 13.15 Business Rules

1. Workspace roles: owner, admin, editor, viewer

2. Platform roles on User: user, admin, superadmin

3. Admin Dashboard requires isAdmin middleware

4. Viewer: read-only; Editor: content mutations; Admin/Owner: members & billing-sensitive actions

### 13.16 Backend Logic

1. authenticate middleware attaches req.user
2. Controllers check membership and role
3. Admin routes chain authenticate + isAdmin

### 13.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 13.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | https://smindruk.up.railway.app/api/v1/... | Bearer JWT | Fetch resource |

### 13.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 13.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 13.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 13.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 13.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 13.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 13.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 13.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 13.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 13.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 13.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 13.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 13.31 Frequently Asked Questions

**Q: Who can use Role Based Access Control (RBAC)?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 13.32 RAG Self-Contained Summary

Smindruk feature **Role Based Access Control (RBAC)** exists to Enforce authorization consistently across UI and API. Business goal: Prevent privilege escalation and accidental destructive actions. Primary route: N/A. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 13.33 Operational Runbook for Support Agents

When a customer asks about **Role Based Access Control (RBAC)**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Role Based Access Control (RBAC), please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 13.34 QA Test Checklist

- [ ] Happy path for Role Based Access Control (RBAC) as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 13.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 14: Social Account Connections (Overview)

**Document ID:** SMINDRUK-PRD-CH-14

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/connect-channels and /dashboard/connected-channels`

**Product:** Smindruk — Social Media Management, Simplified

### 14.1 Purpose

Connect social profiles/pages to a workspace for publishing and analytics.

### 14.2 Business Goal

Increase connected accounts under plan limits.

### 14.3 User Story

As an editor, I want to connect Facebook so I can publish from Smindruk.

As a Smindruk workspace member with an appropriate role, I want to use **Social Account Connections (Overview)** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 14.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Social Account Connections (Overview) from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 14.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 14.6 UI Description & Layout

The Social Account Connections (Overview) experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Social Account Connections (Overview) Layout ────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 14.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 14.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Connect | Open mode dialog (Facebook) | Live platforms | Dialog |
| Include in trending dataset | OAuth trending | User confirms | connectMode=trending |
| I just want to manage my account | OAuth manage | User confirms | connectMode=manage |
| View pages | Navigate connected list | Has connections | Link |

### 14.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 14.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 14.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 14.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 14.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 14.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 14.15 Business Rules

1. Facebook is Live; other platforms show Coming soon toast

2. Trending mode dual-writes ConnectedPage + SocialAccount(connectSource=dataset)

3. Manage mode writes SocialAccount(connectSource=manage) only

4. Admin manage list excludes connectSource=dataset

### 14.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 14.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| SocialAccount | Manage (+ dataset dual-write) | platform, accountId, tokens, connectSource, status |
| ConnectedPage | Dataset pages | pageId, pageNumber, tokens, status |

### 14.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /social-accounts?workspaceId= | JWT | List pages for composer (includes dataset-owned) |
| DELETE | /social-accounts/:id | JWT | Disconnect |
| GET | /social-accounts/facebook/connect | Redirect | Start OAuth with connectMode |
| GET | /connected-pages?workspaceId= | JWT | Dataset pages |

### 14.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 14.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 14.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 14.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 14.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 14.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 14.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 14.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 14.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 14.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 14.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 14.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 14.31 Frequently Asked Questions

**Q: Who can use Social Account Connections (Overview)?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 14.32 RAG Self-Contained Summary

Smindruk feature **Social Account Connections (Overview)** exists to Connect social profiles/pages to a workspace for publishing and analytics. Business goal: Increase connected accounts under plan limits. Primary route: /dashboard/connect-channels and /dashboard/connected-channels. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: SocialAccount, ConnectedPage. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 14.33 Operational Runbook for Support Agents

When a customer asks about **Social Account Connections (Overview)**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Social Account Connections (Overview), please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 14.34 QA Test Checklist

- [ ] Happy path for Social Account Connections (Overview) as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 14.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 15: Facebook Integration

**Document ID:** SMINDRUK-PRD-CH-15

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/connect-channels`

**Product:** Smindruk — Social Media Management, Simplified

### 15.1 Purpose

Enable full Facebook Page OAuth, token storage, publishing, scheduling, dataset bulk, and insights.

### 15.2 Business Goal

Deliver production publishing value on Facebook Pages.

### 15.3 User Story

As a page admin, I want to connect my Facebook Pages and publish/schedule from Smindruk.

As a Smindruk workspace member with an appropriate role, I want to use **Facebook Integration** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 15.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Facebook Integration from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 15.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 15.6 UI Description & Layout

The Facebook Integration experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Facebook Integration Layout ─────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 15.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 15.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 15.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 15.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 15.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 15.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 15.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 15.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 15.15 Business Rules

1. OAuth scopes: pages_show_list, pages_manage_posts, pages_read_engagement, public_profile

2. Exchange code → short user token → long-lived user token → /me/accounts page tokens

3. Page token TTL modeled ~60 days; refresh policy starts at day 45

4. Publish via Graph feed/photos/videos endpoints

5. Decrypt page tokens with ENCRYPTION_KEY then JWT_SECRET fallback

### 15.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 15.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 15.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /social-accounts/facebook/connect?workspaceId&userId&connectMode | Browser redirect | Start OAuth |
| GET | /social-accounts/facebook/callback | Facebook redirect | Persist pages |
| POST | /social-accounts/:id/refresh-token | JWT | Manual refresh |

### 15.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 15.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 15.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 15.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 15.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 15.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 15.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 15.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 15.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 15.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 15.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 15.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 15.31 Frequently Asked Questions

**Q: Is Facebook available?**

**A:** Live. Pages connect, publish, schedule, dataset bulk, insights sync

### 15.32 RAG Self-Contained Summary

Smindruk feature **Facebook Integration** exists to Enable full Facebook Page OAuth, token storage, publishing, scheduling, dataset bulk, and insights. Business goal: Deliver production publishing value on Facebook Pages. Primary route: /dashboard/connect-channels. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 15.33 Operational Runbook for Support Agents

When a customer asks about **Facebook Integration**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Facebook Integration, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 15.34 QA Test Checklist

- [ ] Happy path for Facebook Integration as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 15.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 16: Instagram Integration

**Document ID:** SMINDRUK-PRD-CH-16

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/connect-channels`

**Product:** Smindruk — Social Media Management, Simplified

### 16.1 Purpose

Prepare Instagram connectivity in schema and UI; OAuth/publish not live yet.

### 16.2 Business Goal

Expand multi-network coverage for Instagram in a future release.

### 16.3 User Story

As a user, I want to see Instagram listed so I know it is on the roadmap.

As a Smindruk workspace member with an appropriate role, I want to use **Instagram Integration** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 16.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Instagram Integration from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 16.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 16.6 UI Description & Layout

The Instagram Integration experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Instagram Integration Layout ────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 16.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 16.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 16.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 16.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 16.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 16.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 16.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 16.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 16.15 Business Rules

1. Instagram button shows Coming soon

2. Selecting it shows informational toast; no OAuth redirect

3. SocialAccount.platform enum already includes this id where applicable

### 16.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 16.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 16.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| — | Not live | — | — |

### 16.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 16.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 16.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 16.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 16.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 16.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 16.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 16.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 16.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 16.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 16.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 16.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 16.31 Frequently Asked Questions

**Q: Is Instagram available?**

**A:** Coming Soon. Schema + UI present; OAuth not live

### 16.32 RAG Self-Contained Summary

Smindruk feature **Instagram Integration** exists to Prepare Instagram connectivity in schema and UI; OAuth/publish not live yet. Business goal: Expand multi-network coverage for Instagram in a future release. Primary route: /dashboard/connect-channels. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 16.33 Operational Runbook for Support Agents

When a customer asks about **Instagram Integration**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Instagram Integration, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 16.34 QA Test Checklist

- [ ] Happy path for Instagram Integration as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 16.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 17: LinkedIn Integration

**Document ID:** SMINDRUK-PRD-CH-17

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/connect-channels`

**Product:** Smindruk — Social Media Management, Simplified

### 17.1 Purpose

Prepare LinkedIn connectivity in schema and UI; OAuth/publish not live yet.

### 17.2 Business Goal

Expand multi-network coverage for LinkedIn in a future release.

### 17.3 User Story

As a user, I want to see LinkedIn listed so I know it is on the roadmap.

As a Smindruk workspace member with an appropriate role, I want to use **LinkedIn Integration** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 17.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open LinkedIn Integration from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 17.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 17.6 UI Description & Layout

The LinkedIn Integration experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ LinkedIn Integration Layout ─────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 17.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 17.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 17.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 17.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 17.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 17.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 17.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 17.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 17.15 Business Rules

1. LinkedIn button shows Coming soon

2. Selecting it shows informational toast; no OAuth redirect

3. SocialAccount.platform enum already includes this id where applicable

### 17.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 17.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 17.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| — | Not live | — | — |

### 17.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 17.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 17.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 17.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 17.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 17.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 17.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 17.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 17.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 17.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 17.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 17.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 17.31 Frequently Asked Questions

**Q: Is LinkedIn available?**

**A:** Coming Soon. Schema + UI present

### 17.32 RAG Self-Contained Summary

Smindruk feature **LinkedIn Integration** exists to Prepare LinkedIn connectivity in schema and UI; OAuth/publish not live yet. Business goal: Expand multi-network coverage for LinkedIn in a future release. Primary route: /dashboard/connect-channels. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 17.33 Operational Runbook for Support Agents

When a customer asks about **LinkedIn Integration**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For LinkedIn Integration, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 17.34 QA Test Checklist

- [ ] Happy path for LinkedIn Integration as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 17.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 18: X (Twitter) Integration

**Document ID:** SMINDRUK-PRD-CH-18

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/connect-channels`

**Product:** Smindruk — Social Media Management, Simplified

### 18.1 Purpose

Prepare X (Twitter) connectivity in schema and UI; OAuth/publish not live yet.

### 18.2 Business Goal

Expand multi-network coverage for X (Twitter) in a future release.

### 18.3 User Story

As a user, I want to see X (Twitter) listed so I know it is on the roadmap.

As a Smindruk workspace member with an appropriate role, I want to use **X (Twitter) Integration** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 18.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open X (Twitter) Integration from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 18.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 18.6 UI Description & Layout

The X (Twitter) Integration experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ X (Twitter) Integration Layout ──────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 18.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 18.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 18.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 18.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 18.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 18.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 18.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 18.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 18.15 Business Rules

1. X (Twitter) button shows Coming soon

2. Selecting it shows informational toast; no OAuth redirect

3. SocialAccount.platform enum already includes this id where applicable

### 18.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 18.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 18.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| — | Not live | — | — |

### 18.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 18.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 18.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 18.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 18.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 18.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 18.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 18.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 18.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 18.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 18.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 18.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 18.31 Frequently Asked Questions

**Q: Is X (Twitter) available?**

**A:** Coming Soon. Schema + UI present

### 18.32 RAG Self-Contained Summary

Smindruk feature **X (Twitter) Integration** exists to Prepare X (Twitter) connectivity in schema and UI; OAuth/publish not live yet. Business goal: Expand multi-network coverage for X (Twitter) in a future release. Primary route: /dashboard/connect-channels. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 18.33 Operational Runbook for Support Agents

When a customer asks about **X (Twitter) Integration**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For X (Twitter) Integration, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 18.34 QA Test Checklist

- [ ] Happy path for X (Twitter) Integration as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 18.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 19: Threads Integration

**Document ID:** SMINDRUK-PRD-CH-19

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/connect-channels`

**Product:** Smindruk — Social Media Management, Simplified

### 19.1 Purpose

Prepare Threads connectivity in schema and UI; OAuth/publish not live yet.

### 19.2 Business Goal

Expand multi-network coverage for Threads in a future release.

### 19.3 User Story

As a user, I want to see Threads listed so I know it is on the roadmap.

As a Smindruk workspace member with an appropriate role, I want to use **Threads Integration** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 19.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Threads Integration from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 19.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 19.6 UI Description & Layout

The Threads Integration experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Threads Integration Layout ──────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 19.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 19.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 19.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 19.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 19.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 19.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 19.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 19.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 19.15 Business Rules

1. Threads button shows Coming soon

2. Selecting it shows informational toast; no OAuth redirect

3. SocialAccount.platform enum already includes this id where applicable

### 19.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 19.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 19.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| — | Not live | — | — |

### 19.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 19.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 19.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 19.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 19.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 19.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 19.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 19.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 19.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 19.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 19.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 19.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 19.31 Frequently Asked Questions

**Q: Is Threads available?**

**A:** Coming Soon. Connect UI badge Coming soon

### 19.32 RAG Self-Contained Summary

Smindruk feature **Threads Integration** exists to Prepare Threads connectivity in schema and UI; OAuth/publish not live yet. Business goal: Expand multi-network coverage for Threads in a future release. Primary route: /dashboard/connect-channels. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 19.33 Operational Runbook for Support Agents

When a customer asks about **Threads Integration**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Threads Integration, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 19.34 QA Test Checklist

- [ ] Happy path for Threads Integration as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 19.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 20: TikTok Integration

**Document ID:** SMINDRUK-PRD-CH-20

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/connect-channels`

**Product:** Smindruk — Social Media Management, Simplified

### 20.1 Purpose

Prepare TikTok connectivity in schema and UI; OAuth/publish not live yet.

### 20.2 Business Goal

Expand multi-network coverage for TikTok in a future release.

### 20.3 User Story

As a user, I want to see TikTok listed so I know it is on the roadmap.

As a Smindruk workspace member with an appropriate role, I want to use **TikTok Integration** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 20.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open TikTok Integration from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 20.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 20.6 UI Description & Layout

The TikTok Integration experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ TikTok Integration Layout ───────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 20.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 20.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 20.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 20.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 20.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 20.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 20.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 20.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 20.15 Business Rules

1. TikTok button shows Coming soon

2. Selecting it shows informational toast; no OAuth redirect

3. SocialAccount.platform enum already includes this id where applicable

### 20.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 20.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 20.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| — | Not live | — | — |

### 20.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 20.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 20.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 20.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 20.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 20.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 20.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 20.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 20.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 20.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 20.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 20.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 20.31 Frequently Asked Questions

**Q: Is TikTok available?**

**A:** Coming Soon. Schema + UI present

### 20.32 RAG Self-Contained Summary

Smindruk feature **TikTok Integration** exists to Prepare TikTok connectivity in schema and UI; OAuth/publish not live yet. Business goal: Expand multi-network coverage for TikTok in a future release. Primary route: /dashboard/connect-channels. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 20.33 Operational Runbook for Support Agents

When a customer asks about **TikTok Integration**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For TikTok Integration, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 20.34 QA Test Checklist

- [ ] Happy path for TikTok Integration as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 20.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 21: Pinterest Integration

**Document ID:** SMINDRUK-PRD-CH-21

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/connect-channels`

**Product:** Smindruk — Social Media Management, Simplified

### 21.1 Purpose

Prepare Pinterest connectivity in schema and UI; OAuth/publish not live yet.

### 21.2 Business Goal

Expand multi-network coverage for Pinterest in a future release.

### 21.3 User Story

As a user, I want to see Pinterest listed so I know it is on the roadmap.

As a Smindruk workspace member with an appropriate role, I want to use **Pinterest Integration** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 21.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Pinterest Integration from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 21.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 21.6 UI Description & Layout

The Pinterest Integration experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Pinterest Integration Layout ────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 21.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 21.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 21.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 21.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 21.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 21.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 21.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 21.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 21.15 Business Rules

1. Pinterest button shows Coming soon

2. Selecting it shows informational toast; no OAuth redirect

3. SocialAccount.platform enum already includes this id where applicable

### 21.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 21.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 21.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| — | Not live | — | — |

### 21.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 21.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 21.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 21.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 21.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 21.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 21.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 21.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 21.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 21.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 21.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 21.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 21.31 Frequently Asked Questions

**Q: Is Pinterest available?**

**A:** Coming Soon. Schema + UI present

### 21.32 RAG Self-Contained Summary

Smindruk feature **Pinterest Integration** exists to Prepare Pinterest connectivity in schema and UI; OAuth/publish not live yet. Business goal: Expand multi-network coverage for Pinterest in a future release. Primary route: /dashboard/connect-channels. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 21.33 Operational Runbook for Support Agents

When a customer asks about **Pinterest Integration**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Pinterest Integration, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 21.34 QA Test Checklist

- [ ] Happy path for Pinterest Integration as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 21.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 22: YouTube Integration

**Document ID:** SMINDRUK-PRD-CH-22

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/connect-channels`

**Product:** Smindruk — Social Media Management, Simplified

### 22.1 Purpose

Prepare YouTube connectivity in schema and UI; OAuth/publish not live yet.

### 22.2 Business Goal

Expand multi-network coverage for YouTube in a future release.

### 22.3 User Story

As a user, I want to see YouTube listed so I know it is on the roadmap.

As a Smindruk workspace member with an appropriate role, I want to use **YouTube Integration** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 22.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open YouTube Integration from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 22.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 22.6 UI Description & Layout

The YouTube Integration experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ YouTube Integration Layout ──────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 22.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 22.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 22.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 22.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 22.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 22.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 22.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 22.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 22.15 Business Rules

1. YouTube button shows Coming soon

2. Selecting it shows informational toast; no OAuth redirect

3. SocialAccount.platform enum already includes this id where applicable

### 22.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 22.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 22.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| — | Not live | — | — |

### 22.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 22.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 22.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 22.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 22.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 22.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 22.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 22.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 22.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 22.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 22.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 22.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 22.31 Frequently Asked Questions

**Q: Is YouTube available?**

**A:** Coming Soon. SocialAccount enum includes youtube

### 22.32 RAG Self-Contained Summary

Smindruk feature **YouTube Integration** exists to Prepare YouTube connectivity in schema and UI; OAuth/publish not live yet. Business goal: Expand multi-network coverage for YouTube in a future release. Primary route: /dashboard/connect-channels. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 22.33 Operational Runbook for Support Agents

When a customer asks about **YouTube Integration**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For YouTube Integration, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 22.34 QA Test Checklist

- [ ] Happy path for YouTube Integration as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 22.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 23: Google Business Profile Integration

**Document ID:** SMINDRUK-PRD-CH-23

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/connect-channels`

**Product:** Smindruk — Social Media Management, Simplified

### 23.1 Purpose

Prepare Google Business Profile connectivity in schema and UI; OAuth/publish not live yet.

### 23.2 Business Goal

Expand multi-network coverage for Google Business Profile in a future release.

### 23.3 User Story

As a user, I want to see Google Business Profile listed so I know it is on the roadmap.

As a Smindruk workspace member with an appropriate role, I want to use **Google Business Profile Integration** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 23.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Google Business Profile Integration from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 23.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 23.6 UI Description & Layout

The Google Business Profile Integration experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Google Business Profile Integration Layout ──────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 23.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 23.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 23.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 23.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 23.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 23.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 23.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 23.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 23.15 Business Rules

1. Google Business Profile button shows Coming soon

2. Selecting it shows informational toast; no OAuth redirect

3. SocialAccount.platform enum already includes this id where applicable

### 23.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 23.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 23.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| — | Not live | — | — |

### 23.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 23.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 23.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 23.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 23.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 23.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 23.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 23.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 23.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 23.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 23.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 23.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 23.31 Frequently Asked Questions

**Q: Is Google Business Profile available?**

**A:** Coming Soon. SocialAccount enum includes google_business

### 23.32 RAG Self-Contained Summary

Smindruk feature **Google Business Profile Integration** exists to Prepare Google Business Profile connectivity in schema and UI; OAuth/publish not live yet. Business goal: Expand multi-network coverage for Google Business Profile in a future release. Primary route: /dashboard/connect-channels. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 23.33 Operational Runbook for Support Agents

When a customer asks about **Google Business Profile Integration**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Google Business Profile Integration, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 23.34 QA Test Checklist

- [ ] Happy path for Google Business Profile Integration as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 23.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 24: Media Library

**Document ID:** SMINDRUK-PRD-CH-24

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `Create Post uploader + admin media`

**Product:** Smindruk — Social Media Management, Simplified

### 24.1 Purpose

Upload, store, and reuse images/videos for posts via Cloudinary.

### 24.2 Business Goal

Centralize creative assets per workspace.

### 24.3 User Story

As an editor, I want to upload an image once and reuse it in multiple posts.

As a Smindruk workspace member with an appropriate role, I want to use **Media Library** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 24.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Media Library from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 24.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 24.6 UI Description & Layout

The Media Library experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Media Library Layout ────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 24.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 24.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 24.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| File | file | Yes |  | Images JPG/PNG/WEBP/GIF; Videos MP4/MOV |

### 24.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 24.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 24.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 24.13 Validation Rules

- MIME allow-list
- Size limits per multer/Cloudinary config

### 24.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 24.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 24.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 24.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| Media | Assets | fileType, url, publicId, workspace |

### 24.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /media | JWT+multipart | Upload |
| GET | /media | JWT | List |
| DELETE | /media/:id | JWT | Delete |

### 24.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 24.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 24.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 24.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 24.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 24.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 24.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 24.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 24.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 24.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 24.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 24.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 24.31 Frequently Asked Questions

**Q: Who can use Media Library?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 24.32 RAG Self-Contained Summary

Smindruk feature **Media Library** exists to Upload, store, and reuse images/videos for posts via Cloudinary. Business goal: Centralize creative assets per workspace. Primary route: Create Post uploader + admin media. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: Media. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 24.33 Operational Runbook for Support Agents

When a customer asks about **Media Library**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Media Library, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 24.34 QA Test Checklist

- [ ] Happy path for Media Library as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 24.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 25: Post Composer

**Document ID:** SMINDRUK-PRD-CH-25

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/create-post`

**Product:** Smindruk — Social Media Management, Simplified

### 25.1 Purpose

Create draft, schedule, or prepare posts with channel/page selection and media.

### 25.2 Business Goal

Primary value creation surface for Smindruk.

### 25.3 User Story

As an editor, I want to write a caption, pick Facebook pages, attach media, and schedule.

As a Smindruk workspace member with an appropriate role, I want to use **Post Composer** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 25.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Post Composer from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 25.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 25.6 UI Description & Layout

The Post Composer experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Post Composer Layout ────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 25.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 25.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Publish / Post now | Create+publish flow | Valid + pages selected | create + publish |
| Schedule | Create status=scheduled | Date+time+pages | POST /posts |
| Save draft | status=draft | Minimal valid | POST /posts |
| AI Tools | Open AI menu | Always | AI endpoints |

### 25.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Content | textarea | Conditional |  | max 2200 chars |
| Date | date | If schedule |  | Local timezone composed to ISO |
| Time | time | If schedule |  | Combined with date via Date(y,m,d,h,min).toISOString() |
| Pages | checkboxes | If Facebook |  | socialAccountIds |

### 25.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 25.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 25.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 25.13 Validation Rules

- Scheduled posts require scheduledAt and at least one Facebook page when platforms includes facebook
- createPostSchema Zod on frontend

### 25.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 25.15 Business Rules

1. Post types: text|image|carousel|video|reel|story

2. Statuses: draft|scheduled|publishing|published|failed

3. Page list includes manage accounts and dataset-owned pages for the workspace

### 25.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 25.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| Post | Content | type, content, media, platforms, socialAccounts, status, scheduledAt |

### 25.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /posts | JWT | Create |
| POST | /posts/:id/publish | JWT | Publish now |
| GET | /social-accounts?workspaceId= | JWT | Page picker |

### 25.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 25.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 25.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 25.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 25.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 25.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Generating AI / uploading media spinners |
| Empty | No Facebook pages — CTA to Connect Channels |
| Success | Toast then navigate or clear form |
| Failure | Toast with API message |

### 25.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 25.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 25.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 25.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 25.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 25.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 25.31 Frequently Asked Questions

**Q: Who can use Post Composer?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 25.32 RAG Self-Contained Summary

Smindruk feature **Post Composer** exists to Create draft, schedule, or prepare posts with channel/page selection and media. Business goal: Primary value creation surface for Smindruk. Primary route: /dashboard/create-post. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: Post. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 25.33 Operational Runbook for Support Agents

When a customer asks about **Post Composer**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Post Composer, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 25.34 QA Test Checklist

- [ ] Happy path for Post Composer as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 25.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 26: AI Caption Generator

**Document ID:** SMINDRUK-PRD-CH-26

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/create-post (AI Tools dropdown)`

**Product:** Smindruk — Social Media Management, Simplified

### 26.1 Purpose

Write engaging platform captions using Groq LLM via Smindruk AI module.

### 26.2 Business Goal

Increase content velocity and quality inside the composer.

### 26.3 User Story

As an editor, I want AI Caption Generator so I can produce better copy faster.

As a Smindruk workspace member with an appropriate role, I want to use **AI Caption Generator** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 26.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open AI Caption Generator from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 26.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 26.6 UI Description & Layout

The AI Caption Generator experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ AI Caption Generator Layout ─────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 26.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 26.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 26.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 26.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 26.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 26.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 26.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 26.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 26.15 Business Rules

1. Requires GROQ_API_KEY (or GROK_API_KEY / OPENAI_API_KEY fallback) on API server

2. Default model llama-3.3-70b-versatile unless GROQ_MODEL set

3. No mock captions in production path — missing key returns configuration error

4. Prompt/text validated min length via Zod

### 26.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 26.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 26.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /ai/caption | JWT | Write engaging platform captions |

### 26.19 Request Example

```http
POST https://smindruk.up.railway.app/api/v1/ai/caption
Authorization: Bearer <token>

{
  "prompt": "Launch of our summer collection"
}
```

### 26.20 Response Example

```json
{
  "success": true,
  "data": { "caption": "..." }
}
```

### 26.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 26.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 500/400 | AI is not configured. Add GROQ_API_KEY... | Key missing on server |
| 400 | prompt is required | Empty prompt |

### 26.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 26.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 26.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 26.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 26.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 26.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 26.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 26.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| AI not configured | GROQ_API_KEY missing on Railway/local server | Set env and restart API |
| Empty response | Model returned blank | Retry; check Groq status |

### 26.31 Frequently Asked Questions

**Q: Who can use AI Caption Generator?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 26.32 RAG Self-Contained Summary

Smindruk feature **AI Caption Generator** exists to Write engaging platform captions using Groq LLM via Smindruk AI module. Business goal: Increase content velocity and quality inside the composer. Primary route: /dashboard/create-post (AI Tools dropdown). Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 26.33 Operational Runbook for Support Agents

When a customer asks about **AI Caption Generator**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For AI Caption Generator, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 26.34 QA Test Checklist

- [ ] Happy path for AI Caption Generator as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 26.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 27: AI Hashtag Generator

**Document ID:** SMINDRUK-PRD-CH-27

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/create-post (AI Tools dropdown)`

**Product:** Smindruk — Social Media Management, Simplified

### 27.1 Purpose

Generate spaced #hashtags using Groq LLM via Smindruk AI module.

### 27.2 Business Goal

Increase content velocity and quality inside the composer.

### 27.3 User Story

As an editor, I want AI Hashtag Generator so I can produce better copy faster.

As a Smindruk workspace member with an appropriate role, I want to use **AI Hashtag Generator** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 27.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open AI Hashtag Generator from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 27.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 27.6 UI Description & Layout

The AI Hashtag Generator experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ AI Hashtag Generator Layout ─────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 27.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 27.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 27.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 27.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 27.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 27.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 27.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 27.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 27.15 Business Rules

1. Requires GROQ_API_KEY (or GROK_API_KEY / OPENAI_API_KEY fallback) on API server

2. Default model llama-3.3-70b-versatile unless GROQ_MODEL set

3. No mock captions in production path — missing key returns configuration error

4. Prompt/text validated min length via Zod

### 27.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 27.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 27.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /ai/hashtags | JWT | Generate spaced #hashtags |

### 27.19 Request Example

```http
POST https://smindruk.up.railway.app/api/v1/ai/hashtags
Authorization: Bearer <token>

{
  "prompt": "Launch of our summer collection"
}
```

### 27.20 Response Example

```json
{
  "success": true,
  "data": { "hashtags": "..." }
}
```

### 27.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 27.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 500/400 | AI is not configured. Add GROQ_API_KEY... | Key missing on server |
| 400 | prompt is required | Empty prompt |

### 27.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 27.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 27.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 27.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 27.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 27.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 27.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 27.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| AI not configured | GROQ_API_KEY missing on Railway/local server | Set env and restart API |
| Empty response | Model returned blank | Retry; check Groq status |

### 27.31 Frequently Asked Questions

**Q: Who can use AI Hashtag Generator?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 27.32 RAG Self-Contained Summary

Smindruk feature **AI Hashtag Generator** exists to Generate spaced #hashtags using Groq LLM via Smindruk AI module. Business goal: Increase content velocity and quality inside the composer. Primary route: /dashboard/create-post (AI Tools dropdown). Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 27.33 Operational Runbook for Support Agents

When a customer asks about **AI Hashtag Generator**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For AI Hashtag Generator, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 27.34 QA Test Checklist

- [ ] Happy path for AI Hashtag Generator as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 27.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 28: AI Rewrite / Improve

**Document ID:** SMINDRUK-PRD-CH-28

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/create-post (AI Tools dropdown)`

**Product:** Smindruk — Social Media Management, Simplified

### 28.1 Purpose

Improve or rewrite post text using Groq LLM via Smindruk AI module.

### 28.2 Business Goal

Increase content velocity and quality inside the composer.

### 28.3 User Story

As an editor, I want AI Rewrite / Improve so I can produce better copy faster.

As a Smindruk workspace member with an appropriate role, I want to use **AI Rewrite / Improve** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 28.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open AI Rewrite / Improve from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 28.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 28.6 UI Description & Layout

The AI Rewrite / Improve experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ AI Rewrite / Improve Layout ─────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 28.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 28.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 28.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 28.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 28.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 28.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 28.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 28.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 28.15 Business Rules

1. Requires GROQ_API_KEY (or GROK_API_KEY / OPENAI_API_KEY fallback) on API server

2. Default model llama-3.3-70b-versatile unless GROQ_MODEL set

3. No mock captions in production path — missing key returns configuration error

4. Prompt/text validated min length via Zod

### 28.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 28.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 28.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /ai/improve and /ai/rewrite | JWT | Improve or rewrite post text |

### 28.19 Request Example

```http
POST https://smindruk.up.railway.app/api/v1/ai/improve and /ai/rewrite
Authorization: Bearer <token>

{
  "prompt": "Launch of our summer collection"
}
```

### 28.20 Response Example

```json
{
  "success": true,
  "data": { "improved/rewritten": "..." }
}
```

### 28.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 28.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 500/400 | AI is not configured. Add GROQ_API_KEY... | Key missing on server |
| 400 | prompt is required | Empty prompt |

### 28.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 28.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 28.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 28.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 28.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 28.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 28.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 28.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| AI not configured | GROQ_API_KEY missing on Railway/local server | Set env and restart API |
| Empty response | Model returned blank | Retry; check Groq status |

### 28.31 Frequently Asked Questions

**Q: Who can use AI Rewrite / Improve?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 28.32 RAG Self-Contained Summary

Smindruk feature **AI Rewrite / Improve** exists to Improve or rewrite post text using Groq LLM via Smindruk AI module. Business goal: Increase content velocity and quality inside the composer. Primary route: /dashboard/create-post (AI Tools dropdown). Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 28.33 Operational Runbook for Support Agents

When a customer asks about **AI Rewrite / Improve**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For AI Rewrite / Improve, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 28.34 QA Test Checklist

- [ ] Happy path for AI Rewrite / Improve as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 28.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 29: AI Translation

**Document ID:** SMINDRUK-PRD-CH-29

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/create-post (AI Tools dropdown)`

**Product:** Smindruk — Social Media Management, Simplified

### 29.1 Purpose

Translate caption to target language using Groq LLM via Smindruk AI module.

### 29.2 Business Goal

Increase content velocity and quality inside the composer.

### 29.3 User Story

As an editor, I want AI Translation so I can produce better copy faster.

As a Smindruk workspace member with an appropriate role, I want to use **AI Translation** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 29.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open AI Translation from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 29.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 29.6 UI Description & Layout

The AI Translation experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ AI Translation Layout ───────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 29.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 29.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 29.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 29.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 29.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 29.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 29.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 29.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 29.15 Business Rules

1. Requires GROQ_API_KEY (or GROK_API_KEY / OPENAI_API_KEY fallback) on API server

2. Default model llama-3.3-70b-versatile unless GROQ_MODEL set

3. No mock captions in production path — missing key returns configuration error

4. Prompt/text validated min length via Zod

### 29.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 29.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 29.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /ai/translate | JWT | Translate caption to target language |

### 29.19 Request Example

```http
POST https://smindruk.up.railway.app/api/v1/ai/translate
Authorization: Bearer <token>

{
  "prompt": "Launch of our summer collection"
}
```

### 29.20 Response Example

```json
{
  "success": true,
  "data": { "translated": "..." }
}
```

### 29.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 29.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 500/400 | AI is not configured. Add GROQ_API_KEY... | Key missing on server |
| 400 | prompt is required | Empty prompt |

### 29.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 29.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 29.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 29.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 29.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 29.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 29.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 29.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| AI not configured | GROQ_API_KEY missing on Railway/local server | Set env and restart API |
| Empty response | Model returned blank | Retry; check Groq status |

### 29.31 Frequently Asked Questions

**Q: Who can use AI Translation?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 29.32 RAG Self-Contained Summary

Smindruk feature **AI Translation** exists to Translate caption to target language using Groq LLM via Smindruk AI module. Business goal: Increase content velocity and quality inside the composer. Primary route: /dashboard/create-post (AI Tools dropdown). Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 29.33 Operational Runbook for Support Agents

When a customer asks about **AI Translation**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For AI Translation, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 29.34 QA Test Checklist

- [ ] Happy path for AI Translation as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 29.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 30: Additional AI Tools

**Document ID:** SMINDRUK-PRD-CH-30

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/create-post`

**Product:** Smindruk — Social Media Management, Simplified

### 30.1 Purpose

Provide image-prompt, content-calendar, reply, viral-ideas, seo-blog, content-ideas, cta tools.

### 30.2 Business Goal

Cover full content ideation workflow.

### 30.3 User Story

As a strategist, I want calendars and viral ideas without leaving Create Post.

As a Smindruk workspace member with an appropriate role, I want to use **Additional AI Tools** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 30.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Additional AI Tools from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 30.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 30.6 UI Description & Layout

The Additional AI Tools experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Additional AI Tools Layout ──────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 30.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 30.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 30.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 30.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 30.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 30.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 30.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 30.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 30.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 30.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 30.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 30.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /ai/image-prompt | JWT | Image prompt |
| POST | /ai/content-calendar | JWT | 7-day calendar |
| POST | /ai/reply | JWT | Comment reply |
| POST | /ai/viral-ideas | JWT | Ideas list |
| POST | /ai/seo-blog | JWT | SEO outline |
| POST | /ai/content-ideas | JWT | Ideas |
| POST | /ai/cta | JWT | CTA line |

### 30.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 30.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 30.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 30.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 30.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 30.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 30.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 30.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 30.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 30.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 30.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 30.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 30.31 Frequently Asked Questions

**Q: Who can use Additional AI Tools?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 30.32 RAG Self-Contained Summary

Smindruk feature **Additional AI Tools** exists to Provide image-prompt, content-calendar, reply, viral-ideas, seo-blog, content-ideas, cta tools. Business goal: Cover full content ideation workflow. Primary route: /dashboard/create-post. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 30.33 Operational Runbook for Support Agents

When a customer asks about **Additional AI Tools**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Additional AI Tools, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 30.34 QA Test Checklist

- [ ] Happy path for Additional AI Tools as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 30.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 31: Scheduler

**Document ID:** SMINDRUK-PRD-CH-31

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/create-post + /dashboard/calendar; admin scheduler`

**Product:** Smindruk — Social Media Management, Simplified

### 31.1 Purpose

Automatically publish due scheduled posts every minute via node-cron.

### 31.2 Business Goal

Hands-off publishing at the chosen time.

### 31.3 User Story

As a marketer, I schedule at 6pm and expect Smindruk to publish without me being online.

As a Smindruk workspace member with an appropriate role, I want to use **Scheduler** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 31.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Scheduler from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 31.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 31.6 UI Description & Layout

The Scheduler experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Scheduler Layout ────────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 31.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 31.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 31.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 31.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 31.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 31.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 31.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 31.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 31.15 Business Rules

1. Cron expression * * * * * runs runScheduledPostsJob and runScheduledBulkPostsJob

2. Claim due posts atomically by setting status=publishing

3. Stuck publishing > 10 minutes can be reclaimed

4. On recoverable failure, status returns to scheduled and retries continue (no permanent abandon for scheduled posts after reliability fix)

5. Success creates Notification type publish_success

6. Facebook publish uses encrypted page tokens; decrypt tries ENCRYPTION_KEY then JWT_SECRET

### 31.16 Backend Logic

1. Find candidates scheduledAt <= now and status scheduled|stale publishing
2. claimDuePost
3. executePublish → publishPostToFacebookPages
4. Update status published or reschedule on error

### 31.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| Post | scheduled items | scheduledAt, status, retryCount, failureReason |

### 31.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /posts/run-scheduler | Auth/ops | Manual trigger |
| POST | /admin/... runSchedulerJob | Admin | Admin trigger |

### 31.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 31.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 31.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
Cron tick → find due Posts → claim publishing → Graph publish → PagePost rows → status published → notify
```

### 31.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 31.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 31.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 31.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 31.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 31.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 31.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 31.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 31.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 31.31 Frequently Asked Questions

**Q: Who can use Scheduler?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 31.32 RAG Self-Contained Summary

Smindruk feature **Scheduler** exists to Automatically publish due scheduled posts every minute via node-cron. Business goal: Hands-off publishing at the chosen time. Primary route: /dashboard/create-post + /dashboard/calendar; admin scheduler. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: Post. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 31.33 Operational Runbook for Support Agents

When a customer asks about **Scheduler**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Scheduler, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 31.34 QA Test Checklist

- [ ] Happy path for Scheduler as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 31.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 32: Queue Management

**Document ID:** SMINDRUK-PRD-CH-32

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `Admin → Scheduler; User → Calendar`

**Product:** Smindruk — Social Media Management, Simplified

### 32.1 Purpose

Operational view of scheduled/publishing work (user calendar + admin scheduler status).

### 32.2 Business Goal

Visibility into backlog and failures.

### 32.3 User Story

As an admin, I want to see due counts and trigger a job.

As a Smindruk workspace member with an appropriate role, I want to use **Queue Management** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 32.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Queue Management from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 32.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 32.6 UI Description & Layout

The Queue Management experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Queue Management Layout ─────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 32.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 32.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 32.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 32.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 32.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 32.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 32.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 32.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 32.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 32.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 32.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 32.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /admin scheduler status | Admin | due/failed/scheduled counts |

### 32.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 32.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 32.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 32.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 32.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 32.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 32.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 32.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 32.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 32.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 32.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 32.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 32.31 Frequently Asked Questions

**Q: Who can use Queue Management?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 32.32 RAG Self-Contained Summary

Smindruk feature **Queue Management** exists to Operational view of scheduled/publishing work (user calendar + admin scheduler status). Business goal: Visibility into backlog and failures. Primary route: Admin → Scheduler; User → Calendar. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 32.33 Operational Runbook for Support Agents

When a customer asks about **Queue Management**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Queue Management, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 32.34 QA Test Checklist

- [ ] Happy path for Queue Management as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 32.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 33: Calendar View

**Document ID:** SMINDRUK-PRD-CH-33

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/calendar`

**Product:** Smindruk — Social Media Management, Simplified

### 33.1 Purpose

Visualize scheduled and published posts including bulk scheduled items.

### 33.2 Business Goal

Content planning clarity.

### 33.3 User Story

As a manager, I want a calendar of upcoming posts.

As a Smindruk workspace member with an appropriate role, I want to use **Calendar View** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 33.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Calendar View from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 33.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 33.6 UI Description & Layout

The Calendar View experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Calendar View Layout ────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 33.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 33.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 33.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 33.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 33.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status set | implicit | scheduled/published/failed/publishing | Server filter |

### 33.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 33.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 33.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 33.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 33.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 33.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 33.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /posts/calendar?workspaceId= | JWT | Posts + bulks merged |

### 33.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 33.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 33.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 33.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 33.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 33.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 33.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 33.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 33.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 33.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 33.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 33.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 33.31 Frequently Asked Questions

**Q: Who can use Calendar View?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 33.32 RAG Self-Contained Summary

Smindruk feature **Calendar View** exists to Visualize scheduled and published posts including bulk scheduled items. Business goal: Content planning clarity. Primary route: /dashboard/calendar. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 33.33 Operational Runbook for Support Agents

When a customer asks about **Calendar View**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Calendar View, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 33.34 QA Test Checklist

- [ ] Happy path for Calendar View as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 33.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 34: Drafts

**Document ID:** SMINDRUK-PRD-CH-34

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/create-post`

**Product:** Smindruk — Social Media Management, Simplified

### 34.1 Purpose

Save unfinished posts with status=draft.

### 34.2 Business Goal

Allow incomplete work without scheduling.

### 34.3 User Story

As an editor, I save a draft and finish tomorrow.

As a Smindruk workspace member with an appropriate role, I want to use **Drafts** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 34.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Drafts from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 34.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 34.6 UI Description & Layout

The Drafts experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Drafts Layout ───────────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 34.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 34.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 34.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 34.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 34.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 34.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 34.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 34.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 34.15 Business Rules

1. Draft does not require scheduledAt

2. Draft not picked by scheduler

### 34.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 34.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 34.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | https://smindruk.up.railway.app/api/v1/... | Bearer JWT | Fetch resource |

### 34.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 34.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 34.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 34.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 34.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 34.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 34.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 34.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 34.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 34.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 34.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 34.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 34.31 Frequently Asked Questions

**Q: Who can use Drafts?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 34.32 RAG Self-Contained Summary

Smindruk feature **Drafts** exists to Save unfinished posts with status=draft. Business goal: Allow incomplete work without scheduling. Primary route: /dashboard/create-post. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 34.33 Operational Runbook for Support Agents

When a customer asks about **Drafts**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Drafts, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 34.34 QA Test Checklist

- [ ] Happy path for Drafts as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 34.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 35: Bulk Upload & Bulk Scheduling

**Document ID:** SMINDRUK-PRD-CH-35

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/bulk-post`

**Product:** Smindruk — Social Media Management, Simplified

### 35.1 Purpose

Schedule one content payload across a numeric range of ConnectedPage pageNumbers.

### 35.2 Business Goal

Agency-scale distribution across dataset pages.

### 35.3 User Story

As an agency operator, I post from page 10 to 50 tomorrow at 9am.

As a Smindruk workspace member with an appropriate role, I want to use **Bulk Upload & Bulk Scheduling** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 35.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Bulk Upload & Bulk Scheduling from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 35.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 35.6 UI Description & Layout

The Bulk Upload & Bulk Scheduling experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Bulk Upload & Bulk Scheduling Layout ────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 35.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 35.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 35.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Secret key | text | Yes |  | Used to fetch later |
| From page | number | Yes |  | Inclusive |
| To page | number | Yes |  | Inclusive >= from |
| Content | textarea | Yes |  |  |
| Category | text | No |  | Filter |
| Schedule | datetime | No |  | If set → status scheduled |

### 35.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 35.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 35.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 35.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 35.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 35.15 Business Rules

1. Only ConnectedPage dataset targets

2. Bulk scheduler every minute via executeBulkPublish

3. Results recorded as PagePost entries with secretKey

### 35.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 35.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| BulkPost | Range jobs | fromPage,toPage,secretKey,scheduledAt,status |
| ConnectedPage | Targets | pageNumber |

### 35.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /connected-pages/bulk-post | JWT | Create bulk (optionally scheduled) |

### 35.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 35.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 35.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 35.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 35.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 35.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 35.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 35.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 35.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 35.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 35.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 35.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 35.31 Frequently Asked Questions

**Q: Who can use Bulk Upload & Bulk Scheduling?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 35.32 RAG Self-Contained Summary

Smindruk feature **Bulk Upload & Bulk Scheduling** exists to Schedule one content payload across a numeric range of ConnectedPage pageNumbers. Business goal: Agency-scale distribution across dataset pages. Primary route: /dashboard/bulk-post. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: BulkPost, ConnectedPage. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 35.33 Operational Runbook for Support Agents

When a customer asks about **Bulk Upload & Bulk Scheduling**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Bulk Upload & Bulk Scheduling, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 35.34 QA Test Checklist

- [ ] Happy path for Bulk Upload & Bulk Scheduling as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 35.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 36: Trending Dataset & Connected Pages

**Document ID:** SMINDRUK-PRD-CH-36

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/connect-channels, /dashboard/bulk-post, /dashboard/get-posts`

**Product:** Smindruk — Social Media Management, Simplified

### 36.1 Purpose

Maintain numbered Facebook pages for bulk operations and secret-key retrieval.

### 36.2 Business Goal

Differentiate Smindruk for agencies running large page fleets.

### 36.3 User Story

As an operator, I include pages in dataset, note page numbers, bulk post, then fetch by secret key.

As a Smindruk workspace member with an appropriate role, I want to use **Trending Dataset & Connected Pages** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 36.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Trending Dataset & Connected Pages from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 36.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 36.6 UI Description & Layout

The Trending Dataset & Connected Pages experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Trending Dataset & Connected Pages Layout ───────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 36.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 36.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 36.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 36.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 36.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 36.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 36.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 36.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 36.15 Business Rules

1. pageNumber allocated via getNextPageNumbers

2. Dataset SocialAccounts excluded from admin manage counts

3. Owner still posts via Create Post because SocialAccount dual-write exists

### 36.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 36.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| ConnectedPage | Dataset | pageNumber unique, pageId unique |

### 36.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /connected-pages/trending-meta | JWT | Meta |
| GET | /connected-pages?workspaceId= | JWT | List |
| POST | /connected-pages/posts/fetch | JWT | Fetch by secretKey |
| DELETE | /connected-pages/:id | JWT | Disconnect dataset page |

### 36.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 36.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 36.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 36.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 36.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 36.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 36.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 36.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 36.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 36.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 36.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 36.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 36.31 Frequently Asked Questions

**Q: Who can use Trending Dataset & Connected Pages?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 36.32 RAG Self-Contained Summary

Smindruk feature **Trending Dataset & Connected Pages** exists to Maintain numbered Facebook pages for bulk operations and secret-key retrieval. Business goal: Differentiate Smindruk for agencies running large page fleets. Primary route: /dashboard/connect-channels, /dashboard/bulk-post, /dashboard/get-posts. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: ConnectedPage. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 36.33 Operational Runbook for Support Agents

When a customer asks about **Trending Dataset & Connected Pages**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Trending Dataset & Connected Pages, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 36.34 QA Test Checklist

- [ ] Happy path for Trending Dataset & Connected Pages as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 36.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 37: Analytics

**Document ID:** SMINDRUK-PRD-CH-37

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/analytics`

**Product:** Smindruk — Social Media Management, Simplified

### 37.1 Purpose

Show post/page performance using stored analytics and Facebook insights sync where implemented.

### 37.2 Business Goal

Prove ROI of publishing activity.

### 37.3 User Story

As a brand manager, I want likes/reach style metrics on a dashboard.

As a Smindruk workspace member with an appropriate role, I want to use **Analytics** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 37.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Analytics from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 37.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 37.6 UI Description & Layout

The Analytics experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Analytics Layout ────────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 37.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 37.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 37.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 37.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 37.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 37.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 37.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 37.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 37.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 37.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 37.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| Analytics | Metrics | platform, period, metrics |

### 37.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /analytics/report | JWT | Report |
| POST | /analytics/record | JWT/system | Ingest |

### 37.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 37.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 37.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 37.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 37.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 37.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 37.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 37.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 37.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 37.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 37.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 37.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 37.31 Frequently Asked Questions

**Q: Who can use Analytics?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 37.32 RAG Self-Contained Summary

Smindruk feature **Analytics** exists to Show post/page performance using stored analytics and Facebook insights sync where implemented. Business goal: Prove ROI of publishing activity. Primary route: /dashboard/analytics. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: Analytics. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 37.33 Operational Runbook for Support Agents

When a customer asks about **Analytics**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Analytics, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 37.34 QA Test Checklist

- [ ] Happy path for Analytics as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 37.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 38: Reports

**Document ID:** SMINDRUK-PRD-CH-38

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `Admin reports`

**Product:** Smindruk — Social Media Management, Simplified

### 38.1 Purpose

Admin/platform reporting for users, posts, payments, social counts.

### 38.2 Business Goal

Executive visibility for Smindruk operators.

### 38.3 User Story

As a superadmin, I generate a platform report.

As a Smindruk workspace member with an appropriate role, I want to use **Reports** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 38.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Reports from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 38.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 38.6 UI Description & Layout

The Reports experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Reports Layout ──────────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 38.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 38.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 38.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 38.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 38.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 38.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 38.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 38.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 38.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 38.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 38.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 38.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /admin platform reports | Admin | Aggregates |

### 38.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 38.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 38.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 38.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 38.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 38.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 38.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 38.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 38.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 38.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 38.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 38.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 38.31 Frequently Asked Questions

**Q: Who can use Reports?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 38.32 RAG Self-Contained Summary

Smindruk feature **Reports** exists to Admin/platform reporting for users, posts, payments, social counts. Business goal: Executive visibility for Smindruk operators. Primary route: Admin reports. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 38.33 Operational Runbook for Support Agents

When a customer asks about **Reports**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Reports, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 38.34 QA Test Checklist

- [ ] Happy path for Reports as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 38.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 39: Unified Inbox (Roadmap)

**Document ID:** SMINDRUK-PRD-CH-39

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `N/A`

**Product:** Smindruk — Social Media Management, Simplified

### 39.1 Purpose

Future: aggregate comments/messages across networks.

### 39.2 Business Goal

Compete with Hootsuite inbox.

### 39.3 User Story

As a community manager, I reply to comments in one place.

As a Smindruk workspace member with an appropriate role, I want to use **Unified Inbox (Roadmap)** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 39.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Unified Inbox (Roadmap) from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 39.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 39.6 UI Description & Layout

The Unified Inbox (Roadmap) experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Unified Inbox (Roadmap) Layout ──────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 39.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 39.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 39.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 39.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 39.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 39.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 39.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 39.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 39.15 Business Rules

1. Not implemented as a dedicated backend module yet — marketing may mention social inbox as future

### 39.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 39.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 39.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | https://smindruk.up.railway.app/api/v1/... | Bearer JWT | Fetch resource |

### 39.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 39.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 39.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 39.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 39.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 39.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 39.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 39.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 39.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 39.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 39.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 39.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 39.31 Frequently Asked Questions

**Q: Who can use Unified Inbox (Roadmap)?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 39.32 RAG Self-Contained Summary

Smindruk feature **Unified Inbox (Roadmap)** exists to Future: aggregate comments/messages across networks. Business goal: Compete with Hootsuite inbox. Primary route: N/A. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 39.33 Operational Runbook for Support Agents

When a customer asks about **Unified Inbox (Roadmap)**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Unified Inbox (Roadmap), please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 39.34 QA Test Checklist

- [ ] Happy path for Unified Inbox (Roadmap) as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 39.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 40: Automation & Auto Reply (Roadmap)

**Document ID:** SMINDRUK-PRD-CH-40

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `N/A`

**Product:** Smindruk — Social Media Management, Simplified

### 40.1 Purpose

Future: rule-based automatic responses.

### 40.2 Business Goal

Scale community management.

### 40.3 User Story

As a support lead, I auto-reply to common questions.

As a Smindruk workspace member with an appropriate role, I want to use **Automation & Auto Reply (Roadmap)** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 40.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Automation & Auto Reply (Roadmap) from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 40.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 40.6 UI Description & Layout

The Automation & Auto Reply (Roadmap) experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Automation & Auto Reply (Roadmap) Layout ────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 40.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 40.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 40.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 40.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 40.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 40.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 40.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 40.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 40.15 Business Rules

1. Roadmap — AI Reply generator exists as assisted drafting, not automatic send

### 40.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 40.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 40.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | https://smindruk.up.railway.app/api/v1/... | Bearer JWT | Fetch resource |

### 40.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 40.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 40.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 40.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 40.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 40.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 40.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 40.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 40.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 40.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 40.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 40.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 40.31 Frequently Asked Questions

**Q: Who can use Automation & Auto Reply (Roadmap)?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 40.32 RAG Self-Contained Summary

Smindruk feature **Automation & Auto Reply (Roadmap)** exists to Future: rule-based automatic responses. Business goal: Scale community management. Primary route: N/A. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 40.33 Operational Runbook for Support Agents

When a customer asks about **Automation & Auto Reply (Roadmap)**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Automation & Auto Reply (Roadmap), please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 40.34 QA Test Checklist

- [ ] Happy path for Automation & Auto Reply (Roadmap) as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 40.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 41: Keyword Reply (Roadmap)

**Document ID:** SMINDRUK-PRD-CH-41

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `N/A`

**Product:** Smindruk — Social Media Management, Simplified

### 41.1 Purpose

Future: trigger replies from keyword rules.

### 41.2 Business Goal

Conversational marketing automation.

### 41.3 User Story

As a marketer, when someone comments PRICE, send a DM template.

As a Smindruk workspace member with an appropriate role, I want to use **Keyword Reply (Roadmap)** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 41.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Keyword Reply (Roadmap) from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 41.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 41.6 UI Description & Layout

The Keyword Reply (Roadmap) experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Keyword Reply (Roadmap) Layout ──────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 41.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 41.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 41.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 41.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 41.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 41.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 41.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 41.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 41.15 Business Rules

1. Roadmap item

### 41.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 41.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 41.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | https://smindruk.up.railway.app/api/v1/... | Bearer JWT | Fetch resource |

### 41.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 41.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 41.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 41.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 41.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 41.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 41.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 41.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 41.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 41.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 41.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 41.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 41.31 Frequently Asked Questions

**Q: Who can use Keyword Reply (Roadmap)?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 41.32 RAG Self-Contained Summary

Smindruk feature **Keyword Reply (Roadmap)** exists to Future: trigger replies from keyword rules. Business goal: Conversational marketing automation. Primary route: N/A. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 41.33 Operational Runbook for Support Agents

When a customer asks about **Keyword Reply (Roadmap)**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Keyword Reply (Roadmap), please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 41.34 QA Test Checklist

- [ ] Happy path for Keyword Reply (Roadmap) as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 41.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 42: Notifications

**Document ID:** SMINDRUK-PRD-CH-42

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `Topbar notification panel`

**Product:** Smindruk — Social Media Management, Simplified

### 42.1 Purpose

In-app (and email-capable) notifications for publish success/failure and system events.

### 42.2 Business Goal

Keep users informed without watching the calendar constantly.

### 42.3 User Story

As an editor, I see a toast and bell item when a scheduled post publishes.

As a Smindruk workspace member with an appropriate role, I want to use **Notifications** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 42.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Notifications from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 42.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 42.6 UI Description & Layout

The Notifications experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Notifications Layout ────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 42.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 42.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 42.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 42.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 42.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 42.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 42.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 42.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 42.15 Business Rules

1. Scheduler creates publish_success / publish_failed (retrying) notifications

2. Frontend polls and can toast new items

### 42.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 42.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| Notification | User alerts | type, title, message, isRead, metadata |

### 42.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /notifications | JWT | List |
| PATCH | /notifications/:id/read | JWT | Mark one |
| PATCH | /notifications/read-all | JWT | Mark all |
| POST | /admin notifications/broadcast | Admin | Broadcast |

### 42.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 42.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 42.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 42.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 42.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 42.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 42.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 42.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 42.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 42.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 42.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 42.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 42.31 Frequently Asked Questions

**Q: Who can use Notifications?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 42.32 RAG Self-Contained Summary

Smindruk feature **Notifications** exists to In-app (and email-capable) notifications for publish success/failure and system events. Business goal: Keep users informed without watching the calendar constantly. Primary route: Topbar notification panel. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: Notification. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 42.33 Operational Runbook for Support Agents

When a customer asks about **Notifications**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Notifications, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 42.34 QA Test Checklist

- [ ] Happy path for Notifications as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 42.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 43: Billing & Subscription

**Document ID:** SMINDRUK-PRD-CH-43

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/settings + /pricing`

**Product:** Smindruk — Social Media Management, Simplified

### 43.1 Purpose

Manage plan state and usage.

### 43.2 Business Goal

Revenue + entitlement enforcement.

### 43.3 User Story

As an owner, I upgrade to Professional for more seats.

As a Smindruk workspace member with an appropriate role, I want to use **Billing & Subscription** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 43.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Billing & Subscription from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 43.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 43.6 UI Description & Layout

The Billing & Subscription experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Billing & Subscription Layout ───────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 43.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 43.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 43.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 43.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 43.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 43.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 43.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 43.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 43.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 43.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 43.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| Subscription | Entitlements | limits, usage, status |

### 43.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | https://smindruk.up.railway.app/api/v1/... | Bearer JWT | Fetch resource |

### 43.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 43.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 43.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 43.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 43.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 43.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 43.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 43.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 43.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 43.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 43.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 43.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 43.31 Frequently Asked Questions

**Q: Who can use Billing & Subscription?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 43.32 RAG Self-Contained Summary

Smindruk feature **Billing & Subscription** exists to Manage plan state and usage. Business goal: Revenue + entitlement enforcement. Primary route: /dashboard/settings + /pricing. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: Subscription. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 43.33 Operational Runbook for Support Agents

When a customer asks about **Billing & Subscription**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Billing & Subscription, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 43.34 QA Test Checklist

- [ ] Happy path for Billing & Subscription as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 43.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 44: Coupons (Roadmap / Admin Extensibility)

**Document ID:** SMINDRUK-PRD-CH-44

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `N/A`

**Product:** Smindruk — Social Media Management, Simplified

### 44.1 Purpose

Discount codes for checkout.

### 44.2 Business Goal

Growth experiments.

### 44.3 User Story

As a prospect, I apply a coupon at checkout.

As a Smindruk workspace member with an appropriate role, I want to use **Coupons (Roadmap / Admin Extensibility)** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 44.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Coupons (Roadmap / Admin Extensibility) from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 44.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 44.6 UI Description & Layout

The Coupons (Roadmap / Admin Extensibility) experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Coupons (Roadmap / Admin Extensibility) Layout ──┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 44.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 44.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 44.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 44.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 44.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 44.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 44.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 44.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 44.15 Business Rules

1. Treat as extensibility roadmap unless a coupon collection is introduced

### 44.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 44.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 44.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | https://smindruk.up.railway.app/api/v1/... | Bearer JWT | Fetch resource |

### 44.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 44.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 44.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 44.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 44.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 44.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 44.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 44.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 44.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 44.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 44.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 44.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 44.31 Frequently Asked Questions

**Q: Who can use Coupons (Roadmap / Admin Extensibility)?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 44.32 RAG Self-Contained Summary

Smindruk feature **Coupons (Roadmap / Admin Extensibility)** exists to Discount codes for checkout. Business goal: Growth experiments. Primary route: N/A. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 44.33 Operational Runbook for Support Agents

When a customer asks about **Coupons (Roadmap / Admin Extensibility)**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Coupons (Roadmap / Admin Extensibility), please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 44.34 QA Test Checklist

- [ ] Happy path for Coupons (Roadmap / Admin Extensibility) as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 44.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 45: Invoices & Payments

**Document ID:** SMINDRUK-PRD-CH-45

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `N/A`

**Product:** Smindruk — Social Media Management, Simplified

### 45.1 Purpose

Record payments via Stripe (and future PayPal).

### 45.2 Business Goal

Financial traceability.

### 45.3 User Story

As an owner, I see payment history.

As a Smindruk workspace member with an appropriate role, I want to use **Invoices & Payments** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 45.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Invoices & Payments from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 45.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 45.6 UI Description & Layout

The Invoices & Payments experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Invoices & Payments Layout ──────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 45.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 45.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 45.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 45.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 45.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 45.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 45.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 45.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 45.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 45.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 45.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| Payment | Ledger | gateway, amount, status |

### 45.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /payments/checkout | JWT | Stripe session |
| POST | /payments/webhook/stripe | Stripe signature | Fulfill |
| GET | /payments/history | JWT | List |

### 45.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 45.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 45.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 45.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 45.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 45.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 45.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 45.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 45.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 45.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 45.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 45.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 45.31 Frequently Asked Questions

**Q: Who can use Invoices & Payments?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 45.32 RAG Self-Contained Summary

Smindruk feature **Invoices & Payments** exists to Record payments via Stripe (and future PayPal). Business goal: Financial traceability. Primary route: N/A. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: Payment. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 45.33 Operational Runbook for Support Agents

When a customer asks about **Invoices & Payments**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Invoices & Payments, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 45.34 QA Test Checklist

- [ ] Happy path for Invoices & Payments as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 45.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 46: Settings & Profile

**Document ID:** SMINDRUK-PRD-CH-46

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `/dashboard/settings`

**Product:** Smindruk — Social Media Management, Simplified

### 46.1 Purpose

Update profile fields, password, avatar, plan view.

### 46.2 Business Goal

Account self-service.

### 46.3 User Story

As a user, I change my password and profile name.

As a Smindruk workspace member with an appropriate role, I want to use **Settings & Profile** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 46.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Settings & Profile from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 46.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 46.6 UI Description & Layout

The Settings & Profile experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Settings & Profile Layout ───────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 46.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 46.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 46.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 46.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 46.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 46.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 46.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 46.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 46.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 46.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 46.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 46.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /users/me | JWT | Profile |
| PATCH | /users/me | JWT | Update |
| POST | /users/me/avatar | JWT | Avatar |
| POST | /users/me/password | JWT | Password |

### 46.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 46.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 46.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 46.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 46.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 46.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 46.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 46.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 46.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 46.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 46.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 46.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 46.31 Frequently Asked Questions

**Q: Who can use Settings & Profile?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 46.32 RAG Self-Contained Summary

Smindruk feature **Settings & Profile** exists to Update profile fields, password, avatar, plan view. Business goal: Account self-service. Primary route: /dashboard/settings. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 46.33 Operational Runbook for Support Agents

When a customer asks about **Settings & Profile**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Settings & Profile, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 46.34 QA Test Checklist

- [ ] Happy path for Settings & Profile as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 46.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 47: Security

**Document ID:** SMINDRUK-PRD-CH-47

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `N/A`

**Product:** Smindruk — Social Media Management, Simplified

### 47.1 Purpose

Protect tokens, passwords, and tenant data.

### 47.2 Business Goal

Trust and compliance posture.

### 47.3 User Story

As a security-conscious owner, I need encrypted social tokens and hashed passwords.

As a Smindruk workspace member with an appropriate role, I want to use **Security** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 47.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Security from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 47.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 47.6 UI Description & Layout

The Security experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Security Layout ─────────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 47.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 47.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 47.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 47.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 47.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 47.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 47.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 47.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 47.15 Business Rules

1. Passwords bcrypt hashed

2. Social tokens AES-256-CBC with iv:cipher hex format

3. decrypt tries ENCRYPTION_KEY then JWT_SECRET; plaintext legacy tokens without colon accepted

4. Helmet, CORS allow-list, rate limits

5. Admin security overview endpoints

### 47.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 47.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 47.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | https://smindruk.up.railway.app/api/v1/... | Bearer JWT | Fetch resource |

### 47.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 47.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 47.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 47.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 47.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 47.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 47.25 Security Considerations

- Never log raw access tokens
- select:false on token fields
- Refresh token revocation on logout

### 47.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 47.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 47.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 47.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 47.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 47.31 Frequently Asked Questions

**Q: Who can use Security?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 47.32 RAG Self-Contained Summary

Smindruk feature **Security** exists to Protect tokens, passwords, and tenant data. Business goal: Trust and compliance posture. Primary route: N/A. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 47.33 Operational Runbook for Support Agents

When a customer asks about **Security**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Security, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 47.34 QA Test Checklist

- [ ] Happy path for Security as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 47.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 48: Public API & Webhooks

**Document ID:** SMINDRUK-PRD-CH-48

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `N/A`

**Product:** Smindruk — Social Media Management, Simplified

### 48.1 Purpose

Programmatic access via /api/v1 and payment/social callbacks.

### 48.2 Business Goal

Automation and integrations.

### 48.3 User Story

As a developer, I call Smindruk APIs with a JWT.

As a Smindruk workspace member with an appropriate role, I want to use **Public API & Webhooks** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 48.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Public API & Webhooks from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 48.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 48.6 UI Description & Layout

The Public API & Webhooks experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Public API & Webhooks Layout ────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 48.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 48.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 48.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 48.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 48.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 48.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 48.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 48.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 48.15 Business Rules

1. All user data routes require authenticate middleware unless documented public

### 48.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 48.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 48.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /api/v1/docs | Public | Swagger UI |
| POST | /payments/webhook/stripe | Stripe | Billing events |

### 48.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 48.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 48.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 48.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 48.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 48.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 48.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 48.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 48.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 48.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 48.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 48.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 48.31 Frequently Asked Questions

**Q: Who can use Public API & Webhooks?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 48.32 RAG Self-Contained Summary

Smindruk feature **Public API & Webhooks** exists to Programmatic access via /api/v1 and payment/social callbacks. Business goal: Automation and integrations. Primary route: N/A. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 48.33 Operational Runbook for Support Agents

When a customer asks about **Public API & Webhooks**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Public API & Webhooks, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 48.34 QA Test Checklist

- [ ] Happy path for Public API & Webhooks as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 48.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 49: Integrations

**Document ID:** SMINDRUK-PRD-CH-49

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `Admin → API settings`

**Product:** Smindruk — Social Media Management, Simplified

### 49.1 Purpose

Third-party systems: Facebook Graph, Cloudinary, Groq, Stripe, Google OAuth.

### 49.2 Business Goal

Leverage best-of-breed services.

### 49.3 User Story

As an admin, I verify integration health in API settings.

As a Smindruk workspace member with an appropriate role, I want to use **Integrations** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 49.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Integrations from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 49.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 49.6 UI Description & Layout

The Integrations experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Integrations Layout ─────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 49.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 49.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 49.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 49.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 49.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 49.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 49.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 49.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 49.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 49.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 49.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 49.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | https://smindruk.up.railway.app/api/v1/... | Bearer JWT | Fetch resource |

### 49.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 49.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 49.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 49.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 49.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 49.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 49.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 49.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 49.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 49.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 49.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 49.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 49.31 Frequently Asked Questions

**Q: Who can use Integrations?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 49.32 RAG Self-Contained Summary

Smindruk feature **Integrations** exists to Third-party systems: Facebook Graph, Cloudinary, Groq, Stripe, Google OAuth. Business goal: Leverage best-of-breed services. Primary route: Admin → API settings. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 49.33 Operational Runbook for Support Agents

When a customer asks about **Integrations**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Integrations, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 49.34 QA Test Checklist

- [ ] Happy path for Integrations as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 49.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 50: Cron Jobs

**Document ID:** SMINDRUK-PRD-CH-50

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `N/A`

**Product:** Smindruk — Social Media Management, Simplified

### 50.1 Purpose

Background automation inside the API process.

### 50.2 Business Goal

Scheduling and token hygiene without external worker fleet (v1).

### 50.3 User Story

As DevOps, I know which crons run and their timezone.

As a Smindruk workspace member with an appropriate role, I want to use **Cron Jobs** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 50.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Cron Jobs from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 50.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 50.6 UI Description & Layout

The Cron Jobs experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Cron Jobs Layout ────────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 50.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 50.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 50.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 50.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 50.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 50.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 50.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 50.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 50.15 Business Rules

1. Post + Bulk scheduler: every minute

2. Facebook token refresh: 0 12 * * * Asia/Karachi (configurable)

3. Jobs start after bootstrap when DB is ready

4. Admin can manually run scheduler jobs

### 50.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 50.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 50.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | https://smindruk.up.railway.app/api/v1/... | Bearer JWT | Fetch resource |

### 50.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 50.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 50.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 50.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 50.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 50.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 50.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 50.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 50.27 Logging & Audit Trail

- cron_job_run audit events for manual runs
- Winston errors on job crash

- Privileged admin mutations write AuditLog documents

### 50.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 50.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 50.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 50.31 Frequently Asked Questions

**Q: Who can use Cron Jobs?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 50.32 RAG Self-Contained Summary

Smindruk feature **Cron Jobs** exists to Background automation inside the API process. Business goal: Scheduling and token hygiene without external worker fleet (v1). Primary route: N/A. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 50.33 Operational Runbook for Support Agents

When a customer asks about **Cron Jobs**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Cron Jobs, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 50.34 QA Test Checklist

- [ ] Happy path for Cron Jobs as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 50.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 51: Token Refresh System (Deep Dive)

This chapter is mandatory reading for engineers, support, and the Groq RAG assistant. Facebook Page publishing depends on valid page access tokens. Smindruk encrypts tokens at rest and refreshes them on a policy window.

### 51.1 OAuth Recap

OAuth 2.0 authorization code flow for Facebook: User clicks Connect → Smindruk redirects to Facebook dialog with state carrying workspaceId, userId, connectMode → User grants pages permissions → Facebook redirects to /api/v1/social-accounts/facebook/callback?code&state → API exchanges code for user access token → exchanges for long-lived user token → reads /me/accounts for page tokens → encrypts and stores.

```text

User                Smindruk API              Facebook
 |--connect-------->|                           |
 |<-302 facebook----|                           |
 |------------------auth dialog---------------->|
 |<-redirect callback?code----------------------|
 |                  |--exchange code----------->|
 |                  |<--user token--------------|
 |                  |--fb_exchange_token------->|
 |                  |<--long-lived user token---|
 |                  |--GET /me/accounts-------->|
 |                  |<--pages+page tokens-------|
 |                  | encrypt + upsert Mongo    |
 |<-302 frontend----|                           |

```

### 51.2 Access Token

A Facebook Page access token authorizes Graph calls such as POST /{page-id}/feed. Smindruk stores it in SocialAccount.accessToken or ConnectedPage.pageAccessToken with select:false, encrypted via AES-256-CBC as ivHex:encryptedHex.

### 51.3 Refresh / User Token

Smindruk also stores userAccessToken (long-lived) used to mint/refresh page tokens during the refresh job. If user token is invalid, refresh fails and the account may require reconnect.

### 51.4 Token Expiry Model

| Field | Meaning |
| --- | --- |
| tokenIssuedAt | When current page token material was issued/saved |
| tokenExpiresAt | Modeled expiry (~60 days from issue for page tokens) |
| lastTokenRefreshAttemptAt | Last cron/manual attempt timestamp |
| lastTokenRefreshError | Last error string if failed |

### 51.5 Business Rules (Authoritative)

**Rule TR-1 (Healthy):** If age(tokenIssuedAt) < TOKEN_REFRESH_AFTER_DAYS (default **45**), status presentation is healthy.

**Rule TR-2 (Refresh Due):** If age >= 45 and < TOKEN_REFRESH_CRON_MAX_DAYS (default **60**), refreshStatus=refresh_due. Daily cron MUST attempt refresh. Manual refresh allowed. UI may show warning badge.

**Rule TR-3 (Cron Expired):** If age >= 60 days, refreshStatus=cron_expired. Daily cron MUST NOT keep auto-refreshing this account (stops automatic attempts). Manual refresh still allowed. User should reconnect if manual refresh fails.

**Rule TR-4 (Cron Schedule):** Job runs at FB_TOKEN_REFRESH_CRON (default 0 12 * * *) in CRON_TIMEZONE (default Asia/Karachi).

**Rule TR-5 (Failure Handling):** If cron refresh fails: store lastTokenRefreshError, set attention state Refresh Required / refresh_due semantics in admin overview, surface warning badge in admin social accounts, and disable or fail publishing attempts that cannot decrypt/use a valid token until refresh or reconnect succeeds.

**Rule TR-6 (Manual Refresh):** Admin endpoint POST /admin/social-accounts/:source/:id/refresh-token where source is manage|dataset. User-facing POST /social-accounts/:id/refresh-token for manage accounts.

**Rule TR-7 (Reconnect):** User repeats Facebook OAuth connect for the same pages to write fresh tokens (upsert by page id).

**Rule TR-8 (Decrypt Resilience):** At publish time, decrypt MUST try ENCRYPTION_KEY then JWT_SECRET to avoid false failures when secrets rotated incorrectly across environments.

**Rule TR-9 (Dataset vs Manage):** Token refresh applies to both SocialAccount and ConnectedPage collections.

### 51.6 Cron Job Algorithm

```text

every day at 12:00 Asia/Karachi:
  for each SocialAccount (facebook, connected) eligible by age window:
    try refreshFacebookTokensForAccount(id)
    on success: update tokenIssuedAt, clear lastTokenRefreshError
    on failure: set lastTokenRefreshError, keep status attention
  for each ConnectedPage connected eligible:
    try refreshFacebookTokensForConnectedPage(id)
    same success/failure handling

```

### 51.7 UI: Refresh Required

Admin Social Accounts overview computes refreshStatus: healthy | refresh_due | cron_expired. Warning badges appear for refresh_due and cron_expired. Summary counters include tokenRefreshRequired. Manual Refresh button per row.

### 51.8 Publishing Interaction

If token decrypt fails or Graph returns OAuth exceptions, scheduled publish logs error and retries per scheduler policy. Users should reconnect Facebook. Support should never ask for raw tokens.

### 51.9 Sequence: Manual Refresh

```text

Admin → POST /admin/social-accounts/manage/:id/refresh-token
     → refreshFacebookTokensForAccount
     → Graph calls with userAccessToken
     → encrypt new page token
     → save SocialAccount
     → ApiResponse success

```

### 51.10 FAQ — Token Refresh

**Q: Why 45 days if Facebook long-lived tokens last ~60?**

**A:** Smindruk refreshes proactively at 45 to reduce surprise expiry near day 60.

**Q: What if cron fails on day 50?**

**A:** Account remains refresh_due; error stored; badge shown; user/admin can manual refresh; publishing may fail until resolved.

**Q: What after day 60?**

**A:** cron_expired — automatic cron stops; manual refresh or reconnect required.

### 51.10.1 Support Scenario 1: Token Health

Scenario 1: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.2 Support Scenario 2: Token Health

Scenario 2: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.3 Support Scenario 3: Token Health

Scenario 3: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.4 Support Scenario 4: Token Health

Scenario 4: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.5 Support Scenario 5: Token Health

Scenario 5: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.6 Support Scenario 6: Token Health

Scenario 6: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.7 Support Scenario 7: Token Health

Scenario 7: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.8 Support Scenario 8: Token Health

Scenario 8: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.9 Support Scenario 9: Token Health

Scenario 9: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.10 Support Scenario 10: Token Health

Scenario 10: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.11 Support Scenario 11: Token Health

Scenario 11: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.12 Support Scenario 12: Token Health

Scenario 12: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.13 Support Scenario 13: Token Health

Scenario 13: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.14 Support Scenario 14: Token Health

Scenario 14: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.15 Support Scenario 15: Token Health

Scenario 15: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.16 Support Scenario 16: Token Health

Scenario 16: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.17 Support Scenario 17: Token Health

Scenario 17: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.18 Support Scenario 18: Token Health

Scenario 18: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.19 Support Scenario 19: Token Health

Scenario 19: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.20 Support Scenario 20: Token Health

Scenario 20: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.21 Support Scenario 21: Token Health

Scenario 21: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.22 Support Scenario 22: Token Health

Scenario 22: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.23 Support Scenario 23: Token Health

Scenario 23: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.24 Support Scenario 24: Token Health

Scenario 24: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

### 51.10.25 Support Scenario 25: Token Health

Scenario 25: A workspace reports scheduled posts not publishing. Step 1: Identify workspaceId. Step 2: List SocialAccounts and ConnectedPages for that workspace. Step 3: Compute age from tokenIssuedAt. Step 4: If age>=45, attempt manual refresh for manage and dataset sources. Step 5: If Graph returns password changed / session invalidated, instruct reconnect via Connect Channels (choose the same mode originally used). Step 6: Re-queue failed scheduled posts if status stuck failed (scheduler also requeues failed scheduled posts automatically). Step 7: Confirm next cron tick publishes a test scheduled post 2 minutes ahead. Always document AuditLog and Notification outcomes.

## Chapter 52: Audit Logs

**Document ID:** SMINDRUK-PRD-CH-52

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `N/A`

**Product:** Smindruk — Social Media Management, Simplified

### 52.1 Purpose

Record security and admin-sensitive events.

### 52.2 Business Goal

Forensics and compliance.

### 52.3 User Story

As an admin, I inspect who deleted a user.

As a Smindruk workspace member with an appropriate role, I want to use **Audit Logs** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 52.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Audit Logs from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 52.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 52.6 UI Description & Layout

The Audit Logs experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Audit Logs Layout ───────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 52.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 52.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 52.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 52.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 52.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 52.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 52.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 52.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 52.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 52.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 52.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| AuditLog | Events | event, user, workspace, metadata |

### 52.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /admin/logs | Admin | Paginated logs |

### 52.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 52.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 52.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 52.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 52.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 52.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 52.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 52.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 52.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 52.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 52.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 52.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 52.31 Frequently Asked Questions

**Q: Who can use Audit Logs?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 52.32 RAG Self-Contained Summary

Smindruk feature **Audit Logs** exists to Record security and admin-sensitive events. Business goal: Forensics and compliance. Primary route: N/A. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: AuditLog. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 52.33 Operational Runbook for Support Agents

When a customer asks about **Audit Logs**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Audit Logs, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 52.34 QA Test Checklist

- [ ] Happy path for Audit Logs as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 52.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 53: Admin Panel

**Document ID:** SMINDRUK-PRD-CH-53

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `https://dashboard-smindruk.vercel.app`

**Product:** Smindruk — Social Media Management, Simplified

### 53.1 Purpose

Operate the SaaS: users, workspaces, posts, social tokens, scheduler, billing, support, blogs, settings.

### 53.2 Business Goal

Single control plane for Smindruk staff.

### 53.3 User Story

As a superadmin, I disable an abusive user and refresh tokens.

As a Smindruk workspace member with an appropriate role, I want to use **Admin Panel** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 53.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Admin Panel from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 53.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 53.6 UI Description & Layout

The Admin Panel experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Admin Panel Layout ──────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 53.7 UI Components

- Sidebar
- Stats cards
- Data tables
- Manual refresh actions
- Broadcast notifications

### 53.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 53.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 53.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 53.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 53.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 53.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 53.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 53.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 53.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 53.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 53.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| * | /admin/* | authenticate+isAdmin | Admin surface |

### 53.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 53.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 53.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 53.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 53.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 53.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 53.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 53.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 53.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 53.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 53.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 53.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 53.31 Frequently Asked Questions

**Q: Who can use Admin Panel?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 53.32 RAG Self-Contained Summary

Smindruk feature **Admin Panel** exists to Operate the SaaS: users, workspaces, posts, social tokens, scheduler, billing, support, blogs, settings. Business goal: Single control plane for Smindruk staff. Primary route: https://dashboard-smindruk.vercel.app. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 53.33 Operational Runbook for Support Agents

When a customer asks about **Admin Panel**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Admin Panel, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 53.34 QA Test Checklist

- [ ] Happy path for Admin Panel as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 53.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 54: Monitoring

**Document ID:** SMINDRUK-PRD-CH-54

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `N/A`

**Product:** Smindruk — Social Media Management, Simplified

### 54.1 Purpose

Health endpoint and system status for ops.

### 54.2 Business Goal

Detect downtime quickly.

### 54.3 User Story

As DevOps, I probe /health on Railway.

As a Smindruk workspace member with an appropriate role, I want to use **Monitoring** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 54.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Monitoring from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 54.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 54.6 UI Description & Layout

The Monitoring experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Monitoring Layout ───────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 54.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 54.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 54.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 54.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 54.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 54.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 54.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 54.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 54.15 Business Rules

1. Railway healthcheckPath=/health

2. ready flag flips after bootstrap

### 54.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 54.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 54.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | /health | Public | liveness/readiness JSON |
| GET | / | Public | ok |

### 54.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 54.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 54.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 54.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 54.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 54.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 54.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 54.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 54.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 54.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 54.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 54.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 54.31 Frequently Asked Questions

**Q: Who can use Monitoring?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 54.32 RAG Self-Contained Summary

Smindruk feature **Monitoring** exists to Health endpoint and system status for ops. Business goal: Detect downtime quickly. Primary route: N/A. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 54.33 Operational Runbook for Support Agents

When a customer asks about **Monitoring**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Monitoring, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 54.34 QA Test Checklist

- [ ] Happy path for Monitoring as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 54.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 55: Feature Flags

**Document ID:** SMINDRUK-PRD-CH-55

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `N/A`

**Product:** Smindruk — Social Media Management, Simplified

### 55.1 Purpose

PlatformSettings.featureFlags for gradual rollout.

### 55.2 Business Goal

Toggle incomplete features safely.

### 55.3 User Story

As product, I disable a beta flag without redeploying UI copy.

As a Smindruk workspace member with an appropriate role, I want to use **Feature Flags** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 55.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Feature Flags from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 55.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 55.6 UI Description & Layout

The Feature Flags experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Feature Flags Layout ────────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 55.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 55.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 55.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 55.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 55.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 55.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 55.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 55.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 55.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 55.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 55.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| PlatformSettings | Flags | featureFlags mixed |

### 55.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | https://smindruk.up.railway.app/api/v1/... | Bearer JWT | Fetch resource |

### 55.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 55.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 55.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 55.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 55.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 55.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 55.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 55.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 55.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 55.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 55.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 55.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 55.31 Frequently Asked Questions

**Q: Who can use Feature Flags?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 55.32 RAG Self-Contained Summary

Smindruk feature **Feature Flags** exists to PlatformSettings.featureFlags for gradual rollout. Business goal: Toggle incomplete features safely. Primary route: N/A. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: PlatformSettings. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 55.33 Operational Runbook for Support Agents

When a customer asks about **Feature Flags**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Feature Flags, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 55.34 QA Test Checklist

- [ ] Happy path for Feature Flags as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 55.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 56: Support Center

**Document ID:** SMINDRUK-PRD-CH-56

**Audience:** Developers, QA, Designers, DevOps, Support, Product, End Users, AI Assistants

**Primary UI Route (if applicable):** `N/A`

**Product:** Smindruk — Social Media Management, Simplified

### 56.1 Purpose

Contact/support tickets via ContactMessage and help content.

### 56.2 Business Goal

Customer success.

### 56.3 User Story

As a user, I submit a support request.

As a Smindruk workspace member with an appropriate role, I want to use **Support Center** so that I can achieve the business goal above without leaving the Smindruk web application. Acceptance is measured by successful API responses, correct UI states, and audit/notification side-effects described in this chapter.

### 56.4 Functional Requirements

The system SHALL provide all capabilities described in this chapter for authenticated users who pass authorization checks. The system SHALL persist durable state in MongoDB collections listed below. The system SHALL expose REST endpoints under `https://smindruk.up.railway.app/api/v1`. The system SHALL present loading, empty, success, and failure states for every primary action. The system SHALL emit notifications and audit events where specified. The system SHALL enforce plan limits associated with the workspace subscription when the feature consumes billable resources (accounts, posts, storage, AI usage, team seats).

- [ ] User can open Support Center from the Smindruk dashboard navigation when permitted
- [ ] All required inputs are validated client-side and server-side
- [ ] Unauthorized roles receive HTTP 401/403 with clear messages
- [ ] Successful actions update UI without full page reload where SPA patterns apply
- [ ] Failures show actionable error text and do not corrupt prior state
- [ ] Feature works on desktop and mobile viewport widths used by Next.js responsive layout

### 56.5 Non-Functional Requirements

- Availability target for this feature path: 99.5% monthly excluding planned maintenance
- p95 API latency under normal load: < 800ms for read endpoints; < 2s for write endpoints excluding external social network RTT
- All secrets (tokens, passwords) encrypted or hashed; never returned in list APIs
- Accessible UI: labels, focus order, contrast aligned with Smindruk design system
- Observability: Winston logs + optional AuditLog entries for privileged actions

### 56.6 UI Description & Layout

The Support Center experience is rendered inside the authenticated dashboard shell (top bar with search/notifications/user menu, left sidebar with primary navigation, main content region). The first viewport focuses on the primary task for this feature without unrelated marketing widgets.

```text
┌─ Support Center Layout ───────────────────────────┐
│ Topbar: Logo | Search | Notifications | Avatar     │
│ Sidebar: Dashboard | Create | Channels | ...       │
│ Main: Page title + short helper text               │
│ Primary panel: forms / tables / composer           │
│ Secondary: filters, tips, status badges            │
└────────────────────────────────────────────────────┘
```

### 56.7 UI Components

- Page header
- Primary action button
- Form fields
- Data table or list
- Toast notifications (Sonner)
- Loading spinners
- Empty state illustration/text

### 56.8 Every Button

| Button Label | Action | Enabled When | API / Side Effect |
| --- | --- | --- | --- |
| Save | Persist changes | Form valid | PATCH/POST relevant resource |
| Cancel | Discard unsaved edits | Always | Navigate back / close dialog |
| Refresh | Reload data | Always | GET list endpoint |

### 56.9 Every Input Field

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| Search | text | No | empty | Debounced client filter or server query |

### 56.10 Every Table Column

| Column | Source Field | Sortable | Description |
| --- | --- | --- | --- |
| Name | name | Yes | Primary display label |
| Status | status | Yes | Lifecycle state badge |
| Updated | updatedAt | Yes | ISO timestamp localized in UI |

### 56.11 Every Filter

| Filter | Type | Values | Effect |
| --- | --- | --- | --- |
| Status | dropdown | all / active / inactive | Narrows list query |
| Search | text | free text | Matches name/email/content |

### 56.12 Every Dropdown

| Dropdown | Options | Default | Impact |
| --- | --- | --- | --- |
| Page size | 10 / 20 / 50 / 100 | 20 | Pagination limit |

### 56.13 Validation Rules

- Required string fields: min length 1 after trim; reject whitespace-only
- Emails: RFC-like format validated with Zod on frontend and backend
- ObjectIds: 24-hex mongoose ids
- Dates: valid ISO-8601; scheduledAt must be parseable Date

### 56.14 User Permissions (RBAC)

Default permitted roles for mutating actions: **owner, admin, editor**. Viewers may read where the feature exposes read-only surfaces. Platform admins (`admin` / `superadmin` on User.role) access Admin Dashboard counterparts. Workspace isolation is absolute: queries always scope by `workspace` ObjectId from the active workspace context.

| Role | Read | Create/Update | Delete | Admin Override |
| --- | --- | --- | --- | --- |
| owner | Yes | Yes | Yes | N/A |
| admin | Yes | Yes | Yes (non-owner resources) | N/A |
| editor | Yes | Yes (content) | Limited | N/A |
| viewer | Yes | No | No | N/A |
| platform admin | Via Admin app | Via Admin APIs | Via Admin APIs | Yes |

### 56.15 Business Rules

1. Actions only succeed when the user is authenticated with a valid JWT access token

2. Workspace must be active (Workspace.isActive === true)

3. Plan limits must not be exceeded for constrained resources

### 56.16 Backend Logic

1. Authenticate JWT via auth middleware
2. Authorize role / workspace membership
3. Validate body/query with Zod validators
4. Execute controller business logic
5. Persist via Mongoose models
6. Return ApiResponse envelope { success, statusCode, message, data }

### 56.17 Database Collections

| Collection / Model | Purpose | Key Fields |
| --- | --- | --- |
| N/A | Feature may be UI-only or compose other collections | — |

### 56.18 API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | /contact/support | Public/auth | Create ticket |
| GET | /admin/support | Admin | Manage |

### 56.19 Request Example

```http
GET https://smindruk.up.railway.app/api/v1/example
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 56.20 Response Example

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

### 56.21 Authentication & Authorization Flow

Client stores access and refresh tokens (localStorage when Remember is enabled). Each API call sends `Authorization: Bearer <access_token>`. On 401, client attempts refresh via `POST /auth/refresh-token`, then retries. If refresh fails, user is redirected to login. Feature-level authorization checks TeamMember.role within the active workspace and, for admin routes, User.role.

```text
User → UI → API (JWT) → Controller → MongoDB → Response → UI state update
```

### 56.22 Error Messages

| HTTP | Message (example) | When |
| --- | --- | --- |
| 400 | Validation failed / bad request | Zod or controller validation |
| 401 | Access token is missing / invalid | Unauthenticated |
| 403 | Forbidden | Role insufficient |
| 404 | Resource not found | Wrong id / wrong workspace |
| 429 | Too many requests | Rate limiter |
| 500 | Internal server error | Unhandled exception |

### 56.23 Edge Cases

- User switches workspace mid-form: subsequent saves must use new workspaceId
- Token expires during long upload: refresh then retry
- Duplicate submit: disable button while request in-flight

### 56.24 Loading / Empty / Success / Failure States

| State | UI Behavior |
| --- | --- |
| Loading | Spinner or skeleton; primary buttons disabled |
| Empty | Helpful empty copy + CTA to create/connect first item |
| Success | Toast success; list/detail refreshed |
| Failure | Toast error with server message; form values retained |

### 56.25 Security Considerations

- Never expose accessToken/pageAccessToken in list responses (select: false)
- CORS allow-list limited to known frontends
- Helmet security headers on Express
- Rate limiting on auth and global routes

### 56.26 Performance Considerations

- Index workspace + status fields used in list filters
- Paginate large lists
- Avoid N+1 by using populate judiciously

### 56.27 Logging & Audit Trail

- Winston application logs for errors and key lifecycle events

- Privileged admin mutations write AuditLog documents

### 56.28 Notifications

- In-app Notification documents for user-visible outcomes where applicable

### 56.29 Best Practices

- Prefer idempotent writes where possible
- Keep UI copy aligned with this PRD terminology
- Test both manage and dataset Facebook modes when social publishing is involved

### 56.30 Troubleshooting

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Blank page | JS error / auth redirect loop | Check console; clear tokens; re-login |
| 403 on save | Viewer role | Ask owner to elevate role |
| 404 on item | Wrong workspace | Switch to correct workspace |

### 56.31 Frequently Asked Questions

**Q: Who can use Support Center?**

**A:** Workspace members with roles listed in the permissions section, subject to plan limits.

**Q: Does this work offline?**

**A:** No. Smindruk requires network access to the API and, for publishing, to social platform APIs.

**Q: Where is data stored?**

**A:** MongoDB database configured via MONGO_URL / MONGO_DB_NAME (production database name: smindruk).

### 56.32 RAG Self-Contained Summary

Smindruk feature **Support Center** exists to Contact/support tickets via ContactMessage and help content. Business goal: Customer success. Primary route: N/A. Auth: JWT Bearer. Roles: owner, admin, editor. Collections: see related chapters. Always answer user questions about this feature using the detailed sections above without inventing undocumented UI controls.

### 56.33 Operational Runbook for Support Agents

When a customer asks about **Support Center**, first confirm they are logged into https://smindruk.vercel.app (or admin https://dashboard-smindruk.vercel.app if the issue is platform-admin). Confirm active workspace name. Reproduce with the same role. Capture HTTP status, response message, and approximate timestamp (Asia/Karachi). Check whether Facebook tokens show Refresh Required if publishing is involved. Never ask the customer to paste access tokens into chat; instead ask them to reconnect Facebook from Connect Channels.

Support macro: "Thanks for contacting Smindruk Support. For Support Center, please try: (1) refresh the page, (2) confirm you are in the correct workspace, (3) retry the action, (4) if publishing, open Connected Channels and check for Refresh Required badges, (5) reply with a screenshot of the error toast."

### 56.34 QA Test Checklist

- [ ] Happy path for Support Center as owner
- [ ] Happy path as editor (if permitted)
- [ ] Denied path as viewer
- [ ] Validation failures for each required field
- [ ] Network failure simulation shows failure state
- [ ] Mobile viewport usable
- [ ] After success, refresh page still shows persisted data

### 56.35 Glossary Anchors for This Chapter

Terms used in this chapter that must match the global glossary: Workspace, TeamMember role, SocialAccount, ConnectedPage, Post status (draft|scheduled|publishing|published|failed), JWT access token, refresh token, plan limits, ApiResponse envelope, AuditLog, Notification.

## Chapter 57: Troubleshooting Guide

| Problem | Checks | Fix |
| --- | --- | --- |
| AI not configured | GROQ_API_KEY on API process | Set env, restart |
| Scheduled fail decrypt | ENCRYPTION_KEY/JWT_SECRET mismatch | Align secrets; reconnect FB; decrypt fallbacks |
| OAuth 501 | Google/FB env missing | Configure callbacks exactly |
| CORS error | ALLOWED_ORIGINS | Add frontend origin |
| Empty page picker | No SocialAccount/ConnectedPage | Connect Facebook |
| Dataset not in manage admin | Expected | Dataset is separate by design |
| Bulk nothing published | page range empty / wrong category | Verify ConnectedPage numbers |

## Chapter 58: Error Reference

| Code | Envelope | Meaning |
| --- | --- | --- |
| 400 | ApiError.badRequest | Validation / business rule |
| 401 | unauthorized | Missing/invalid JWT |
| 403 | forbidden | Role |
| 404 | notFound | Missing doc |
| 429 | rate limit | Too many requests |
| 500 | internal | Unhandled |
| 501 | not implemented | OAuth provider not configured |

Standard error JSON: { success:false, statusCode, message, errors:[], stack? }

## Chapter 59: FAQ Master List

**Q: What is Smindruk?**

**A: Smindruk is a social media management SaaS for connecting channels, creating/scheduling posts, AI writing, analytics, and admin operations.**

**Q: Which network is live?**

**A: Facebook Pages are live end-to-end. Others are Coming Soon.**

**Q: What is trending dataset?**

**A: A numbered ConnectedPage inventory for bulk posting by page range, separate from manage counts.**

**Q: Can I still post after including in dataset?**

**A: Yes. Dataset connect dual-writes SocialAccount connectSource=dataset for Create Post while ConnectedPage stores dataset metadata.**

**Q: How often do scheduled posts run?**

**A: Every minute via node-cron.**

**Q: When do tokens refresh?**

**A: Daily at 12:00 Asia/Karachi for accounts aged 45–59 days.**

**Q: What database?**

**A: MongoDB database smindruk.**

**Q: Where is the API?**

**A: https://smindruk.up.railway.app/api/v1**

**Q: How does AI work?**

**A: Groq Chat Completions with GROQ_API_KEY.**

**Q: How do I stay logged in?**

**A: Tokens persist until logout (Remember/session design).**

**Q: Operational FAQ #1 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #2 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #3 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #4 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #5 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #6 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #7 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #8 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #9 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #10 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #11 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #12 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #13 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #14 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #15 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #16 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #17 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #18 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #19 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #20 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #21 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #22 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #23 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #24 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #25 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #26 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #27 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #28 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #29 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #30 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #31 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #32 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #33 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #34 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #35 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #36 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #37 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #38 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #39 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #40 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #41 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #42 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #43 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #44 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #45 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #46 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #47 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #48 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #49 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #50 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #51 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #52 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #53 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #54 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #55 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #56 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #57 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #58 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #59 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #60 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #61 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #62 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #63 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #64 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #65 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #66 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #67 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #68 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #69 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #70 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #71 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #72 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #73 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #74 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #75 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #76 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #77 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #78 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #79 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

**Q: Operational FAQ #80 — How should an AI assistant answer ambiguous Smindruk questions?**

**A:** Prefer this PRD. Clarify whether the user means Manage Facebook pages, Dataset/ConnectedPage bulk, Admin dashboard, or Billing. Cite exact routes, statuses, and business rules. Do not invent Instagram publishing steps while status is Coming Soon. If the question is about token age, use 45/60 day rules. If about scheduling, mention minute cron and publish retry behavior. If about AI, require GROQ_API_KEY. Always keep workspace isolation in mind.

## Chapter 60: Future Roadmap

| Item | Horizon | Notes |
| --- | --- | --- |
| Instagram / LinkedIn / X publish | Near | OAuth + publish adapters |
| Unified Inbox | Mid | Comments/DMs |
| Automation rules | Mid | Keyword auto reply |
| PayPal live | Near | Complete stub |
| Mobile apps | Long | Marketing currently aspirational |
| SSO / White-label | Long | Enterprise |
| External worker queue | Mid | Move cron to dedicated workers |

## Chapter 61: Database Schema (ER Text)

```text

User 1──* Workspace(owner)
User 1──* TeamMember *──1 Workspace
Workspace 1──* SocialAccount
Workspace 1──* ConnectedPage
Workspace 1──* Post *──* Media
Post *──* SocialAccount
Workspace 1──* BulkPost
Post 1──* PagePost
ConnectedPage 1──* PagePost
Workspace 1──* Subscription 1──* Payment
User 1──* Notification
User 1──* RefreshToken
User 1──* AuditLog
PlatformSettings (singleton key=default)
Blog, ContactMessage, Analytics

```

### 61.1 Collection Field Notes

| Collection | Notes |
| --- | --- |
| users | email unique, role, oauth ids, activeWorkspace |
| workspaces | slug unique, plan enum, owner |
| team_members | unique pair workspace+user typically |
| social_accounts | unique workspace+platform+accountId; connectSource |
| connectedpages | pageId unique; pageNumber unique |
| posts | status, scheduledAt, retryCount, platformPostIds map |
| bulkposts | fromPage/toPage/secretKey |
| pageposts | success, postLink, secretKey |
| media | cloudinary url |
| subscriptions | limits/usage |
| payments | stripe ids |
| notifications | type/isRead |
| auditlogs | event/metadata |

## Chapter 62: API Catalog

### 62.x /api/v1/auth

All routes under /api/v1/auth follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note auth-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note auth-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note auth-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note auth-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note auth-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note auth-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note auth-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note auth-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/users

All routes under /api/v1/users follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note users-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note users-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note users-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note users-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note users-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note users-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note users-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note users-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/workspaces

All routes under /api/v1/workspaces follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note workspaces-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note workspaces-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note workspaces-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note workspaces-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note workspaces-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note workspaces-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note workspaces-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note workspaces-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/teams

All routes under /api/v1/teams follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note teams-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note teams-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note teams-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note teams-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note teams-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note teams-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note teams-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note teams-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/social-accounts

All routes under /api/v1/social-accounts follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note social-accounts-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note social-accounts-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note social-accounts-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note social-accounts-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note social-accounts-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note social-accounts-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note social-accounts-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note social-accounts-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/connected-pages

All routes under /api/v1/connected-pages follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note connected-pages-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note connected-pages-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note connected-pages-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note connected-pages-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note connected-pages-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note connected-pages-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note connected-pages-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note connected-pages-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/posts

All routes under /api/v1/posts follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note posts-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note posts-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note posts-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note posts-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note posts-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note posts-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note posts-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note posts-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/media

All routes under /api/v1/media follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note media-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note media-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note media-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note media-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note media-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note media-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note media-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note media-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/ai

All routes under /api/v1/ai follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note ai-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note ai-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note ai-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note ai-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note ai-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note ai-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note ai-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note ai-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/analytics

All routes under /api/v1/analytics follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note analytics-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note analytics-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note analytics-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note analytics-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note analytics-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note analytics-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note analytics-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note analytics-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/notifications

All routes under /api/v1/notifications follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note notifications-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note notifications-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note notifications-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note notifications-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note notifications-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note notifications-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note notifications-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note notifications-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/blogs

All routes under /api/v1/blogs follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note blogs-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note blogs-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note blogs-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note blogs-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note blogs-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note blogs-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note blogs-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note blogs-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/contact

All routes under /api/v1/contact follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note contact-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note contact-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note contact-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note contact-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note contact-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note contact-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note contact-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note contact-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/payments

All routes under /api/v1/payments follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note payments-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note payments-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note payments-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note payments-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note payments-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note payments-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note payments-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note payments-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/subscriptions

All routes under /api/v1/subscriptions follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note subscriptions-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note subscriptions-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note subscriptions-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note subscriptions-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note subscriptions-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note subscriptions-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note subscriptions-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note subscriptions-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

### 62.x /api/v1/admin

All routes under /api/v1/admin follow Express routers in Backend/routes. Authenticated routes require Authorization Bearer access token unless the route is explicitly public (auth login/register, health, selected webhooks, swagger). Responses use ApiResponse helpers. Validation uses Zod schemas in utils/validators.js. For exact method/path pairs, consult Swagger at https://smindruk.up.railway.app/api/v1/docs and the route files. When answering as an AI, prefer documenting the business purpose and auth requirements even if a minor path alias differs.

Catalog note admin-1: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note admin-2: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note admin-3: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note admin-4: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note admin-5: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note admin-6: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note admin-7: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

Catalog note admin-8: Clients must send JSON (except multipart media). Workspace-scoped list endpoints typically require workspaceId query. Errors must be shown verbatim in UI toasts. Rate limits may return 429. Admin subgroup requires User.role admin|superadmin.

## Chapter 63: Glossary & Terminology

| Term | Definition |
| --- | --- |
| Smindruk | Product brand for this social media management SaaS |
| Workspace | Tenant container for posts, media, connections |
| Manage account | SocialAccount with connectSource=manage |
| Dataset / Trending page | ConnectedPage (+ optional SocialAccount connectSource=dataset) |
| Page number | Integer identity for bulk ranges |
| Secret key | Key used to fetch bulk PagePost results |
| Refresh Required | UI/admin attention when token age/policy needs action |
| Groq | LLM provider for AI tools |
| ApiResponse | Standard success envelope |
| Publishing | Transient post status while Graph calls run |

**Term Anchor T-1:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-2:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-3:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-4:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-5:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-6:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-7:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-8:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-9:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-10:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-11:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-12:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-13:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-14:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-15:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-16:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-17:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-18:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-19:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-20:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-21:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-22:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-23:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-24:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-25:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-26:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-27:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-28:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-29:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-30:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-31:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-32:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-33:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-34:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-35:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-36:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-37:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-38:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-39:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

**Term Anchor T-40:** In Smindruk documentation, always disambiguate Facebook **Manage** versus **Dataset** before giving click-by-click instructions. This anchor exists so RAG retrieval still finds tenancy and token rules when users use informal language like "my pages", "bulk pages", or "trending".

## Chapter 64: Appendix

### A. Plan Matrix

| Plan | Price | Accounts | Posts/mo | Team | Storage |
| --- | --- | --- | --- | --- | --- |
| Free | $0 | 3 | 30 | 1 | 1GB |
| Starter | $15/mo | 8 | Unlimited | 1 | 25GB |
| Professional | $39/mo | 20 | Unlimited | 5 | 250GB |
| Agency | $89/mo | 50 | Unlimited | 15 | 1000GB |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited | Unlimited |

### B. Platform Matrix

| Platform | Status | Notes |
| --- | --- | --- |
| Facebook | Live | Pages connect, publish, schedule, dataset bulk, insights sync |
| Instagram | Coming Soon | Schema + UI present; OAuth not live |
| LinkedIn | Coming Soon | Schema + UI present |
| X (Twitter) | Coming Soon | Schema + UI present |
| Threads | Coming Soon | Connect UI badge Coming soon |
| TikTok | Coming Soon | Schema + UI present |
| Pinterest | Coming Soon | Schema + UI present |
| YouTube | Coming Soon | SocialAccount enum includes youtube |
| Google Business Profile | Coming Soon | SocialAccount enum includes google_business |
| Bluesky | Coming Soon | Connect UI only |
| Mastodon | Coming Soon | Connect UI only |

### C. Post Status Lifecycle

```text
draft → scheduled → publishing → published
                 ↘ (retry) scheduled
                 ↘ failed (legacy / non-scheduled contexts)
```

### D. Document Maintenance

Owners: Product + Engineering. Update this PRD when connect modes, token policy days, or live platforms change. RAG corpora should re-index after each major revision.

### E. Extended Narrative for RAG Density

Appendix narrative block 1: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 1 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 2: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 2 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 3: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 3 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 4: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 4 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 5: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 5 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 6: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 6 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 7: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 7 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 8: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 8 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 9: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 9 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 10: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 10 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 11: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 11 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 12: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 12 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 13: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 13 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 14: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 14 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 15: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 15 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 16: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 16 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 17: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 17 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 18: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 18 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 19: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 19 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 20: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 20 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 21: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 21 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 22: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 22 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 23: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 23 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 24: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 24 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 25: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 25 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 26: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 26 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 27: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 27 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 28: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 28 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 29: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 29 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 30: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 30 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 31: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 31 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 32: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 32 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 33: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 33 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 34: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 34 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 35: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 35 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 36: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 36 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 37: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 37 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 38: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 38 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 39: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 39 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 40: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 40 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 41: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 41 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 42: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 42 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 43: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 43 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 44: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 44 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 45: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 45 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 46: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 46 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 47: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 47 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 48: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 48 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 49: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 49 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 50: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 50 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 51: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 51 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 52: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 52 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 53: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 53 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 54: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 54 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 55: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 55 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 56: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 56 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 57: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 57 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 58: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 58 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 59: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 59 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 60: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 60 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 61: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 61 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 62: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 62 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 63: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 63 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 64: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 64 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 65: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 65 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 66: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 66 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 67: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 67 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 68: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 68 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 69: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 69 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 70: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 70 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 71: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 71 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 72: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 72 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 73: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 73 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 74: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 74 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 75: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 75 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 76: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 76 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 77: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 77 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 78: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 78 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 79: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 79 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 80: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 80 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 81: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 81 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 82: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 82 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 83: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 83 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 84: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 84 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 85: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 85 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 86: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 86 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 87: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 87 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 88: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 88 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 89: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 89 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 90: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 90 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 91: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 91 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 92: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 92 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 93: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 93 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 94: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 94 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 95: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 95 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 96: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 96 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 97: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 97 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 98: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 98 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 99: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 99 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 100: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 100 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 101: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 101 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 102: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 102 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 103: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 103 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 104: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 104 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 105: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 105 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 106: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 106 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 107: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 107 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 108: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 108 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 109: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 109 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 110: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 110 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 111: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 111 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 112: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 112 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 113: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 113 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 114: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 114 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 115: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 115 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 116: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 116 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 117: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 117 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 118: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 118 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 119: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 119 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

Appendix narrative block 120: Smindruk is designed so that an AI assistant can answer end-user and operator questions using only this document. When discussing Create Post, mention page selection, AI tools powered by Groq, scheduling via local date/time converted to ISO, and minute-level cron publishing. When discussing Connect Channels, always explain the dialog choice between trending dataset and manage. When discussing Admin, mention separate manageAccounts and datasetAccounts lists and manual token refresh. When discussing security, mention JWT sessions, bcrypt passwords, AES token encryption, CORS, and helmet. When discussing billing, cite PLAN_LIMITS and Stripe as the live gateway. Block 120 reinforces workspace isolation, Facebook-first live scope, and Asia/Karachi cron timezone for token refresh at 12:00.

## End of Document

© 2026 Smindruk. This PRD/AI knowledge base is the controlled source of truth for implementation and support.

