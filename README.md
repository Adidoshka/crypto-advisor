# CoinSage

![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/typescript-5%2F6-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/express-4.19-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Tests](https://img.shields.io/badge/tests-20%20passing-brightgreen)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)
![Deployed](https://img.shields.io/badge/status-deployed-success)

## 🎯 Overview

A personalized crypto investor dashboard, built for the Moveo "AI Crypto Advisor" coding assignment. Users register, complete a short onboarding quiz, and get a daily dashboard aggregating coin prices, market news, an AI-generated insight, and a meme — every section has upvote/downvote feedback, persisted for future model training. The system includes:

- **React frontend** — 4-page flow (Login/Register/Onboarding/Dashboard), deployed on Vercel
- **Express backend** — repository-pattern data layer over Mongoose, deployed on Render
- **MongoDB Atlas** — Users, Preferences (enum-validated), Votes (upsert-by-key)
- **Three live external integrations** — CoinGecko (prices), free public RSS feeds (news), NVIDIA NIM (AI insight) — each with an independent, non-throwing fallback
- **Vitest test suite** — 20 tests across schema validation, repository regression guards, and route integration/logic
- **CI pipeline** — build + test on every push/PR via GitHub Actions

**Live app:** <https://coinsage-adidoshka.vercel.app>
**Backend health check:** <https://crypto-advisor-rcsb.onrender.com/api/health>

> The backend is on Render's free tier and spins down after 15 minutes idle — the first request after a while can take 30-50s to wake up.

See [CLAUDE.md](CLAUDE.md) for the full file-by-file architecture walkthrough and the conventions behind it — this README stays high-level.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- A MongoDB Atlas connection string (free tier)

### Setup & Run

1. **Backend**:

   ```bash
   cd backend
   npm install
   cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET at minimum
   npm run dev             # http://localhost:4000
   ```

2. **Frontend** (new terminal):

   ```bash
   cd frontend
   npm install
   npm run dev              # http://localhost:5173, proxies /api -> localhost:4000
   ```

3. **Run the tests**:

   ```bash
   cd backend
   npm test                 # Vitest, 20 tests, in-memory Mongo for DB-touching tests — no real DB needed
   ```

## 📐 Architecture

```text
┌──────────────┐         ┌──────────────────┐         ┌────────────────────┐
│   Browser    │────────▶│     Frontend      │────────▶│      Backend       │
│              │         │  React + Vite     │  /api   │  Express + JWT     │
│              │         │    (Vercel)       │         │    (Render)        │
└──────────────┘         └──────────────────┘         └──────────┬─────────┘
                                                                  │
                          ┌────────────────────┬──────────────────┼──────────────────┐
                          ▼                     ▼                  ▼                   
                 ┌────────────────┐  ┌────────────────────┐  ┌────────────────┐  ┌────────────────┐
                 │   CoinGecko     │  │     RSS feeds       │  │  NVIDIA NIM     │  │  MongoDB Atlas  │
                 │ (coin prices,   │  │ CoinDesk/Cointele-  │  │  (AI insight,   │  │  Users /        │
                 │  no key)        │  │ graph/Decrypt       │  │  free tier)     │  │  Preferences /  │
                 └────────────────┘  └────────────────────┘  └────────────────┘  │  Votes          │
                                                                                    └────────────────┘
```

Every external call (prices, news, AI insight) has a timeout and a non-throwing fallback — the dashboard endpoint never 500s because of a third-party outage.

## 📁 Project Structure

```text
crypto-advisor/
├── backend/
│   ├── src/
│   │   ├── app.ts             # Express app: helmet, CORS, rate limiting, routes (no side effects — testable)
│   │   ├── index.ts           # Boot: JWT_SECRET fail-fast, connectDB(), listen()
│   │   ├── config/db.ts       # Mongoose connect/ping
│   │   ├── models/            # User, Preference (enum-validated), Vote (upsert-by-key)
│   │   ├── repositories/      # BaseRepository + per-model repos + getRepos() provider
│   │   ├── middleware/        # auth.ts (Bearer-JWT), asyncHandler.ts
│   │   └── routes/            # auth, preferences, dashboard, votes
│   └── tests/                 # Vitest suite, mirrors src/ (models/, repositories/, routes/)
│
├── frontend/
│   ├── src/
│   │   ├── pages/              # Login, Register, Onboarding, Dashboard
│   │   ├── components/         # Logo, icons, SentimentCard, AuthLayout, FormField (shared across pages)
│   │   ├── context/          # AuthContext.ts, AuthProvider.tsx, useAuth.ts
│   │   └── services/api.ts
│   └── tests/                 # empty placeholder — no frontend test suite yet
│
└── .github/workflows/ci.yml
```

## 🔧 Components

**Backend** — thin route handlers delegate all persistence to a repository layer (`repositories/`) rather than touching Mongoose Models directly. `BaseRepository<T>` wraps `create`/`findOne`/`find`/`upsert` (always with `runValidators: true`); `UserRepository`/`PreferenceRepository`/`VoteRepository` add domain-specific queries. A centralized error-handling middleware and `express-rate-limit` on `/api/auth` round out the hardening.

**Frontend** — no state library; auth state (JWT + name) lives in `AuthContext` and syncs to `localStorage`. Styling is Tailwind v4 utility classes on a custom "CoinSage" theme (`brand-cyan`/`brand-green`/`brand-deep` tokens). `Onboarding` is a 3-step wizard with per-step layouts; `Dashboard` renders four independently-fallback-safe sections with optimistic voting.

## ⚙️ Configuration

| Variable | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Atlas connection string; server exits on connect failure |
| `JWT_SECRET` | Yes | Server fails fast at boot if unset |
| `PORT` | No | Default `4000` |
| `FRONTEND_URL` | No | CORS origin, default `http://localhost:5173` |
| `NVIDIA_API_KEY` | No | Without it, the AI insight falls back to a canned string |
| `NVIDIA_MODEL` | No | Defaults to a working free-tier model; override if it's ever pulled from the catalog |

News has no key to configure — see below.

## 🧪 Testing

20 Vitest tests across 4 files under `backend/tests/` (mirrors `src/`'s folder layout); tests that touch the DB run against an in-memory MongoDB (`mongodb-memory-server`) — no external DB or network required:

| File | Focus |
| --- | --- |
| `tests/models/Preference.test.ts` | Schema enum validation (assets/investorType/contentTypes) |
| `tests/repositories/VoteRepository.test.ts` | Upsert-by-key behavior + a regression guard for a real bug found via live testing (see AI summary below) |
| `tests/routes/auth.test.ts` | Register/login integration tests via `supertest` — password never in response, malformed-email/duplicate-email/short-password rejected, wrong-password 401 |
| `tests/routes/dashboard.test.ts` | Pure unit tests for `pickMeme`'s preference-matching/fallback logic — no DB or network |

CI (`.github/workflows/ci.yml`) runs backend build+test and frontend build+lint on every push/PR to `main`.

## 🗄️ Access to DB

Production data lives in MongoDB Atlas. Rather than sharing the live application's write-access credentials, request access and a scoped **read-only** database user will be created for review purposes (Atlas: Database Access → Add New Database User → read-only role scoped to this cluster).

## 📡 A note on the suggested free APIs

Two of the assignment's suggested integrations had genuinely changed since the brief was written, confirmed by checking their actual current state rather than assuming the brief was still accurate:

- **CryptoPanic** no longer has a free API tier — paid plans start at $50/week, no free option listed. The assignment itself anticipates this ("CryptoPanic API **or static fallback**"), so news is sourced from free public RSS feeds instead, keyword-filtered against the user's selected assets, falling back to a small static list if every feed fails.
- **CoinGecko**'s public endpoint is still genuinely keyless — confirmed by direct testing, not assumed.

## 🤖 AI tool interaction summary

This project was built with **Claude Code** (Sonnet 5) end-to-end, from initial architecture questions through deployment and this final polish pass. A few things worth calling out about how that collaboration actually went, rather than a generic "AI helped write code" statement:

- **The repository-pattern refactor caught a real bug via live testing, not just code review.** After designing a `BaseRepository`/`UserRepository`/`PreferenceRepository`/`VoteRepository` layer, I asked Claude to verify it against a live MongoDB Atlas cluster rather than just trusting the build passing. That live pass caught a genuine bug: `Vote.section`'s enum constraint was silently bypassed on every write, because Mongoose's `runValidators` only checks fields present in the *update* document, not ones supplied only via the upsert filter. It's now fixed, with a regression test verified to actually fail if the bug is reintroduced.
- **Deployment was a real back-and-forth.** Walking through Render + Vercel + Atlas together, Claude caught a pre-existing build-breaking bug (`FormEvent` needed a type-only import) before it would have failed the actual Vercel deploy, by running the exact build command locally first.
- **The CoinSage visual rebrand came from a mockup I provided**, but Claude pushed back on parts of it: a fabricated "94% confidence" AI stat, pre-populated vote counts (hundreds of fake upvotes), and fictional news headlines attributed to real outlet names were all mockup placeholder content — implementing them literally would've meant shipping fake data as real. Those were dropped or replaced with the actual live data.
- **The CryptoPanic pricing change was verified, not assumed** — I pushed back on an initial secondhand claim with a screenshot of CryptoPanic's actual current pricing page, which settled it.
- **Several real bugs were found live in the AI insight feature**: a hardcoded OpenRouter model that had been delisted entirely upstream; `max_tokens` too low for reasoning-style free models, leaving responses empty; and later, after switching to NVIDIA NIM directly for better free-tier terms, a blank-but-present `NVIDIA_MODEL=` env var silently resolving to `''` because `??` doesn't fall back on empty string the way `||` does — caught live, then fixed everywhere else the same pattern appeared, not just the one spot that broke.
- **This README, the CI pipeline, the test suite, and the security hardening (helmet, rate limiting, `trust proxy`, centralized error handling) were added in one final pass**, after asking for the project to be brought up to "industry standard" for a hiring review — which itself found the CI's MongoDB binary caching was pointed at the wrong path and sequenced before `npm ci` (which wipes `node_modules`), verified by actually running it, not by reading the library's docs.

Net effect: Claude Code was used as an active collaborator that verified its own work against a real database and real third-party APIs rather than assuming success, and pushed back on parts of my own instructions when they would have meant shipping something misleading.

## 🎓 Bonus: how vote feedback could train a future model

**What's already captured.** Each vote is `(userId, section, itemId, value, contentSnapshot, timestamps)` — `contentSnapshot` stores the actual content shown at vote time, since prices/news/the AI insight are all live-fetched and never otherwise persisted. Joined against that user's `Preference` doc, each vote becomes a full training example: *given this user's stated interests, and this specific piece of content, did they like it?*

**Proposed pipeline:**

1. **Feature extraction** — `Preference` fields (one-hot/embedded) plus content features (text embeddings for news/insight, asset + price direction for prices, meme id as a popularity signal).
2. **Label** — the vote's `value`, as a binary label or ranking signal.
3. **Model** — a lightweight ranking/re-ranking model (logistic regression or a small gradient-boosted tree) rather than training an LLM from scratch — the goal is *which* candidate items to surface, not generating new content. Slots in before `fetchNews`/`fetchPrices`: fetch a larger candidate pool, re-rank by predicted relevance, then truncate.
4. **Feedback loop** — retrain periodically as votes accumulate; cold-start users fall back to the current preference-only filtering.

**What I'd change if this were actually being built**: `upsertVote` is upsert-by-key today (a second vote overwrites the first), fine for "what does this user currently think" but loses *when* opinions changed. A real training pipeline would likely want an append-only vote-event log alongside the current upsert table.
