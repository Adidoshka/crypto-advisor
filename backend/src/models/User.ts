import { Schema, model, Document } from 'mongoose';

// Pragmatic format check (not RFC 5322) — shared by the schema validator below and routes/auth.ts's register handler.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254, // RFC 5321 max
      match: EMAIL_REGEX,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    password: { type: String, required: true, minlength: 8, select: false },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', userSchema);
