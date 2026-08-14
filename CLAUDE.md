# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

CryptoAdvisor: a personalized crypto dashboard. Users register, pick preferences (assets, investor type, content types) in an onboarding wizard, then see a dashboard aggregating coin prices, news, an AI-generated insight, and a meme — each item upvote/downvote-able (votes are stored for future model training, not currently used to personalize anything).

Two independent apps, no shared package/workspace tooling — run and install each separately.

## Commands

Backend (`backend/`):

```bash
npm run dev     # ts-node-dev with auto-respawn, http://localhost:4000
npm run build   # tsc -> dist/ (only compiles src/; tests/ lives outside it, so it's never part of the build)
npm start       # run compiled dist/index.js
npm test        # vitest run — 4 files under tests/, 20 tests; mongodb-memory-server spins up a real
                # in-memory Mongo per test file that needs one (pure-logic tests, e.g. dashboard.test.ts,
                # skip it entirely), no external DB or network needed
```

Frontend (`frontend/`):

```bash
npm run dev      # vite dev server, http://localhost:5173, proxies /api -> localhost:4000 (see vite.config.ts)
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm run preview
```

No frontend test suite yet — `frontend/tests/` exists as an empty placeholder (mirrors `backend/tests/`) for when one is added. CI (`.github/workflows/ci.yml`) runs backend build+test and frontend build+lint on every push/PR to `main`.

## Environment setup

Backend requires a `.env` (see `backend/.env.example`):

- `MONGODB_URI` — MongoDB Atlas connection string (required; server exits on connect failure)
- `PORT` — default 4000
- `JWT_SECRET` — signs auth tokens
- `FRONTEND_URL` — CORS origin, default `http://localhost:5173`
- `NVIDIA_API_KEY` — optional; without it, `/api/dashboard` falls back to a canned AI-insight string. Originally used OpenRouter; switched to NVIDIA NIM directly (`integrate.api.nvidia.com`) since NVIDIA's free tier is a per-minute limit (~40 RPM) rather than OpenRouter's harder 50/day cap
- `NVIDIA_MODEL` — optional, defaults to `meta/llama-3.1-8b-instruct`; override to swap models without a code change if one is ever pulled from the catalog (same reasoning as before — free-tier model availability isn't guaranteed to stay put)

News has no key to configure — CryptoPanic no longer offers a free API tier (paid plans start at $50/week as of Aug 2026), so `/api/dashboard` sources news from free public RSS feeds instead (see below).

## Architecture

**Backend** (`backend/src`): Express + Mongoose, thin `router.get/post` handlers that delegate all persistence to a repository layer (`repositories/`) rather than importing Models directly — routes still own request validation and response shaping end-to-end, they just don't touch `Model.find*`/`findOneAndUpdate` themselves.

- `app.ts` / `index.ts` — split specifically for testability: `app.ts` is pure Express app construction (helmet, CORS, JSON body parsing, rate limiting on `/api/auth`, all routers, `/api/health`, a centralized 4-arg error-handling middleware last) with no side effects, so tests can `import app` and drive it with `supertest` without a real DB or port; `index.ts` is the actual bootstrap — fails fast if `JWT_SECRET` is unset, then `connectDB().then(() => app.listen(...))`.
- `config/db.ts` — Mongoose connect/ping helpers. This *is* the connection pool (Mongoose Models share the one default connection) — there's no separate pool wrapper.
- `models/` — `User` (`password` is `select: false` and `minlength: 8` — never comes back on a plain query, must opt in), `Preference` (1:1 with User via unique `userId`; `assets`/`investorType`/`contentTypes` are `enum`-constrained against the vocab constants `Preference.ts` exports, which must stay in sync with the frontend's `Onboarding.tsx` toggle lists by convention — no shared package; also holds `cachedInsight`/`cachedInsightDate` — see dashboard.ts below), `Vote` (compound unique index on `userId+section+itemId`, so a vote is an upsert-by-key, not an append-only log; `section` is enum-constrained to `prices|news|insight|meme`).
- `repositories/` — `BaseRepository<T>` wraps a single Mongoose `Model<T>` with the primitives every repo needs (`create`, `findOne`, `find`, `upsert` — `upsert` always passes `runValidators: true`, since `findOneAndUpdate` skips schema validators by default; note `upsert` only validates paths present in the *update* object, not ones supplied only via the filter — repo methods that filter on an enum-constrained field must repeat it in the update body too, see `VoteRepository.upsertVote`). `UserRepository`/`PreferenceRepository`/`VoteRepository` subclass it with named, domain-specific queries (`findByEmail`, `findByUserId`, `upsertVote`, `cacheInsight`, etc.). `provider.ts` exposes a lazy-singleton `getRepos()` (plus `resetRepos()` for future test isolation) — routes call `getRepos().user.findByEmail(...)` rather than constructing repositories themselves.
- `middleware/auth.ts` — `authenticate` reads `Authorization: Bearer <jwt>`, verifies with `JWT_SECRET`, sets `req.userId`. Applied per-route, not globally.
- `routes/auth.ts` — register/login, async bcrypt hashing/comparison, issues 7-day JWTs. Register distinguishes a real duplicate-key error (`err.code === 11000` → 409) from any other failure (→ 500), rather than assuming every failure means a duplicate email. Login response includes `hasPreferences` (routing) and `name`; register's response does not include `name` (the frontend already has it locally from the form).
- `routes/preferences.ts` — get/upsert the current user's `Preference` doc.
- `routes/dashboard.ts` — the aggregation endpoint. Fetches prices (CoinGecko, no key required), news (free public RSS feeds — CoinDesk/Cointelegraph/Decrypt, merged and keyword-filtered against the user's `assets`, falling back to the unfiltered pool if nothing matches and to a tiny static list if every feed fails), and an AI insight (NVIDIA NIM, cached per-user-per-day on the `Preference` doc — the cache predates the NVIDIA switch and protects against any provider's free-tier limits, not just OpenRouter's original 50/day — only re-fetched when `cachedInsightDate` isn't today) **in parallel** via `Promise.all`, plus a random static meme. Every external call has an 8s timeout and a non-throwing fallback — this endpoint should never 500 due to a third-party outage.
- `routes/votes.ts` — upsert a vote keyed on `userId+section+itemId`, and list the current user's votes.

**Frontend** (`frontend/src`): React 19 + React Router 7, no state library — auth state lives in `AuthContext` (JWT + user's `name` in `localStorage`), page-level state is local `useState`/`useEffect`. Styling is Tailwind v4 utility classes only, "CoinSage" dark navy/cyan/green brand (`brand-cyan`/`brand-green`/`brand-deep` theme tokens + `font-outfit`, defined in `index.css`'s `@theme` block) — no component library.

- `context/` — auth state, split across three files so each exports exactly one kind of thing (required for Vite Fast Refresh to hot-reload any of them; a single file mixing a component with a context object or hook forces a full page reload on every edit instead): `AuthContext.ts` (the `createContext` object + `AuthContextValue` type), `AuthProvider.tsx` (the provider component — holds `token`/`name`/`hasPreferences`; `login(token, name, hasPreferences)`/`completeOnboarding()`/`logout()` sync to `localStorage`), `useAuth.ts` (the consumer hook).
- `services/api.ts` — shared `axios` instance (`baseURL` from `VITE_API_BASE_URL` env var, falling back to `/api` for Vite's dev proxy — production frontend/backend are separate origins); a request interceptor attaches the bearer token from `localStorage` to every call. Route protection is client-side only (`App.tsx`'s `PrivateRoute`/`PublicRoute` gate on `token` presence) — the backend is the actual auth boundary.
- `components/` — small pieces shared across pages (the one deliberate exception to colocating subcomponents in their page file, used only when identical markup would otherwise be duplicated across 2+ pages): `Logo.tsx` (brand mark, `<img>` from `assets/logo.png`), `icons.tsx` (hand-written inline SVG icons — no icon library dependency), `SentimentCard.tsx` (decorative marketing card on Login/Register), `AuthLayout.tsx` (the full Login/Register page shell — marketing panel + wide-screen max-width wrapper — extracted after it was found duplicated byte-for-byte across both page files).
- `pages/Register.tsx` — no auto-login on success: navigates to `/login` with `{ justRegistered: true }` router state instead, which `Login.tsx` reads to show a one-time "Account created — log in to continue" confirmation. Deliberate — user proves they know the password they just set rather than being silently authenticated.
- `pages/Onboarding.tsx` — a 3-step wizard (assets → investor type → content types), each step with a distinct layout (toggle pills / icon cards / checkbox rows) matching its own `canProceed` gating; step 1 has a "Skip for now" escape hatch that bypasses just that step's requirement, not the rest of onboarding. Posts to `/api/preferences` then navigates to `/dashboard`.
- `pages/Dashboard.tsx` — loads `/api/dashboard` + `/api/votes` together on mount, renders four `SectionCard`s (prices w/ Recharts sparklines, AI insight, news, meme). Voting is one `VoteButtons` per section as a whole (`itemId: 'overview'` for prices/news, `'daily'` for insight, the meme's own id), not per coin/article — a single 👍/👎 judges everything shown in that card, not each row individually. Voting is optimistic: local state updates immediately, reverted only if the POST fails; no vote counts are displayed (the assignment only requires votes be persisted, not shown — fabricating counts was considered and rejected). Each vote also sends a `contentSnapshot` (truncated to `Vote.ts`'s 1000-char `maxlength`) — for prices/news this is every item shown joined into one string, for insight/meme it's the displayed text/title — since 3 of 4 sections' `itemId`s point at mutable or ephemeral content (the AI insight is overwritten daily, news is never persisted elsewhere, and even meme URLs/titles can be edited) that can't be reconstructed later from the ID alone.
- `App.tsx` — top-level route table and the `PrivateRoute`/`PublicRoute` guards described above, plus two symmetric guards nested inside `PrivateRoute`: `OnboardingRoute` (wraps `/onboarding`) redirects to `/dashboard` if `hasPreferences` is already `true`, so a completed onboarding can't be re-entered via back-button/bookmark/typed URL; `DashboardRoute` (wraps `/dashboard`) redirects the other way to `/onboarding` if `hasPreferences` is still `false` — `GET /api/dashboard` 404s without a `Preference` doc, so this stops that dead end however the user got there.

## Conventions worth preserving

- Route handlers are `async (req, res): Promise<void>` with early `return` after each `res.json(...)`/`res.status(...)` — not `return res.json(...)`.
- Backend request bodies are cast inline (`req.body as { field?: type }`) rather than validated with a schema library; missing/invalid fields get a manual 400 check.
- Frontend components colocate small presentational subcomponents (e.g. `Toggle`, `VoteButtons`, `SectionCard`) in the same file as the page that uses them rather than splitting into separate files.
