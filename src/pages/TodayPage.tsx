import { CheckCircle2, Circle, Plus } from 'lucide-react';
import { PriorityIndicator, StatusIndicator } from '../components/TaskStatusText';
import type { TaskItem } from '../types/taskflow';
import { formatDeadlineRelative, formatShortDate } from '../utils/dateUtils';

interface TodayPageProps {
  tasks: TaskItem[];
  todayIso: string;
  onCreateTaskForToday: () => void;
  onSelectTask: (task: TaskItem) => void;
  onQuickStatusChange: (task: TaskItem, status: 'Not Started' | 'In Progress' | 'Completed') => void;
}

export function TodayPage({
  tasks,
  todayIso,
  onCreateTaskForToday,
  onSelectTask,
  onQuickStatusChange,
}: TodayPageProps) {
  const overdueTasks = tasks
    .filter((t) => t.status === 'Overdue')
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const dueTodayTasks = tasks.filter((t) => t.deadline === todayIso);
  const activeSpanningToday = tasks.filter(
    (t) => t.startDate <= todayIso && t.deadline > todayIso && t.status !== 'Completed'
  );

  const todayCompletedCount = dueTodayTasks.filter((t) => t.status === 'Completed').length;
  const todayPct =
    dueTodayTasks.length > 0 ? Math.round((todayCompletedCount / dueTodayTasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
            Daily Planner · {formatShortDate(todayIso)}
          </p>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            {dueTodayTasks.length === 0
              ? 'No deadlines scheduled for today'
              : `${todayCompletedCount} of ${dueTodayTasks.length} today's tasks completed (${todayPct}%)`}
          </h2>
          <div className="mt-2 h-2 w-full sm:w-80 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
              style={{ width: `${todayPct}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onCreateTaskForToday}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task for Today</span>
        </button>
      </section>

      {overdueTasks.length > 0 && (
        <section className="rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-red-700 dark:text-red-400">
                Overdue Tasks ({overdueTasks.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Past deadline and still pending completion
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {overdueTasks.map((task) => (
              <div key={task.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onQuickStatusChange(task, 'Completed')}
                    aria-label={`Complete ${task.title}`}
                    className="mt-0.5 text-slate-300 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0"
                  >
                    <Circle className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTask(task)}
                    className="text-left min-w-0 flex-1"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate hover:text-emerald-700 dark:hover:text-emerald-400">
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{task.category}</span>
                      <span aria-hidden="true">·</span>
                      <PriorityIndicator priority={task.priority} />
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-red-600 dark:text-red-400">
                        {formatShortDate(task.deadline)} ({formatDeadlineRelative(task.deadline, todayIso)})
                      </span>
                    </div>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onQuickStatusChange(task, 'In Progress')}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  Start Now
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-4">
          Due Today ({dueTodayTasks.length})
        </h3>
        {dueTodayTasks.length === 0 ? (
          <p className="py-6 text-sm text-slate-500 dark:text-slate-400 text-center">
            No tasks have a deadline set for today.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {dueTodayTasks.map((task) => {
              const isDone = task.status === 'Completed';
              return (
                <div key={task.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() =>
                        onQuickStatusChange(task, isDone ? 'In Progress' : 'Completed')
                      }
                      aria-label={isDone ? `Reopen ${task.title}` : `Complete ${task.title}`}
                      className={`mt-0.5 shrink-0 ${
                        isDone
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-300 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectTask(task)}
                      className="text-left min-w-0 flex-1"
                    >
                      <p
                        className={`text-sm font-medium truncate ${
                          isDone
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{task.category}</span>
                        <span aria-hidden="true">·</span>
                        <PriorityIndicator priority={task.priority} />
                      </div>
                    </button>
                  </div>
                  <StatusIndicator status={task.status} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-1">
          Active Multi-Day Tasks ({activeSpanningToday.length})
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Tasks already started whose deadlines fall later this week or month
        </p>
        {activeSpanningToday.length === 0 ? (
          <p className="py-4 text-sm text-slate-500 dark:text-slate-400 text-center">
            No multi-day tasks currently in progress.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeSpanningToday.map((task) => (
              <div key={task.id} className="py-3 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => onSelectTask(task)}
                  className="text-left min-w-0 flex-1"
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate hover:text-emerald-700 dark:hover:text-emerald-400">
                    {task.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{task.category}</span>
                    <span aria-hidden="true">·</span>
                    <PriorityIndicator priority={task.priority} />
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Due {formatShortDate(task.deadline)}
                    </span>
                  </div>
                </button>
                <StatusIndicator status={task.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
