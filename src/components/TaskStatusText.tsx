import { AlertCircle, CheckCircle2, Circle, Clock, Flag } from 'lucide-react';
import type { TaskPriority, TaskStatus } from '../types/taskflow';

export function StatusIndicator({ status }: { status: TaskStatus }) {
  if (status === 'Completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>Completed</span>
      </span>
    );
  }
  if (status === 'Overdue') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap shrink-0">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Overdue</span>
      </span>
    );
  }
  if (status === 'In Progress') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap shrink-0">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>In Progress</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap shrink-0">
      <Circle className="h-3.5 w-3.5 shrink-0" />
      <span>Not Started</span>
    </span>
  );
}

export function PriorityIndicator({ priority }: { priority: TaskPriority }) {
  const colorClass =
    priority === 'Urgent'
      ? 'text-red-600 dark:text-red-400'
      : priority === 'High'
        ? 'text-amber-700 dark:text-amber-400'
        : priority === 'Medium'
          ? 'text-emerald-700 dark:text-emerald-400'
          : 'text-slate-500 dark:text-slate-400';

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap shrink-0 ${colorClass}`}>
      <Flag className="h-3 w-3 shrink-0" />
      <span>{priority}</span>
    </span>
  );
}
