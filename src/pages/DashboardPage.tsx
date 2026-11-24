import {
  ArrowRight,
  CheckCircle2,
  FolderPlus,
  Plus,
  Sparkles,
} from 'lucide-react';
import { DailyCompletionChart, StatusDonutChart } from '../components/Charts';
import { PriorityIndicator, StatusIndicator } from '../components/TaskStatusText';
import type { AnalyticsSummary, AppPage, TaskItem } from '../types/taskflow';
import { formatDeadlineRelative } from '../utils/dateUtils';

interface DashboardPageProps {
  tasks: TaskItem[];
  analytics: AnalyticsSummary | null;
  todayIso: string;
  loading: boolean;
  seeding: boolean;
  onCreateTask: () => void;
  onSeedSampleWorkspace: () => void;
  onNavigate: (page: AppPage) => void;
  onSelectTask: (task: TaskItem) => void;
  onToggleComplete: (task: TaskItem) => void;
}

export function DashboardPage({
  tasks,
  analytics,
  todayIso,
  loading,
  seeding,
  onCreateTask,
  onSeedSampleWorkspace,
  onNavigate,
  onSelectTask,
  onToggleComplete,
}: DashboardPageProps) {
  if (loading && !analytics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
          <div className="lg:col-span-5 h-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center max-w-2xl mx-auto mt-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
          <FolderPlus className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-white">
          Your workspace is ready for your first task
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Create a custom task with priorities and deadlines, or populate a sample set of tasks in the database to explore the dashboard and analytics.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCreateTask}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Task</span>
          </button>
          <button
            type="button"
            onClick={onSeedSampleWorkspace}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{seeding ? 'Adding Sample Tasks...' : 'Populate Starter Tasks'}</span>
          </button>
        </div>
      </div>
    );
  }

  const stats = analytics ?? {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === 'Completed').length,
    pendingTasks: tasks.filter((t) => t.status !== 'Completed').length,
    inProgressTasks: tasks.filter((t) => t.status === 'In Progress').length,
    notStartedTasks: tasks.filter((t) => t.status === 'Not Started').length,
    overdueTasks: tasks.filter((t) => t.status === 'Overdue').length,
    dueTodayTasks: tasks.filter((t) => t.deadline === todayIso && t.status !== 'Completed').length,
    completedTodayTasks: 0,
    weeklyProductivityPct: 0,
    weeklyCompletedCount: 0,
    weeklyTotalCount: 0,
    monthlyCompletionRate: 0,
    monthlyCompletedCount: 0,
    monthlyTotalCount: 0,
    dailyCompletion: [],
    weeklyTrend: [],
    categoryDistribution: [],
    priorityBreakdown: [],
    deletedCount: 0,
  };

  const focusTasks = tasks
    .filter((t) => t.status !== 'Completed' && (t.deadline <= todayIso || t.priority === 'Urgent'))
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 6);

  const upcomingTasks = tasks
    .filter((t) => t.status !== 'Completed' && t.deadline > todayIso)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 6);

  const kpis = [
    {
      label: 'Total Tasks',
      value: stats.totalTasks,
      sub: `${stats.inProgressTasks} in progress`,
      accent: 'text-slate-900 dark:text-white',
    },
    {
      label: 'Completed Tasks',
      value: stats.completedTasks,
      sub: `${stats.completedTodayTasks} finished today`,
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Pending Tasks',
      value: stats.pendingTasks,
      sub: `${stats.notStartedTasks} not started`,
      accent: 'text-slate-900 dark:text-white',
    },
    {
      label: 'Overdue Tasks',
      value: stats.overdueTasks,
      sub: stats.overdueTasks > 0 ? 'Needs attention' : 'On schedule',
      accent: stats.overdueTasks > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Due Today',
      value: stats.dueTodayTasks,
      sub: todayIso,
      accent: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Weekly Productivity',
      value: `${stats.weeklyProductivityPct}%`,
      sub: `${stats.weeklyCompletedCount}/${stats.weeklyTotalCount} this week`,
      accent: 'text-emerald-600 dark:text-emerald-400',
      progress: stats.weeklyProductivityPct,
    },
  ];

  return (
    <div className="space-y-6">
      <section aria-label="Task Metrics Summary" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between"
          >
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
            <p className={`mt-2 text-2xl font-bold font-mono tabular-nums ${kpi.accent}`}>
              {kpi.value}
            </p>
            {kpi.progress !== undefined ? (
              <div className="mt-2.5 space-y-1">
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                    style={{ width: `${kpi.progress}%` }}
                  />
                </div>
                <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {kpi.sub}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate">
                {kpi.sub}
              </p>
            )}
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                7-Day Task Activity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily completed vs. newly created tasks
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              <span>Full Analytics</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <DailyCompletionChart data={stats.dailyCompletion} days={7} />
        </div>

        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Completion Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active task status distribution
            </p>
          </div>
          <StatusDonutChart analytics={stats} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Today&apos;s Focus &amp; Overdue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immediate priorities requiring action
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('today')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              <span>Daily Planner</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {focusTasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No overdue or urgent tasks due today. Great momentum.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {focusTasks.map((task) => (
                <div
                  key={task.id}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(task)}
                      title="Mark completed"
                      aria-label={`Mark ${task.title} as completed`}
                      className="mt-0.5 text-slate-300 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
                    >
                      <CheckCircle2 className="h-4.5 w-4.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTask(task)}
                      className="text-left min-w-0 flex-1"
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {task.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{task.category}</span>
                        <span aria-hidden="true">·</span>
                        <PriorityIndicator priority={task.priority} />
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-mono tabular-nums ${
                            task.status === 'Overdue' ? 'text-red-600 dark:text-red-400' : ''
                          }`}
                        >
                          {formatDeadlineRelative(task.deadline, todayIso)}
                        </span>
                      </div>
                    </button>
                  </div>
                  <StatusIndicator status={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Upcoming Deadlines
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled deliverables ahead
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('upcoming')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              <span>View Schedule</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No upcoming deadlines scheduled after today.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onSelectTask(task)}
                  className="w-full py-3 flex items-center justify-between gap-3 text-left group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {task.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{task.category}</span>
                      <span aria-hidden="true">·</span>
                      <PriorityIndicator priority={task.priority} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                      {task.deadline}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatDeadlineRelative(task.deadline, todayIso)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
