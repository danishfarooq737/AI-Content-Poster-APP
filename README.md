# ViralPost — Auto-Clipping & Multi-Platform Scheduler

A full-stack MERN application that turns a long-form video link into short, AI-clipped viral videos
(via Vizard.ai), automatically writes platform-specific titles/captions/hashtags/tags for each one with
AI, and schedules them for posting to TikTok, YouTube and Instagram from one dashboard.

---

## 1. Project Overview

ViralPost lets a creator or marketing team:
1. Paste a link to a long-form video (a YouTube video, webinar, podcast recording) in **Clip Studio**.
2. Vizard.ai automatically finds and cuts the best short, vertical clips from it — real hosted video
   files with real URLs.
3. As soon as each clip is ready, AI automatically writes the posting content for it — **differently per
   platform, with no manual typing required**: TikTok and Instagram get a title + viral hashtags as a
   single caption; YouTube gets a title, a description, and a real `tags` array. All of this is editable
   afterward in the Library if you want to tweak it, but nothing is required.
4. Connect TikTok / YouTube / Instagram accounts via OAuth.
5. Schedule content to be auto-published at a chosen time; a background scheduler posts it when due,
   using the correct platform-specific content automatically.
6. (Admin) Manage users and view platform-wide stats.

**Honest scope note:** actually *rendering* a video from scratch (pure AI generation from a text prompt,
with no source video) requires a paid generative video model (Runway, Pika, HeyGen, Sora API, etc.) that
no one can embed for free — this app deliberately doesn't include a fake placeholder for that anymore.
Instead, the fully working path is **Clip Studio**: point it at a video you already have a link to, and
everything from clipping to captioning to posting is real and automatic. See **Known External
Requirements** below for the API keys this needs.

---

## 2. Features

- Email/password auth with JWT access + refresh tokens (httpOnly refresh cookie), account lockout after
  repeated failed logins, first-registered-user-becomes-admin.
- Role-based authorization (`admin` / `user`) enforced server-side on every protected route.
- **Clip Studio:** paste a link to a long-form video and Vizard.ai clips it into short, vertical,
  ready-to-post videos automatically — with real hosted video URLs the posting pipeline can actually use.
  A background job polls Vizard every minute and drops finished clips straight into your Library.
- **Automatic, platform-specific captioning:** the moment a clip is ready, AI (Anthropic) writes its
  posting content — no manual typing needed. TikTok and Instagram get a single caption (title + viral
  hashtags); YouTube gets a title, a description, and a real `tags` array (both populated). Every
  platform is genuinely handled differently, matching how each one actually expects content. All of it
  remains editable afterward in the Library if you want to override the AI's output.
- Content library: edit (per-platform captions), delete, filter by status — with strict ownership checks
  (no IDOR).
- OAuth "connect account" flow for TikTok (with PKCE, as TikTok's v2 OAuth requires), YouTube (Google)
  and Instagram (Meta Graph API), with tokens encrypted at rest (AES-256-GCM).
- Scheduling engine: pick a connected account + time; a cron job posts due content automatically and
  retries on failure (up to 3 attempts) with clear error surfacing.
- Admin panel: user list, role toggling, activate/deactivate, delete, platform-wide stats.
- Dashboard with live counts and an "up next" queue.
- Fully responsive UI (mobile drawer nav, adaptive grids, no horizontal scroll) with 4 purposeful
  animations: page/section entrance, staggered card/list entrance, modal transition, and hover/press
  micro-interactions — all respecting `prefers-reduced-motion`.
- Security: helmet, strict CORS, rate limiting (general + auth + AI-specific), mongo-sanitize, xss-clean,
  hpp, bcrypt password hashing, generic auth error messages (no user enumeration), audit logging.

---

## 3. Technologies

**Backend:** Node.js, Express, MongoDB/Mongoose, JWT, bcryptjs, node-cron, winston, Jest + Supertest.
**Frontend:** React 18, Vite, React Router, Tailwind CSS, Framer Motion, Zustand, React Hook Form,
Axios, Recharts, Lucide icons, react-hot-toast.

---

## 4. Folder Structure

```
ViralPost/
├── backend/
│   ├── config/          # DB connection
│   ├── controllers/     # Route handlers (auth, content, platform, schedule, user, dashboard)
│   ├── middleware/       # Auth, error handling, rate limiting, validation
│   ├── models/           # Mongoose schemas (User, Content, Platform, Schedule, AuditLog)
│   ├── routes/            # Express routers
│   ├── services/          # AI service, platform OAuth adapters, encryption, scheduler
│   │   └── platforms/      # TikTok / YouTube / Instagram adapters
│   ├── utils/              # Logger, token helpers, API response helpers
│   ├── validators/          # express-validator chains
│   ├── seeds/                # Database seed script
│   ├── tests/                 # Jest test suites
│   ├── app.js / server.js
│   └── package.json
├── frontend/
│   └── src/
│       ├── components/    # Reusable UI (Modal, StatCard, StatusBadge, EmptyState, etc.)
│       ├── pages/          # Route-level pages
│       ├── layouts/         # AuthLayout, AppLayout (sidebar/mobile nav)
│       ├── hooks/            # useAuthBootstrap
│       ├── services/          # Axios API client + per-resource service modules
│       └── store/               # Zustand auth store
├── .env / .env.example
├── .gitignore
└── README.md
```

---

## 5. Installation

Requires Node.js 18+ and a running MongoDB instance (local or Atlas).

```bash
# 1. Clone/extract the project, then from the project root:
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Fill in AI_API_KEY in backend/.env at minimum (see below). OAuth/Vizard keys are optional.

# 2. Backend
cd backend
npm install

# 3. Frontend (separate terminal)
cd frontend
npm install
```

---

## 6. Environment Variables

Backend and frontend each have their own `.env` (this is intentional — they're separately runnable and
separately deployable, and Vite specifically expects its env file inside `frontend/`, not at the repo root):

- **`backend/.env`** — all server config, secrets, and API keys. See `backend/.env.example` for the full
  list with comments. Minimum required to boot the backend: `MONGODB_URI`, `JWT_SECRET`,
  `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`. The shipped `backend/.env` already has freshly-generated random
  values for the JWT/encryption secrets so it runs out of the box in development — only `AI_API_KEY`
  (and optionally Vizard/OAuth credentials) are left blank for you to fill in.
- **`frontend/.env`** — only two optional variables. `VITE_API_PROXY_TARGET` controls where the Vite dev
  server proxies `/api` requests (defaults to `http://localhost:5000`, matching the backend's default
  port — you won't usually need to touch this). `VITE_API_BASE_URL` is only needed if you deploy the
  frontend and backend to two different domains with no reverse proxy between them (see § 12); leave it
  blank for local dev and for the Docker Compose setup, both of which already route `/api` to the backend
  for you.

---

## 7. Database Setup

```bash
# Local MongoDB (macOS example)
brew install mongodb-community
brew services start mongodb-community
# MONGODB_URI=mongodb://127.0.0.1:27017/viralpost (already the default in .env)
```

Or use a free MongoDB Atlas cluster and paste its connection string into `MONGODB_URI`.

The app fails gracefully with a clear log message (not a crash) if the database is unreachable at
startup — see `backend/server.js`.

---

## 8. Seed Data

```bash
cd backend
npm run seed          # clears and re-seeds: 3 users, 1 connected account, 3 content items, 1 schedule
npm run seed:clear    # clears collections only, no new data
```

Seeded login credentials (development only — not real accounts):

| Role    | Email                   | Password       |
|---------|--------------------------|----------------|
| Admin   | admin@viralpost.dev      | AdminPass123   |
| Creator | creator@viralpost.dev    | CreatorPass123 |
| User    | sam@viralpost.dev        | SamPass123     |

---

## 9. Development

```bash
# Terminal 1 - backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 - frontend (http://localhost:5173)
cd frontend && npm run dev
```

Open http://localhost:5173 and log in with a seeded account.

---

## 10. Testing

```bash
cd backend
npm test
```

Test suites cover: registration/login/logout, invalid credentials, protected-route auth, password
hashing, IDOR/ownership protection on content CRUD, role-based authorization (admin-only routes,
self-modification prevention), Mongoose model validation/unique constraints, the Vizard clip-job
endpoints (auth, validation, unconfigured-provider handling), and the per-platform publish-payload
builder that decides what content each platform actually receives (pure-function tests, no DB needed —
these were verified directly in this environment; see the note below for the DB-backed suites). Tests
run against an in-memory MongoDB instance (`mongodb-memory-server`), which downloads a MongoDB binary on
first run — **this requires outbound internet access to `fastdl.mongodb.org`**. If your environment
blocks that (as the sandbox used to build this project did), point `MONGOMS_DOWNLOAD_MIRROR` at an
internal mirror, or run the tests against a real local/Docker MongoDB instance instead.

> **NOT VERIFIED IN THIS ENVIRONMENT:** the live `npm test` run. The sandbox used to build this project
> blocks the MongoDB binary download that `mongodb-memory-server` needs, so the suite could not be
> executed here. What *was* verified here: every backend file passes `node --check` (no syntax errors),
> the Express app module loads cleanly, and the server's graceful-DB-failure path was exercised live.
> Please run `npm test` after `npm install` on a machine with normal internet access (or a local
> MongoDB) to get a real pass/fail result — the suite is real, non-trivial code, not a stub.

---

## 11. Production Build

```bash
cd frontend
npm run build     # outputs to frontend/dist — VERIFIED: builds successfully, 7s, no errors
npm run preview   # serve the production build locally to sanity-check it
```

```bash
cd backend
NODE_ENV=production npm start
```

---

## 12. Deployment

### Option A — Docker Compose (fastest way to get a live, publicly-reachable stack)

```bash
cp backend/.env.example backend/.env   # fill in at least AI_API_KEY; add others as you register them
docker compose up --build
```

This runs MongoDB + backend + frontend (served by nginx, reverse-proxying `/api` to the backend) together.
Frontend: http://localhost:8080 · Backend API: http://localhost:5000/api. Deploy this same compose file to
any Docker-capable host (a VPS, Render, Railway, DigitalOcean App Platform, etc.) and point a domain +
HTTPS certificate at port 8080 — that HTTPS domain is what you'll register as your OAuth redirect base
with TikTok/Google/Meta (see § 13; they require HTTPS, not `localhost`, for anything beyond your own
testing).

### Option B — Deploy backend and frontend separately

- **Backend:** deploy `backend/` to any Node host (Render, Railway, Fly.io, EC2, etc.). Set all
  variables from `.env.example` in the host's environment/secrets manager — do not upload `.env`.
  Set `CORS_ORIGIN` to your deployed frontend's URL.
- **Frontend:** run `npm run build` and deploy the static `frontend/dist` folder (Vercel, Netlify,
  S3+CloudFront, etc.). Point its API calls at your deployed backend by adjusting the dev proxy target
  or adding a reverse proxy in front of both.
- **Database:** use MongoDB Atlas (or any managed MongoDB) in production; update `MONGODB_URI`.
- Each OAuth provider requires its **redirect URI** to be updated to your production domain in that
  provider's developer console (TikTok/Google/Meta), matching `*_REDIRECT_URI` in `.env`.

---

## 13. Known External Requirements

These genuinely cannot be completed inside the codebase — they require your own accounts/approval.
Note: `/privacy` and `/terms` pages are already built and live in the app (linked from the login/register
screens) — every platform below will ask for these URLs during app review, so fill in the bracketed
placeholders in `frontend/src/pages/PrivacyPolicyPage.jsx` and `TermsOfServicePage.jsx` with your real
company/contact info before submitting.

### REQUIRED MANUAL STEPS

**1. Anthropic API key (required so clips get auto-generated captions/hashtags/tags)**
- Where: https://console.anthropic.com → Settings → API Keys
- What to do: create a key
- File to edit: `backend/.env` → set `AI_API_KEY=sk-ant-...`
- Verify: use Clip Studio to clip any video — once a clip is ready, open it in the Library and you should
  see a real, written title/caption/hashtags (TikTok/Instagram) and title/description/tags (YouTube)
  already filled in, not empty fields.

**2. Vizard.ai API key (required for the "Clip Studio" feature — turns a video link into short clips)**
- Where: https://vizard.ai → sign up → find the API/developer settings in your account dashboard
- What to do: generate an API key
- File to edit: `backend/.env` → set `VIZARD_API_KEY=...`
- Verify: log in, go to Clip Studio, paste a public video URL, click "Clip it" — within a few minutes a
  ready clip with a real, playable video URL should appear in your Library.
- **Note on this integration:** it was built from general knowledge of Vizard's API shape without live
  access to their current docs to verify field names exactly. If the first request errors, check the
  backend logs (`backend/services/vizardService.js` logs Vizard's raw response) and compare against the
  API docs linked from your Vizard account — mismatched field names are the most likely issue, and are a
  small, isolated fix in that one file.

**3. TikTok OAuth app (required only if you want to connect/post to TikTok)**
- Where: https://developers.tiktok.com → create an app, request `user.info.basic`, `video.publish`,
  `video.upload` scopes (video publishing requires TikTok's Content Posting API approval — this can
  take days and is TikTok's decision, not something any code can bypass)
- File to edit: `backend/.env` → `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`
  (must exactly match the redirect URI registered in the TikTok developer console)
- **PKCE is already implemented** (`code_challenge`/`code_verifier`) — this app generates it
  automatically on every connect attempt, which is what TikTok's v2 OAuth requires. If you previously
  saw a "code_challenge" error, that's fixed by this app's code, not something you need to configure.
- **Before App Review approval**, only your own developer account or accounts you've added as testers
  can complete the connect flow — see "Target Users"/"Testers" in your app's dashboard.
- Verify: go to Connected Accounts → Connect TikTok → complete the OAuth screen → account appears
  as "connected".

**4. Google/YouTube OAuth app (required only if you want to connect/post to YouTube)**

If you're seeing **"Error 400: redirect_uri_mismatch"**, this means the redirect URL your app is sending
doesn't exactly match what's registered in your Google Cloud project — Google is (correctly) refusing to
redirect anywhere it doesn't recognize. Fix:
- Go to https://console.cloud.google.com → select your project → **APIs & Services → Credentials**
- Click your OAuth 2.0 Client ID (the one whose ID/secret are in `backend/.env` as `GOOGLE_CLIENT_ID`/
  `GOOGLE_CLIENT_SECRET`)
- Under **Authorized redirect URIs**, click **+ Add URI** and paste the *exact* value of
  `GOOGLE_REDIRECT_URI` from `backend/.env` — for local dev that's typically
  `http://localhost:5000/api/platforms/youtube/callback`. It must match character-for-character:
  same scheme (`http` vs `https`), same port, no trailing slash unless your `.env` value has one.
- Click **Save**, wait about a minute for it to propagate, then try Connect YouTube again.
- If you later deploy the backend to a real domain, add that domain's callback URL here too (you can
  have multiple redirect URIs registered at once, so localhost and production can coexist).
- Where: https://console.cloud.google.com → APIs & Services → Credentials → OAuth client ID (Web
  application) → enable the "YouTube Data API v3"
- File to edit: `backend/.env` → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- Note: while your OAuth consent screen is in "Testing" mode, only test users you explicitly add in
  the Google Cloud console can connect. Publishing to production requires Google's verification.
- Verify: Connected Accounts → Connect YouTube → complete the consent screen → account appears connected.

**5. Meta/Instagram app (required only if you want to connect/post to Instagram)**
- Where: https://developers.facebook.com → create an app → add "Instagram Graph API" → request
  `instagram_content_publish` (requires Meta App Review for any account beyond your own test accounts)
- File to edit: `backend/.env` → `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI`
- Verify: Connected Accounts → Connect Instagram.

---

## 14. Known Limitations

- There's no path to generate a video from scratch (text-to-video) — only clipping an existing video you
  already have a link to, via Vizard.ai. This is intentional, not an oversight (see § 1).
- Posting to each platform requires that platform's app-review approval for scopes beyond your own
  test account; this is each platform's process and timeline, not something this codebase controls.
- TikTok's `PULL_FROM_URL` publishing may require the video's source domain to be verified in your
  TikTok app dashboard, depending on TikTok's current requirements — see the comment in
  `backend/services/platforms/tiktokService.js` if a publish attempt fails with a domain-related error.
- The live backend Jest suite could not be executed inside the sandbox this project was built in
  (MongoDB binary download blocked by network policy) — the underlying logic (including the new
  per-platform payload builder) was verified directly with real assertions instead; see section 10 for
  details and how to run the real suite yourself (it will also run automatically via GitHub Actions CI
  once pushed - see `.github/workflows/ci.yml`).
