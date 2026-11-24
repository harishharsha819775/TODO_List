import {
  BarChart3,
  Calendar,
  CalendarClock,
  CheckSquare,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Settings,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { AppPage, UserProfile } from '../types/taskflow';

interface SidebarProps {
  currentPage: AppPage;
  user: UserProfile;
  overdueCount: number;
  todayCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
}

const NAV_ITEMS: Array<{ id: AppPage; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'My Tasks', icon: ListTodo },
  { id: 'today', label: "Today's Tasks", icon: CheckSquare },
  { id: 'upcoming', label: 'Upcoming Tasks', icon: CalendarClock },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  currentPage,
  user,
  overdueCount,
  todayCount,
  mobileOpen,
  onCloseMobile,
  onNavigate,
  onLogout,
}: SidebarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const content = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64">
      <div>
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onNavigate('dashboard');
              onCloseMobile();
            }}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-display font-bold text-sm">
              TF
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
              TaskFlow
            </span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            const badgeCount =
              item.id === 'today' ? todayCount : item.id === 'tasks' ? overdueCount : 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {badgeCount > 0 && (
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      item.id === 'tasks'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-3">
          {!imgFailed && user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {initials || 'TF'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {user.roleTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Sign Out"
            aria-label="Sign Out"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
