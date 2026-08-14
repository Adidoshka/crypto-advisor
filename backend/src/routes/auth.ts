import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getRepos } from '../repositories/provider';
import { EMAIL_REGEX } from '../models/User';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

function signToken(userId: unknown): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '7d', algorithm: 'HS256' });
}

router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, name, password } = req.body as { email?: string; name?: string; password?: string };
    if (!email || !name || !password) {
      res.status(400).json({ error: 'email, name and password are required' });
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'invalid email format' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'password must be at least 8 characters' });
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    try {
      const user = await getRepos().user.create({ email, name, password: hash });
      res.status(201).json({ token: signToken(user._id), hasPreferences: false });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
      console.error('Registration failed:', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  }),
);

router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }
    const user = await getRepos().user.findByEmail(email, { withPassword: true });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const prefs = await getRepos().preference.findByUserId(user._id.toString());
    res.json({ token: signToken(user._id), hasPreferences: !!prefs, name: user.name });
  }),
);

export default router;
