import { Menu, Moon, Plus, Sun } from 'lucide-react';
import type { AppPage } from '../types/taskflow';

interface TopBarProps {
  currentPage: AppPage;
  theme: 'light' | 'dark';
  onOpenMobileMenu: () => void;
  onToggleTheme: () => void;
  onOpenNewTask: () => void;
}

const PAGE_TITLES: Record<AppPage, string> = {
  dashboard: 'Dashboard',
  tasks: 'My Tasks',
  today: "Today's Tasks",
  upcoming: 'Upcoming Tasks',
  calendar: 'Calendar',
  analytics: 'Analytics',
  settings: 'Settings',
};

export function TopBar({
  currentPage,
  theme,
  onOpenMobileMenu,
  onToggleTheme,
  onOpenNewTask,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="hidden sm:inline text-slate-400 dark:text-slate-500">Workspace</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
          <h1 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
            {PAGE_TITLES[currentPage]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onOpenNewTask}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}
