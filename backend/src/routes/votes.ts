import { Router, Response } from 'express';
import { getRepos } from '../repositories/provider';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post(
  '/',
  authenticate,
  asyncHandler<AuthRequest>(async (req, res: Response): Promise<void> => {
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
    const userId = req.userId!; // set by `authenticate`
    try {
      await getRepos().vote.upsertVote(userId, section, itemId, value, contentSnapshot);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof Error && err.name === 'ValidationError') {
        res.status(400).json({ error: 'Invalid vote: section must be one of prices, news, insight, meme' });
        return;
      }
      console.error('Failed to save vote:', err);
      res.status(500).json({ error: 'Failed to save vote' });
    }
  }),
);

router.get(
  '/',
  authenticate,
  asyncHandler<AuthRequest>(async (req, res: Response): Promise<void> => {
    const rows = await getRepos().vote.listByUser(req.userId!);
    res.json(rows);
  }),
);

export default router;
