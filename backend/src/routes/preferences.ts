import { Router, Response } from 'express';
import { getRepos } from '../repositories/provider';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler<AuthRequest>(async (req, res: Response): Promise<void> => {
    const userId = req.userId!; // set by `authenticate`
    const prefs = await getRepos().preference.findByUserId(userId);
    if (!prefs) {
      res.json(null);
      return;
    }
    res.json({ assets: prefs.assets, investorType: prefs.investorType, contentTypes: prefs.contentTypes });
  }),
);

router.post(
  '/',
  authenticate,
  asyncHandler<AuthRequest>(async (req, res: Response): Promise<void> => {
    const { assets, investorType, contentTypes } = req.body as {
      assets?: string[];
      investorType?: string;
      contentTypes?: string[];
    };
    if (!assets || !investorType || !contentTypes) {
      res.status(400).json({ error: 'assets, investorType and contentTypes are required' });
      return;
    }
    const userId = req.userId!; // set by `authenticate`
    try {
      await getRepos().preference.upsertForUser(userId, { assets, investorType, contentTypes });
      res.json({ success: true });
    } catch (err) {
      if (err instanceof Error && err.name === 'ValidationError') {
        res.status(400).json({ error: 'Invalid preferences: assets, investorType, and contentTypes must be from the allowed lists' });
        return;
      }
      console.error('Failed to save preferences:', err);
      res.status(500).json({ error: 'Failed to save preferences' });
    }
  }),
);

export default router;
