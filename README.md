# Smindruk Backend (SocialFlow API)

REST API backend for **Smindruk**, a Social Media Management SaaS. Built with
Node.js, Express.js, and MongoDB (Mongoose). See
[`docs/BRS.md`](./docs/BRS.md) for the full Backend Requirements
Specification.

## Tech Stack

Node.js · Express.js · MongoDB Atlas · Mongoose · JWT · Passport (Google /
GitHub / Facebook OAuth) · node-cron · Multer · Cloudinary · OpenAI API ·
Nodemailer · Zod · Morgan · Winston · Swagger · Helmet · CORS · bcrypt ·
express-rate-limit · Stripe / PayPal

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
copy .env.example .env
```

Then open `.env` and fill in your real values (MongoDB Atlas connection
string, JWT secrets, OAuth app credentials, Cloudinary, OpenAI, email SMTP,
Stripe/PayPal keys). **Never commit `.env`.**

### 3. Run the server

```bash
npm run dev     # nodemon, auto-restarts on changes
npm start       # plain node
```

The API will be available at `http://localhost:5000` (or your configured
`PORT`), and interactive Swagger docs at `http://localhost:5000/api/v1/docs`.

## Folder Structure

```text
smindruk-backend/
├── index.js              # Entry point: Express app + server bootstrap
├── config/                 # db.js (MongoDB), passport.js (OAuth), swagger.js
├── routes/                 # One Express router per module
├── controller/              # Route handlers / business logic
├── models/                  # Mongoose schemas (14 collections)
├── middleware/               # auth, error, rate-limit, validation, upload
├── utils/                    # apiResponse, apiError, asyncHandler, jwt,
│                             # email, cloudinary, openai, logger, validators,
│                             # scheduler (node-cron)
├── media/uploads/              # Temp local storage before Cloudinary push
├── logs/                        # Winston log files
├── docs/BRS.md                   # Backend Requirements Specification
├── .env.example
└── package.json
```

## API Overview

All endpoints are versioned under `/api/v1`. Key modules:

* `/auth` — register, login, logout, refresh, forgot/reset password, verify
  email, Google/GitHub/Facebook OAuth
* `/users` — profile, avatar, password, account deletion
* `/workspaces` — create/update/delete, switch, invite members
* `/teams` — team member management + role-based permissions
* `/social-accounts` — connect/disconnect/sync social platforms
* `/posts` — create/edit/delete/duplicate posts, publish now, scheduling
* `/media` — upload/list/delete media (Cloudinary-backed)
* `/ai` — caption, hashtags, rewrite, translate, content ideas, CTA
* `/analytics` — record + report on engagement metrics
* `/notifications` — in-app notification feed
* `/blogs` — public blog listing + admin CRUD
* `/contact` — contact form, newsletter, support requests
* `/payments` — Stripe checkout + webhooks, payment history
* `/subscriptions` — plan upgrade/downgrade, usage limits
* `/admin` — user/post/payment/blog management, platform logs & settings

Full request/response contracts are documented via Swagger at
`/api/v1/docs`, generated from JSDoc comments (add `@swagger` blocks to
route files as the API evolves).

## Notes

* The post **scheduler** runs automatically every minute via `node-cron`
  (started in `index.js`). You can also trigger it manually via
  `POST /api/v1/posts/run-scheduler` for testing.
* Real social-platform publishing calls (Facebook, Instagram, LinkedIn, X,
  TikTok, Pinterest) are marked `TODO` in `controller/post.controller.js`
  and `utils/scheduler.js` — wire in each platform's API once you have
  approved developer app credentials.
* AI endpoints return a clearly-labelled mock response if `OPENAI_API_KEY`
  is not set, so the rest of the app remains testable without a paid key.
