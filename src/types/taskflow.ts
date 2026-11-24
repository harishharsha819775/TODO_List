export type TaskCategory = 'Personal' | 'Education' | 'Work' | 'Health' | 'Other';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';

export type TaskSortOption = 'newest' | 'oldest' | 'deadline';

export type AppPage =
  | 'dashboard'
  | 'tasks'
  | 'today'
  | 'upcoming'
  | 'calendar'
  | 'analytics'
  | 'settings';

export type TaskViewMode = 'list' | 'card';

export interface UserPreferences {
  theme: 'light' | 'dark';
  defaultView: TaskViewMode;
  defaultPage: AppPage;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  avatarUrl: string;
  preferences: UserPreferences;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  rawStatus: 'Not Started' | 'In Progress' | 'Completed';
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  notes: string;
  completedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormPayload {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: 'Not Started' | 'In Progress' | 'Completed';
  startDate: string;
  deadline: string;
  notes: string;
}

export interface DailyCompletionPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g., "Nov 18"
  completed: number;
  created: number;
}

export interface WeeklyTrendPoint {
  weekLabel: string;
  completed: number;
  total: number;
  rate: number;
}

export interface CategoryStat {
  category: TaskCategory;
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  percentage: number;
}

export interface PriorityStat {
  priority: TaskPriority;
  total: number;
  completed: number;
}

export interface AnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  completedTodayTasks: number;
  weeklyProductivityPct: number;
  weeklyCompletedCount: number;
  weeklyTotalCount: number;
  monthlyCompletionRate: number;
  monthlyCompletedCount: number;
  monthlyTotalCount: number;
  dailyCompletion: DailyCompletionPoint[];
  weeklyTrend: WeeklyTrendPoint[];
  categoryDistribution: CategoryStat[];
  priorityBreakdown: PriorityStat[];
  deletedCount: number;
}

export const TASK_CATEGORIES: TaskCategory[] = [
  'Work',
  'Education',
  'Personal',
  'Health',
  'Other',
];

export const TASK_PRIORITIES: TaskPriority[] = [
  'Low',
  'Medium',
  'High',
  'Urgent',
];

export const TASK_STATUSES: TaskStatus[] = [
  'Not Started',
  'In Progress',
  'Completed',
  'Overdue',
];
