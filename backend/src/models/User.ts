import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', userSchema);
