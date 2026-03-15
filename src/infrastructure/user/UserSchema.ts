import { Schema, model } from 'mongoose';

export interface UserDocument {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'superadmin' | 'admin' | 'user';
  status: 'active' | 'inactive' | 'banned';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'user'],
      default: 'user',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    _id: false,
  },
);

userSchema.index({ role: 1, status: 1 });

export const UserModel = model<UserDocument>('User', userSchema);
