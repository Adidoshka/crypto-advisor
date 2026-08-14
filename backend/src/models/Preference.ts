import { Schema, model, Document, Types } from 'mongoose';

// Closed vocabularies for onboarding answers. Must stay in sync with the
// frontend's toggle lists in frontend/src/pages/Onboarding.tsx
// (CRYPTO_ASSETS / INVESTOR_TYPES / CONTENT_TYPES) — the two apps share no
// package, so this pairing is manual by convention, not enforced by types.
export const CRYPTO_ASSETS = [
  'Bitcoin',
  'Ethereum',
  'Solana',
  'Cardano',
  'Polkadot',
  'Avalanche',
  'Chainlink',
  'Polygon',
  'Near Protocol',
  'Cosmos',
  'Uniswap',
  'Aptos',
] as const;

export const INVESTOR_TYPES = ['HODLer', 'Day Trader', 'NFT Collector', 'DeFi Explorer'] as const;

export const CONTENT_TYPES = ['Market News', 'Price Charts', 'AI Insights', 'Social Buzz', 'Fun Memes'] as const;

export interface IPreference extends Document {
  userId: Types.ObjectId;
  assets: string[];
  investorType: string;
  contentTypes: string[];
  // "AI Insight of the Day" cache — one OpenRouter call per user per day
  // instead of one per dashboard load, since the free tier caps at 50/day.
  cachedInsight?: string;
  cachedInsightDate?: string; // 'YYYY-MM-DD' (UTC)
}

const preferenceSchema = new Schema<IPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    assets: { type: [String], enum: CRYPTO_ASSETS, default: [] },
    investorType: { type: String, enum: INVESTOR_TYPES },
    contentTypes: { type: [String], enum: CONTENT_TYPES, default: [] },
    cachedInsight: { type: String },
    cachedInsightDate: { type: String },
  },
  { timestamps: true },
);

export const Preference = model<IPreference>('Preference', preferenceSchema);
