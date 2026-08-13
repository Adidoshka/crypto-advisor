# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

CryptoAdvisor: a personalized crypto dashboard. Users register, pick preferences (assets, investor type, content types) in an onboarding wizard, then see a dashboard aggregating coin prices, news, an AI-generated insight, and a meme — each item upvote/downvote-able (votes are stored for future model training, not currently used to personalize anything).

Two independent apps, no shared package/workspace tooling — run and install each separately.

## Commands

Backend (`backend/`):
```
npm run dev     # ts-node-dev with auto-respawn, http://localhost:4000
npm run build   # tsc -> dist/
npm start       # run compiled dist/index.js
```

Frontend (`frontend/`):
```
npm run dev      # vite dev server, http://localhost:5173, proxies /api -> localhost:4000 (see vite.config.ts)
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm run preview
```

No test suite exists in either package yet.

## Environment setup

Backend requires a `.env` (see `backend/.env.example`):
- `MONGODB_URI` — MongoDB Atlas connection string (required; server exits on connect failure)
- `PORT` — default 4000
- `JWT_SECRET` — signs auth tokens
- `FRONTEND_URL` — CORS origin, default `http://localhost:5173`
- `OPENROUTER_API_KEY` — optional; without it, `/api/dashboard` falls back to a canned AI-insight string
- `CRYPTOPANIC_API_KEY` — optional; without it, `/api/dashboard` falls back to static news items

## Architecture

**Backend** (`backend/src`): Express + Mongoose, thin `router.get/post` handlers that delegate all persistence to a repository layer (`repositories/`) rather than importing Models directly — routes still own request validation and response shaping end-to-end, they just don't touch `Model.find*`/`findOneAndUpdate` themselves.

- `index.ts` — app entry: fails fast if `JWT_SECRET` is unset, wires CORS, JSON body parsing, mounts all routers under `/api/*`, exposes `/api/health` (pings Mongo), connects to DB before `listen`.
- `config/db.ts` — Mongoose connect/ping helpers. This *is* the connection pool (Mongoose Models share the one default connection) — there's no separate pool wrapper.
- `models/` — `User` (`password` is `select: false` and `minlength: 8` — never comes back on a plain query, must opt in), `Preference` (1:1 with User via unique `userId`; `assets`/`investorType`/`contentTypes` are `enum`-constrained against the vocab constants `Preference.ts` exports, which must stay in sync with the frontend's `Onboarding.tsx` toggle lists by convention — no shared package), `Vote` (compound unique index on `userId+section+itemId`, so a vote is an upsert-by-key, not an append-only log; `section` is enum-constrained to `prices|news|insight|meme`).
- `repositories/` — `BaseRepository<T>` wraps a single Mongoose `Model<T>` with the primitives every repo needs (`create`, `findOne`, `find`, `upsert` — `upsert` always passes `runValidators: true`, since `findOneAndUpdate` skips schema validators by default). `UserRepository`/`PreferenceRepository`/`VoteRepository` subclass it with named, domain-specific queries (`findByEmail`, `findByUserId`, `upsertVote`, etc.). `provider.ts` exposes a lazy-singleton `getRepos()` (plus `resetRepos()` for future test isolation) — routes call `getRepos().user.findByEmail(...)` rather than constructing repositories themselves.
- `middleware/auth.ts` — `authenticate` reads `Authorization: Bearer <jwt>`, verifies with `JWT_SECRET`, sets `req.userId`. Applied per-route, not globally.
- `routes/auth.ts` — register/login, async bcrypt hashing/comparison, issues 7-day JWTs. Register distinguishes a real duplicate-key error (`err.code === 11000` → 409) from any other failure (→ 500), rather than assuming every failure means a duplicate email. Login response includes `hasPreferences` so the frontend knows whether to route to onboarding.
- `routes/preferences.ts` — get/upsert the current user's `Preference` doc.
- `routes/dashboard.ts` — the aggregation endpoint. Fetches prices (CoinGecko), news (CryptoPanic if key present, else static fallback), and an AI insight (OpenRouter `mistralai/mistral-7b-instruct:free` if key present, else canned string) **in parallel** via `Promise.all`, plus a random static meme. Every external call has an 8–15s timeout and a non-throwing fallback — this endpoint should never 500 due to a third-party outage.
- `routes/votes.ts` — upsert a vote keyed on `userId+section+itemId`, and list the current user's votes.

**Frontend** (`frontend/src`): React 19 + React Router 7, no state library — auth state lives in `AuthContext` (JWT in `localStorage`), page-level state is local `useState`/`useEffect`. Styling is Tailwind v4 utility classes only, dark theme (slate/amber palette), no component library.

- `context/AuthContext.tsx` — holds `token`; `login`/`logout` sync to `localStorage`.
- `services/api.ts` — shared `axios` instance (`baseURL: '/api'`, proxied to the backend by Vite in dev); a request interceptor attaches the bearer token from `localStorage` to every call. Route protection is client-side only (`App.tsx`'s `PrivateRoute`/`PublicRoute` gate on `token` presence) — the backend is the actual auth boundary.
- `pages/Onboarding.tsx` — a 3-step wizard (assets → investor type → content types) driven by a local `steps` array with `canProceed` gating; posts to `/api/preferences` then navigates to `/dashboard`.
- `pages/Dashboard.tsx` — loads `/api/dashboard` + `/api/votes` together on mount, renders four `SectionCard`s (prices w/ Recharts sparklines, news, AI insight, meme). Voting is optimistic: local state updates immediately, reverted only if the POST fails.
- `App.tsx` — top-level route table and the `PrivateRoute`/`PublicRoute` guards described above.

## Conventions worth preserving

- Route handlers are `async (req, res): Promise<void>` with early `return` after each `res.json(...)`/`res.status(...)` — not `return res.json(...)`.
- Backend request bodies are cast inline (`req.body as { field?: type }`) rather than validated with a schema library; missing/invalid fields get a manual 400 check.
- Frontend components colocate small presentational subcomponents (e.g. `Toggle`, `VoteButtons`, `SectionCard`) in the same file as the page that uses them rather than splitting into separate files.
