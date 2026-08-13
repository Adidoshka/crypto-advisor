import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB, pingDB } from './config/db';
import authRoutes from './routes/auth';
import preferencesRoutes from './routes/preferences';
import dashboardRoutes from './routes/dashboard';
import votesRoutes from './routes/votes';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/votes', votesRoutes);

app.get('/api/health', async (_req, res) => {
  const db = await pingDB();
  res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db });
});

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set');
  process.exit(1);
}

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`)))
  .catch((err) => { console.error('DB connection failed:', err); process.exit(1); });
