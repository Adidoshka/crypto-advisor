import { Schema, model, Document, Types } from 'mongoose';

export interface IVote extends Document {
  userId: Types.ObjectId;
  section: string;
  itemId: string;
  value: 1 | -1;
  // snapshot stored for future model training
  contentSnapshot?: string;
}

const voteSchema = new Schema<IVote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    section: { type: String, required: true },
    itemId: { type: String, required: true },
    value: { type: Number, enum: [1, -1], required: true },
    contentSnapshot: { type: String },
  },
  { timestamps: true },
);

voteSchema.index({ userId: 1, section: 1, itemId: 1 }, { unique: true });

export const Vote = model<IVote>('Vote', voteSchema);
