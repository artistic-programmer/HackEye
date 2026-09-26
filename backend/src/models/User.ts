import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'USER' | 'REVIEWER' | 'ADMIN';

export interface IUser extends Document {
  name: string;
  email: string;
  googleId?: string;
  avatar?: string;
  reputation: number;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    reputation: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ['USER', 'REVIEWER', 'ADMIN'],
      default: 'USER',
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;
