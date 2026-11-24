import { Calendar, Edit3, Trash2, X } from 'lucide-react';
import type { TaskItem } from '../types/taskflow';
import { formatDeadlineRelative, formatShortDate } from '../utils/dateUtils';
import { PriorityIndicator, StatusIndicator } from './TaskStatusText';

interface TaskDetailDrawerProps {
  task: TaskItem | null;
  todayIso: string;
  onClose: () => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onQuickStatusChange: (task: TaskItem, status: 'Not Started' | 'In Progress' | 'Completed') => void;
}

export function TaskDetailDrawer({
  task,
  todayIso,
  onClose,
  onEdit,
  onDelete,
  onQuickStatusChange,
}: TaskDetailDrawerProps) {
  if (!task) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-950/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-task-title"
    >
      <div
        className="w-full max-w-lg h-full overflow-y-auto border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{task.category}</span>
            <span aria-hidden="true">·</span>
            <PriorityIndicator priority={task.priority} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Close task details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div>
            <div className="mb-2">
              <StatusIndicator status={task.status} />
            </div>
            <h2
              id="drawer-task-title"
              className="text-xl font-semibold text-slate-900 dark:text-slate-100 leading-snug"
            >
              {task.title}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Start Date</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {formatShortDate(task.startDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Deadline</p>
              <p
                className={`mt-1 flex items-center gap-1.5 text-sm font-mono tabular-nums font-medium ${
                  task.status === 'Overdue'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {formatShortDate(task.deadline)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {task.status === 'Completed'
                  ? 'Finished'
                  : formatDeadlineRelative(task.deadline, todayIso)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Update Status
            </p>
            <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
              {(['Not Started', 'In Progress', 'Completed'] as const).map((opt) => {
                const active = task.rawStatus === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onQuickStatusChange(task, opt)}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Description
            </h3>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {task.description || 'No description provided.'}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Notes
            </h3>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {task.notes || 'No additional notes recorded.'}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 text-xs text-slate-500 dark:text-slate-400 space-y-1 font-mono tabular-nums">
            <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
            {task.completedAt && (
              <p className="text-emerald-600 dark:text-emerald-400">
                Completed: {new Date(task.completedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors whitespace-nowrap shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(task)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit Task</span>
          </button>
        </div>
      </div>
    </div>
  );
}
