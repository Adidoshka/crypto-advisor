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
  'Chainlink',
  'Dogecoin',
  'Avalanche',
] as const;

export const INVESTOR_TYPES = ['HODLer', 'Day Trader', 'NFT Collector', 'DeFi Explorer', 'Swing Trader'] as const;

export const CONTENT_TYPES = ['Market News', 'Coin Prices', 'AI Insights', 'Memes & Fun'] as const;

export interface IPreference extends Document {
  userId: Types.ObjectId;
  assets: string[];
  investorType: string;
  contentTypes: string[];
}

const preferenceSchema = new Schema<IPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    assets: { type: [String], enum: CRYPTO_ASSETS, default: [] },
    investorType: { type: String, enum: INVESTOR_TYPES },
    contentTypes: { type: [String], enum: CONTENT_TYPES, default: [] },
  },
  { timestamps: true },
);

export const Preference = model<IPreference>('Preference', preferenceSchema);
