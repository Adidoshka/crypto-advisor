import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pingDB } from './config/db';
import authRoutes from './routes/auth';
import preferencesRoutes from './routes/preferences';
import dashboardRoutes from './routes/dashboard';
import votesRoutes from './routes/votes';

// No side effects (DB connect, listen()) — split from index.ts so tests can import and drive this with supertest.
const app = express();

// Needed behind Render's reverse proxy so Express reads the real client IP (required for express-rate-limit's per-IP keying below).
app.set('trust proxy', 1);

app.use(helmet());
// `||`, not `??` — same reasoning as NVIDIA_MODEL in dashboard.ts.
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Scoped to auth only — the actual brute-force surface — not applied globally.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});
app.use('/api/auth', authLimiter, authRoutes);

app.use('/api/preferences', preferencesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/votes', votesRoutes);

app.get('/api/health', async (_req, res) => {
  const db = await pingDB();
  res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db });
});

// Safety net for anything past a route's try/catch; must stay last and keep all 4 params (Express identifies error middleware by arity).
// Respects the error's own 4xx status (e.g. body-parser's 413/400) instead of blanket-returning 500 for client mistakes.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  const status = (err as { status?: number; statusCode?: number })?.status ?? (err as { statusCode?: number })?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ error: (err as Error)?.message ?? 'Bad request' });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
