import type {
  AnalyticsSummary,
  AuthResponse,
  TaskFormPayload,
  TaskItem,
  UserPreferences,
  UserProfile,
} from '../types/taskflow';

let memoryToken: string | null = null;

export function setAuthToken(token: string | null): void {
  memoryToken = token;
}

export function getAuthToken(): string | null {
  return memoryToken;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (memoryToken) {
    headers.set('Authorization', `Bearer ${memoryToken}`);
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export interface TaskQueryFilters {
  search?: string;
  category?: string;
  priority?: string;
  status?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  sort?: 'newest' | 'oldest' | 'deadline';
}

export const api = {
  auth: {
    register(payload: { name: string; email: string; password: string; roleTitle?: string }) {
      return request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    login(payload: { email: string; password: string }) {
      return request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    me() {
      return request<{ user: UserProfile }>('/api/auth/me');
    },
    updateProfile(payload: {
      name?: string;
      roleTitle?: string;
      preferences?: Partial<UserPreferences>;
    }) {
      return request<{ user: UserProfile }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    changePassword(payload: { currentPassword: string; newPassword: string }) {
      return request<{ message: string }>('/api/auth/password', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
  },
  tasks: {
    list(filters: TaskQueryFilters = {}) {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.category && filters.category !== 'All') params.set('category', filters.category);
      if (filters.priority && filters.priority !== 'All') params.set('priority', filters.priority);
      if (filters.status && filters.status !== 'All') params.set('status', filters.status);
      if (filters.date) params.set('date', filters.date);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.sort) params.set('sort', filters.sort);
      const qs = params.toString();
      return request<{ tasks: TaskItem[]; serverToday: string }>(
        `/api/tasks${qs ? `?${qs}` : ''}`
      );
    },
    listDeleted() {
      return request<{ tasks: TaskItem[] }>('/api/tasks/deleted');
    },
    analytics() {
      return request<{ analytics: AnalyticsSummary; serverToday: string }>('/api/tasks/analytics');
    },
    create(payload: TaskFormPayload) {
      return request<{ task: TaskItem }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    seedStarter() {
      return request<{ tasks: TaskItem[] }>('/api/tasks/seed', {
        method: 'POST',
      });
    },
    update(id: string, payload: Partial<TaskFormPayload>) {
      return request<{ task: TaskItem }>(`/api/tasks/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    remove(id: string, permanent = false) {
      return request<{ deleted: boolean; permanent: boolean }>(
        `/api/tasks/${encodeURIComponent(id)}${permanent ? '?permanent=true' : ''}`,
        { method: 'DELETE' }
      );
    },
    restore(id: string) {
      return request<{ task: TaskItem }>(`/api/tasks/${encodeURIComponent(id)}/restore`, {
        method: 'POST',
      });
    },
    purgeDeleted() {
      return request<{ purgedCount: number }>('/api/tasks/deleted/purge', {
        method: 'DELETE',
      });
    },
  },
};
