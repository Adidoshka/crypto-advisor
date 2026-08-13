import { Schema, model, Document, Types } from 'mongoose';

export interface IPreference extends Document {
  userId: Types.ObjectId;
  assets: string[];
  investorType: string;
  contentTypes: string[];
}

const preferenceSchema = new Schema<IPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    assets: { type: [String], default: [] },
    investorType: { type: String, default: '' },
    contentTypes: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const Preference = model<IPreference>('Preference', preferenceSchema);
