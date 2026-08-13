import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Preference } from '../models/Preference';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, name, password } = req.body as { email?: string; name?: string; password?: string };
  if (!email || !name || !password) {
    res.status(400).json({ error: 'email, name and password are required' });
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const user = await User.create({ email, name, password: hash });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    res.status(201).json({ token, hasPreferences: false });
  } catch {
    res.status(409).json({ error: 'Email already registered' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const prefs = await Preference.findOne({ userId: user._id });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  res.json({ token, hasPreferences: !!prefs, name: user.name });
});

export default router;
