import { Router, Response } from 'express';
import { Vote } from '../models/Vote';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { section, itemId, value, contentSnapshot } = req.body as {
    section?: string;
    itemId?: string;
    value?: number;
    contentSnapshot?: string;
  };
  if (!section || !itemId || (value !== 1 && value !== -1)) {
    res.status(400).json({ error: 'section, itemId, and value (1 or -1) are required' });
    return;
  }
  await Vote.findOneAndUpdate(
    { userId: req.userId, section, itemId },
    { value, contentSnapshot },
    { upsert: true, new: true },
  );
  res.json({ success: true });
});

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const rows = await Vote.find({ userId: req.userId }).select('section itemId value -_id');
  res.json(rows);
});

export default router;
