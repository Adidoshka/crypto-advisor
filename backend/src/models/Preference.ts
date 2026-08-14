import { Schema, model, Document, Types } from 'mongoose';

// Closed vocabularies for onboarding answers — must stay in sync by convention with the toggle lists in frontend/src/pages/Onboarding.tsx.
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
  // Cached AI insight — one provider call per user per day, not per dashboard load.
  cachedInsight?: string;
  cachedInsightDate?: string; // 'YYYY-MM-DD' (UTC)
}

const preferenceSchema = new Schema<IPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    assets: { type: [String], enum: CRYPTO_ASSETS, default: [] },
    // required: true makes IPreference's non-optional `investorType: string` claim actually enforced at the schema level.
    investorType: { type: String, enum: INVESTOR_TYPES, required: true },
    contentTypes: { type: [String], enum: CONTENT_TYPES, default: [] },
    cachedInsight: { type: String },
    cachedInsightDate: { type: String },
  },
  { timestamps: true },
);

export const Preference = model<IPreference>('Preference', preferenceSchema);
