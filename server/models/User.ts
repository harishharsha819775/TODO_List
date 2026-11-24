import mongoose, { Schema, type Document } from 'mongoose';
import type { AppPage, TaskViewMode } from '../../src/types/taskflow.ts';

export interface UserDoc extends Document {
  name: string;
  email: string;
  passwordHash: string;
  roleTitle: string;
  avatarUrl: string;
  preferences: {
    theme: 'light' | 'dark';
    defaultView: TaskViewMode;
    defaultPage: AppPage;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    roleTitle: { type: String, default: 'Productive Individual', trim: true, maxlength: 80 },
    avatarUrl: { type: String, default: '/src/assets/images/avatar_workspace_user_1795507149897.jpg' },
    preferences: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      defaultView: { type: String, enum: ['list', 'card'], default: 'list' },
      defaultPage: {
        type: String,
        enum: ['dashboard', 'tasks', 'today', 'upcoming', 'calendar', 'analytics', 'settings'],
        default: 'dashboard',
      },
    },
  },
  { timestamps: true }
);

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserDoc>) ||
  mongoose.model<UserDoc>('User', UserSchema);
