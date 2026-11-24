import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Plus } from 'lucide-react';
import { PriorityIndicator, StatusIndicator } from '../components/TaskStatusText';
import type { TaskItem } from '../types/taskflow';
import { buildMonthGrid, formatShortDate } from '../utils/dateUtils';

interface CalendarPageProps {
  tasks: TaskItem[];
  todayIso: string;
  onSelectTask: (task: TaskItem) => void;
  onCreateTaskForDate: (isoDate: string) => void;
  onQuickStatusChange: (task: TaskItem, status: 'Not Started' | 'In Progress' | 'Completed') => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarPage({
  tasks,
  todayIso,
  onSelectTask,
  onCreateTaskForDate,
  onQuickStatusChange,
}: CalendarPageProps) {
  const initialDate = new Date(`${todayIso}T12:00:00`);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayIso);

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const tasksByDeadline = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    for (const task of tasks) {
      const list = map.get(task.deadline) ?? [];
      list.push(task);
      map.set(task.deadline, list);
    }
    return map;
  }, [tasks]);

  const monthLabel = new Date(viewYear, viewMonth, 1, 12, 0, 0).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToday() {
    const d = new Date(`${todayIso}T12:00:00`);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDate(todayIso);
  }

  const selectedDayTasks = useMemo(() => {
    return tasks
      .filter((t) => t.deadline === selectedDate || t.startDate === selectedDate)
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [tasks, selectedDate]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <section className="xl:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {monthLabel}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a date to view scheduled tasks and upcoming deadlines
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Previous month"
              className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Next month"
              className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell) => {
            const dayTasks = tasksByDeadline.get(cell.isoDate) ?? [];
            const hasOverdue = dayTasks.some((t) => t.status === 'Overdue');
            const isToday = cell.isoDate === todayIso;
            const isSelected = cell.isoDate === selectedDate;

            return (
              <button
                key={cell.isoDate}
                type="button"
                onClick={() => setSelectedDate(cell.isoDate)}
                className={`min-h-20 sm:min-h-24 rounded-lg border p-1.5 sm:p-2 text-left flex flex-col justify-between transition-colors ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40'
                    : isToday
                      ? 'border-emerald-400/70 bg-slate-50 dark:bg-slate-800/50'
                      : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                } ${!cell.inCurrentMonth ? 'opacity-45' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono tabular-nums font-semibold ${
                      isToday
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {dayTasks.length > 0 && (
                    <span
                      className={`text-[10px] font-mono tabular-nums font-medium ${
                        hasOverdue
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                <div className="mt-1 space-y-1 w-full overflow-hidden">
                  {dayTasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                        t.status === 'Completed'
                          ? 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 line-through'
                          : t.status === 'Overdue'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-0.5">
                      +{dayTasks.length - 2} more
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="xl:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Selected Date Agenda
            </p>
            <h3 className="mt-1 font-display text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {formatShortDate(selectedDate)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'task' : 'tasks'} scheduled or due
            </p>
          </div>
          <button
            type="button"
            onClick={() => onCreateTaskForDate(selectedDate)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>

        {selectedDayTasks.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No tasks on this date
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Click Add to schedule a task for {formatShortDate(selectedDate)}.
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {selectedDayTasks.map((task) => {
              const isDone = task.status === 'Completed';
              return (
                <div key={task.id} className="py-3 flex items-start gap-3">
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
                      <CheckCircle2 className="h-4.5 w-4.5" />
                    ) : (
                      <Circle className="h-4.5 w-4.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTask(task)}
                    className="text-left min-w-0 flex-1"
                  >
                    <p
                      className={`text-sm font-medium ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{task.category}</span>
                      <span aria-hidden="true">·</span>
                      <PriorityIndicator priority={task.priority} />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <StatusIndicator status={task.status} />
                      <span className="text-[11px] font-mono tabular-nums text-slate-400">
                        {task.deadline === selectedDate ? 'Deadline' : 'Starts'}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
