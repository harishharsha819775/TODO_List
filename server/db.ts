import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { UserModel } from './models/User.ts';
import { TaskModel } from './models/Task.ts';
import type {
  AppPage,
  TaskCategory,
  TaskItem,
  TaskPriority,
  TaskStatus,
  TaskViewMode,
  UserPreferences,
  UserProfile,
} from '../src/types/taskflow.ts';

export interface StoredUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  roleTitle: string;
  avatarUrl: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface StoredTaskRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: 'Not Started' | 'In Progress' | 'Completed';
  startDate: string;
  deadline: string;
  notes: string;
  completedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LocalDbFile {
  users: StoredUserRecord[];
  tasks: StoredTaskRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'taskflow-db.json');

let useMongo = false;

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeEffectiveStatus(
  rawStatus: 'Not Started' | 'In Progress' | 'Completed',
  deadline: string,
  todayStr: string = getTodayIsoDate()
): TaskStatus {
  if (rawStatus === 'Completed') return 'Completed';
  if (deadline && deadline < todayStr) return 'Overdue';
  return rawStatus;
}

export function toPublicUser(u: StoredUserRecord): UserProfile {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    roleTitle: u.roleTitle,
    avatarUrl: u.avatarUrl,
    preferences: u.preferences,
    createdAt: u.createdAt,
  };
}

export function toTaskItem(t: StoredTaskRecord, todayStr: string = getTodayIsoDate()): TaskItem {
  return {
    id: t.id,
    userId: t.userId,
    title: t.title,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: computeEffectiveStatus(t.status, t.deadline, todayStr),
    rawStatus: t.status,
    startDate: t.startDate,
    deadline: t.deadline,
    notes: t.notes,
    completedAt: t.completedAt,
    deletedAt: t.deletedAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

function readLocalDb(): LocalDbFile {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial: LocalDbFile = { users: [], tasks: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<LocalDbFile>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    };
  } catch {
    return { users: [], tasks: [] };
  }
}

function writeLocalDb(db: LocalDbFile): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpFile, DATA_FILE);
}

function newObjectIdHex(): string {
  return crypto.randomBytes(12).toString('hex');
}

export async function initDatabase(): Promise<{ engine: 'mongodb' | 'local-store' }> {
  const uri = process.env.MONGODB_URI?.trim();
  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      useMongo = true;
      console.log('[TaskFlow DB] Connected to MongoDB via Mongoose.');
      return { engine: 'mongodb' };
    } catch (err) {
      console.warn('[TaskFlow DB] MongoDB connection failed, falling back to persistent local document store:', (err as Error).message);
      useMongo = false;
    }
  } else {
    console.log('[TaskFlow DB] MONGODB_URI not set. Using persistent local document store at data/taskflow-db.json.');
  }
  readLocalDb();
  return { engine: 'local-store' };
}

function mapMongoUser(doc: any): StoredUserRecord {
  return {
    id: String(doc._id),
    name: String(doc.name),
    email: String(doc.email),
    passwordHash: String(doc.passwordHash),
    roleTitle: String(doc.roleTitle || 'Productive Individual'),
    avatarUrl: String(doc.avatarUrl || '/src/assets/images/avatar_workspace_user_1795507149897.jpg'),
    preferences: {
      theme: doc.preferences?.theme === 'dark' ? 'dark' : 'light',
      defaultView: doc.preferences?.defaultView === 'card' ? 'card' : 'list',
      defaultPage: (doc.preferences?.defaultPage as AppPage) || 'dashboard',
    },
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

function mapMongoTask(doc: any): StoredTaskRecord {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    title: String(doc.title),
    description: String(doc.description || ''),
    category: doc.category as TaskCategory,
    priority: doc.priority as TaskPriority,
    status: doc.status as 'Not Started' | 'In Progress' | 'Completed',
    startDate: String(doc.startDate),
    deadline: String(doc.deadline),
    notes: String(doc.notes || ''),
    completedAt: doc.completedAt ? new Date(doc.completedAt).toISOString() : null,
    deletedAt: doc.deletedAt ? new Date(doc.deletedAt).toISOString() : null,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export const db = {
  async findUserByEmail(email: string): Promise<StoredUserRecord | null> {
    const normalized = email.trim().toLowerCase();
    if (useMongo) {
      const doc = await UserModel.findOne({ email: normalized }).lean();
      return doc ? mapMongoUser(doc) : null;
    }
    const store = readLocalDb();
    return store.users.find((u) => u.email === normalized) ?? null;
  },

  async findUserById(id: string): Promise<StoredUserRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await UserModel.findById(id).lean();
      return doc ? mapMongoUser(doc) : null;
    }
    const store = readLocalDb();
    return store.users.find((u) => u.id === id) ?? null;
  },

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    roleTitle?: string;
  }): Promise<StoredUserRecord> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const avatarUrl = '/src/assets/images/avatar_workspace_user_1795507149897.jpg';
    const defaultPrefs: UserPreferences = {
      theme: 'light',
      defaultView: 'list',
      defaultPage: 'dashboard',
    };

    if (useMongo) {
      const created = await UserModel.create({
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash: input.passwordHash,
        roleTitle: input.roleTitle?.trim() || 'Productive Individual',
        avatarUrl,
        preferences: defaultPrefs,
      });
      return mapMongoUser(created.toObject());
    }

    const store = readLocalDb();
    const now = new Date().toISOString();
    const user: StoredUserRecord = {
      id: newObjectIdHex(),
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash: input.passwordHash,
      roleTitle: input.roleTitle?.trim() || 'Productive Individual',
      avatarUrl,
      preferences: defaultPrefs,
      createdAt: now,
      updatedAt: now,
    };
    store.users.push(user);
    writeLocalDb(store);
    return user;
  },

  async updateUser(
    id: string,
    patch: {
      name?: string;
      roleTitle?: string;
      passwordHash?: string;
      preferences?: Partial<UserPreferences>;
    }
  ): Promise<StoredUserRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const existing = await UserModel.findById(id);
      if (!existing) return null;
      if (patch.name !== undefined) existing.name = patch.name.trim();
      if (patch.roleTitle !== undefined) existing.roleTitle = patch.roleTitle.trim();
      if (patch.passwordHash !== undefined) existing.passwordHash = patch.passwordHash;
      if (patch.preferences) {
        existing.preferences = {
          theme: patch.preferences.theme ?? existing.preferences.theme,
          defaultView: patch.preferences.defaultView ?? existing.preferences.defaultView,
          defaultPage: patch.preferences.defaultPage ?? existing.preferences.defaultPage,
        };
      }
      await existing.save();
      return mapMongoUser(existing.toObject());
    }

    const store = readLocalDb();
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    const current = store.users[idx];
    const updated: StoredUserRecord = {
      ...current,
      name: patch.name !== undefined ? patch.name.trim() : current.name,
      roleTitle: patch.roleTitle !== undefined ? patch.roleTitle.trim() : current.roleTitle,
      passwordHash: patch.passwordHash !== undefined ? patch.passwordHash : current.passwordHash,
      preferences: patch.preferences
        ? {
            theme: patch.preferences.theme ?? current.preferences.theme,
            defaultView: (patch.preferences.defaultView as TaskViewMode) ?? current.preferences.defaultView,
            defaultPage: (patch.preferences.defaultPage as AppPage) ?? current.preferences.defaultPage,
          }
        : current.preferences,
      updatedAt: new Date().toISOString(),
    };
    store.users[idx] = updated;
    writeLocalDb(store);
    return updated;
  },

  async listTasksForUser(userId: string, includeDeleted = false): Promise<StoredTaskRecord[]> {
    if (useMongo) {
      const filter: Record<string, unknown> = { userId };
      if (!includeDeleted) {
        filter.deletedAt = null;
      } else {
        filter.deletedAt = { $ne: null };
      }
      const docs = await TaskModel.find(filter).sort({ createdAt: -1 }).lean();
      return docs.map(mapMongoTask);
    }

    const store = readLocalDb();
    return store.tasks.filter((t) =>
      t.userId === userId && (includeDeleted ? t.deletedAt !== null : t.deletedAt === null)
    );
  },

  async findTaskById(userId: string, taskId: string): Promise<StoredTaskRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(taskId)) return null;
      const doc = await TaskModel.findOne({ _id: taskId, userId }).lean();
      return doc ? mapMongoTask(doc) : null;
    }

    const store = readLocalDb();
    return store.tasks.find((t) => t.id === taskId && t.userId === userId) ?? null;
  },

  async createTask(input: {
    userId: string;
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
    status: 'Not Started' | 'In Progress' | 'Completed';
    startDate: string;
    deadline: string;
    notes: string;
    completedAt?: string | null;
  }): Promise<StoredTaskRecord> {
    const completedAtValue =
      input.status === 'Completed'
        ? input.completedAt ?? new Date().toISOString()
        : null;

    if (useMongo) {
      const created = await TaskModel.create({
        userId: input.userId,
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        status: input.status,
        startDate: input.startDate,
        deadline: input.deadline,
        notes: input.notes,
        completedAt: completedAtValue ? new Date(completedAtValue) : null,
        deletedAt: null,
      });
      return mapMongoTask(created.toObject());
    }

    const store = readLocalDb();
    const now = new Date().toISOString();
    const task: StoredTaskRecord = {
      id: newObjectIdHex(),
      userId: input.userId,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      status: input.status,
      startDate: input.startDate,
      deadline: input.deadline,
      notes: input.notes,
      completedAt: completedAtValue,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    store.tasks.unshift(task);
    writeLocalDb(store);
    return task;
  },

  async updateTask(
    userId: string,
    taskId: string,
    patch: Partial<{
      title: string;
      description: string;
      category: TaskCategory;
      priority: TaskPriority;
      status: 'Not Started' | 'In Progress' | 'Completed';
      startDate: string;
      deadline: string;
      notes: string;
      completedAt: string | null;
      deletedAt: string | null;
    }>
  ): Promise<StoredTaskRecord | null> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(taskId)) return null;
      const existing = await TaskModel.findOne({ _id: taskId, userId });
      if (!existing) return null;

      if (patch.title !== undefined) existing.title = patch.title;
      if (patch.description !== undefined) existing.description = patch.description;
      if (patch.category !== undefined) existing.category = patch.category;
      if (patch.priority !== undefined) existing.priority = patch.priority;
      if (patch.startDate !== undefined) existing.startDate = patch.startDate;
      if (patch.deadline !== undefined) existing.deadline = patch.deadline;
      if (patch.notes !== undefined) existing.notes = patch.notes;
      if (patch.status !== undefined) {
        existing.status = patch.status;
        if (patch.status === 'Completed') {
          existing.completedAt = existing.completedAt ?? new Date();
        } else {
          existing.completedAt = null;
        }
      }
      if (patch.completedAt !== undefined) {
        existing.completedAt = patch.completedAt ? new Date(patch.completedAt) : null;
      }
      if (patch.deletedAt !== undefined) {
        existing.deletedAt = patch.deletedAt ? new Date(patch.deletedAt) : null;
      }
      await existing.save();
      return mapMongoTask(existing.toObject());
    }

    const store = readLocalDb();
    const idx = store.tasks.findIndex((t) => t.id === taskId && t.userId === userId);
    if (idx === -1) return null;
    const current = store.tasks[idx];
    const nextStatus = patch.status ?? current.status;
    let nextCompletedAt = current.completedAt;
    if (patch.status !== undefined) {
      nextCompletedAt = nextStatus === 'Completed' ? (current.completedAt ?? new Date().toISOString()) : null;
    }
    if (patch.completedAt !== undefined) {
      nextCompletedAt = patch.completedAt;
    }

    const updated: StoredTaskRecord = {
      ...current,
      title: patch.title !== undefined ? patch.title : current.title,
      description: patch.description !== undefined ? patch.description : current.description,
      category: patch.category !== undefined ? patch.category : current.category,
      priority: patch.priority !== undefined ? patch.priority : current.priority,
      status: nextStatus,
      startDate: patch.startDate !== undefined ? patch.startDate : current.startDate,
      deadline: patch.deadline !== undefined ? patch.deadline : current.deadline,
      notes: patch.notes !== undefined ? patch.notes : current.notes,
      completedAt: nextCompletedAt,
      deletedAt: patch.deletedAt !== undefined ? patch.deletedAt : current.deletedAt,
      updatedAt: new Date().toISOString(),
    };
    store.tasks[idx] = updated;
    writeLocalDb(store);
    return updated;
  },

  async permanentlyDeleteTask(userId: string, taskId: string): Promise<boolean> {
    if (useMongo) {
      if (!mongoose.Types.ObjectId.isValid(taskId)) return false;
      const result = await TaskModel.deleteOne({ _id: taskId, userId });
      return result.deletedCount > 0;
    }

    const store = readLocalDb();
    const before = store.tasks.length;
    store.tasks = store.tasks.filter((t) => !(t.id === taskId && t.userId === userId));
    if (store.tasks.length === before) return false;
    writeLocalDb(store);
    return true;
  },

  async purgeDeletedTasks(userId: string): Promise<number> {
    if (useMongo) {
      const result = await TaskModel.deleteMany({ userId, deletedAt: { $ne: null } });
      return result.deletedCount;
    }

    const store = readLocalDb();
    const before = store.tasks.length;
    store.tasks = store.tasks.filter((t) => !(t.userId === userId && t.deletedAt !== null));
    const removed = before - store.tasks.length;
    if (removed > 0) writeLocalDb(store);
    return removed;
  },
};
