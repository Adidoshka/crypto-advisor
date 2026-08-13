import { Router, Response } from 'express';
import { Preference } from '../models/Preference';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const prefs = await Preference.findOne({ userId: req.userId });
  if (!prefs) {
    res.json(null);
    return;
  }
  res.json({ assets: prefs.assets, investorType: prefs.investorType, contentTypes: prefs.contentTypes });
});

router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { assets, investorType, contentTypes } = req.body as {
    assets?: string[];
    investorType?: string;
    contentTypes?: string[];
  };
  if (!assets || !investorType || !contentTypes) {
    res.status(400).json({ error: 'assets, investorType and contentTypes are required' });
    return;
  }
  await Preference.findOneAndUpdate(
    { userId: req.userId },
    { assets, investorType, contentTypes },
    { upsert: true, new: true },
  );
  res.json({ success: true });
});

export default router;
