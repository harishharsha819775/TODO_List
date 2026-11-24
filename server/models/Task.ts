import mongoose, { Schema, type Document } from 'mongoose';
import type { TaskCategory, TaskPriority } from '../../src/types/taskflow.ts';

export interface TaskDoc extends Document {
  userId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: 'Not Started' | 'In Progress' | 'Completed';
  startDate: string;
  deadline: string;
  notes: string;
  completedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<TaskDoc>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
    description: { type: String, default: '', trim: true, maxlength: 4000 },
    category: {
      type: String,
      enum: ['Personal', 'Education', 'Work', 'Health', 'Other'],
      default: 'Work',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
      index: true,
    },
    startDate: { type: String, required: true },
    deadline: { type: String, required: true, index: true },
    notes: { type: String, default: '', trim: true, maxlength: 4000 },
    completedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

TaskSchema.index({ userId: 1, deletedAt: 1, deadline: 1 });

export const TaskModel =
  (mongoose.models.Task as mongoose.Model<TaskDoc>) ||
  mongoose.model<TaskDoc>('Task', TaskSchema);
