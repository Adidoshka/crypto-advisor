# CoinSage

![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/typescript-5%2F6-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/express-4.19-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Tests](https://img.shields.io/badge/tests-19%20passing-brightgreen)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)
![Deployed](https://img.shields.io/badge/status-deployed-success)

## 🎯 Overview

A personalized crypto investor dashboard, built for the Moveo "AI Crypto Advisor" coding assignment. Users register, complete a short onboarding quiz, and get a daily dashboard aggregating coin prices, market news, an AI-generated insight, and a meme — every section has upvote/downvote feedback, persisted for future model training. The system includes:

- **React frontend** — 4-page flow (Login/Register/Onboarding/Dashboard), deployed on Vercel
- **Express backend** — repository-pattern data layer over Mongoose, deployed on Render
- **MongoDB Atlas** — Users, Preferences (enum-validated), Votes (upsert-by-key)
- **Three live external integrations** — CoinGecko (prices), free public RSS feeds (news), NVIDIA NIM (AI insight) — each with an independent, non-throwing fallback
- **Vitest test suite** — 19 tests across schema validation, repository regression guards, and route integration/logic
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
   npm test                 # Vitest, 19 tests, in-memory Mongo for DB-touching tests — no real DB needed
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

19 Vitest tests across 4 files under `backend/tests/` (mirrors `src/`'s folder layout); tests that touch the DB run against an in-memory MongoDB (`mongodb-memory-server`) — no external DB or network required:

| File | Focus |
| --- | --- |
| `tests/models/Preference.test.ts` | Schema enum validation (assets/investorType/contentTypes) |
| `tests/repositories/VoteRepository.test.ts` | Upsert-by-key behavior + a regression guard for a real bug found via live testing (see AI summary below) |
| `tests/routes/auth.test.ts` | Register/login integration tests via `supertest` — password never in response, malformed-email/duplicate-email/short-password rejected, wrong-password 401 |
| `tests/routes/dashboard.test.ts` | Pure unit tests for `pickMeme`'s preference-matching/fallback logic — no DB or network |

CI (`.github/workflows/ci.yml`) runs backend build+test and frontend build+lint on every push/PR to `main`.
