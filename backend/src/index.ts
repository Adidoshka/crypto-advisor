import 'dotenv/config';
import app from './app';
import { connectDB } from './config/db';

// `||`, not `??` — same reasoning as NVIDIA_MODEL in dashboard.ts: a blank
// (present-but-empty) env var isn't nullish, so ?? wouldn't fall back.
const PORT = process.env.PORT || 4000;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set');
  process.exit(1);
}

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`)))
  .catch((err) => { console.error('DB connection failed:', err); process.exit(1); });
