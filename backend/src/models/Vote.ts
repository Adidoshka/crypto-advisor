import { Schema, model, Document, Types } from 'mongoose';

export interface IVote extends Document {
  userId: Types.ObjectId;
  section: string;
  itemId: string;
  value: 1 | -1;
  // Snapshot stored for future model training.
  contentSnapshot?: string;
}

const voteSchema = new Schema<IVote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Matches the sectionKey values Dashboard.tsx passes when voting.
    section: { type: String, required: true, enum: ['prices', 'news', 'insight', 'meme'] },
    itemId: { type: String, required: true },
    value: { type: Number, enum: [1, -1], required: true },
    // Capped to stop a single vote from bloating storage — not the primary size defense, that's Express's body-size limit.
    contentSnapshot: { type: String, maxlength: 1000 },
  },
  { timestamps: true },
);

voteSchema.index({ userId: 1, section: 1, itemId: 1 }, { unique: true });

export const Vote = model<IVote>('Vote', voteSchema);
