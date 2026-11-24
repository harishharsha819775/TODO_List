import { CheckCircle2, Circle } from 'lucide-react';
import { PriorityIndicator, StatusIndicator } from '../components/TaskStatusText';
import type { TaskItem } from '../types/taskflow';
import { addDaysIso, formatDeadlineRelative, formatShortDate } from '../utils/dateUtils';

interface UpcomingPageProps {
  tasks: TaskItem[];
  todayIso: string;
  onSelectTask: (task: TaskItem) => void;
  onQuickStatusChange: (task: TaskItem, status: 'Not Started' | 'In Progress' | 'Completed') => void;
}

export function UpcomingPage({
  tasks,
  todayIso,
  onSelectTask,
  onQuickStatusChange,
}: UpcomingPageProps) {
  const tomorrowIso = addDaysIso(todayIso, 1);
  const nextWeekEndIso = addDaysIso(todayIso, 7);

  const pending = tasks
    .filter((t) => t.status !== 'Completed')
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const groups: Array<{
    key: string;
    title: string;
    subtitle: string;
    items: TaskItem[];
    urgentAccent?: boolean;
  }> = [
    {
      key: 'overdue',
      title: 'Overdue',
      subtitle: 'Past deadline and requiring immediate resolution',
      items: pending.filter((t) => t.deadline < todayIso),
      urgentAccent: true,
    },
    {
      key: 'today',
      title: 'Due Today',
      subtitle: formatShortDate(todayIso),
      items: pending.filter((t) => t.deadline === todayIso),
    },
    {
      key: 'tomorrow',
      title: 'Tomorrow',
      subtitle: formatShortDate(tomorrowIso),
      items: pending.filter((t) => t.deadline === tomorrowIso),
    },
    {
      key: 'week',
      title: 'This Week (Next 7 Days)',
      subtitle: `${formatShortDate(addDaysIso(todayIso, 2))} – ${formatShortDate(nextWeekEndIso)}`,
      items: pending.filter((t) => t.deadline > tomorrowIso && t.deadline <= nextWeekEndIso),
    },
    {
      key: 'later',
      title: 'Later This Month & Beyond',
      subtitle: `After ${formatShortDate(nextWeekEndIso)}`,
      items: pending.filter((t) => t.deadline > nextWeekEndIso),
    },
  ];

  // Weekly 7-day column planner strip
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDaysIso(todayIso, i);
    const d = new Date(`${date}T12:00:00`);
    const dayLabel =
      i === 0
        ? 'Today'
        : i === 1
          ? 'Tomorrow'
          : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const dayTasks = tasks.filter((t) => t.deadline === date);
    return { date, dayLabel, dayTasks };
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="mb-4">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            7-Day Weekly Planner
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Deadlines distributed across the next seven days
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((col) => (
            <div
              key={col.date}
              className={`rounded-lg border p-3 flex flex-col gap-2 min-h-32 ${
                col.date === todayIso
                  ? 'border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40'
              }`}
            >
              <div className="flex items-center justify-between gap-1 border-b border-slate-200/70 dark:border-slate-800 pb-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {col.dayLabel}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {col.dayTasks.length}
                </span>
              </div>
              {col.dayTasks.length === 0 ? (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 my-auto text-center">
                  Clear
                </p>
              ) : (
                <div className="space-y-1.5">
                  {col.dayTasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelectTask(t)}
                      className="w-full text-left rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 hover:border-emerald-500/60 transition-colors"
                    >
                      <p
                        className={`text-xs font-medium truncate ${
                          t.status === 'Completed'
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {t.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {t.category} · {t.priority}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-4">
        {groups.map((group) => (
          <section
            key={group.key}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
          >
            <div className="flex items-baseline justify-between gap-4 mb-3">
              <div>
                <h3
                  className={`font-display text-base font-semibold ${
                    group.urgentAccent && group.items.length > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {group.title} ({group.items.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {group.subtitle}
                </p>
              </div>
            </div>

            {group.items.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-2">
                No tasks in this timeframe.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {group.items.map((task) => {
                  const isDone = task.status === 'Completed';
                  return (
                    <div
                      key={task.id}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() =>
                            onQuickStatusChange(task, isDone ? 'In Progress' : 'Completed')
                          }
                          aria-label={`Complete ${task.title}`}
                          className="mt-0.5 text-slate-300 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
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
                            <span className="font-mono tabular-nums">
                              {formatShortDate(task.deadline)} (
                              {formatDeadlineRelative(task.deadline, todayIso)})
                            </span>
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
        ))}
      </div>
    </div>
  );
}
