import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  type TaskCategory,
  type TaskFormPayload,
  type TaskItem,
  type TaskPriority,
} from '../types/taskflow';
import { getTodayIso } from '../utils/dateUtils';

interface TaskModalProps {
  open: boolean;
  editingTask: TaskItem | null;
  defaultDate?: string;
  onClose: () => void;
  onSave: (payload: TaskFormPayload, taskId?: string) => Promise<void>;
}

export function TaskModal({
  open,
  editingTask,
  defaultDate,
  onClose,
  onSave,
}: TaskModalProps) {
  const today = getTodayIso();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Work');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<'Not Started' | 'In Progress' | 'Completed'>('Not Started');
  const [startDate, setStartDate] = useState(today);
  const [deadline, setDeadline] = useState(defaultDate || today);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setCategory(editingTask.category);
      setPriority(editingTask.priority);
      setStatus(editingTask.rawStatus);
      setStartDate(editingTask.startDate);
      setDeadline(editingTask.deadline);
      setNotes(editingTask.notes);
    } else {
      const targetDate = defaultDate || today;
      setTitle('');
      setDescription('');
      setCategory('Work');
      setPriority('Medium');
      setStatus('Not Started');
      setStartDate(targetDate < today ? targetDate : today);
      setDeadline(targetDate);
      setNotes('');
    }
  }, [open, editingTask, defaultDate, today]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }
    if (deadline < startDate) {
      setError('Deadline cannot be earlier than the start date.');
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          status,
          startDate,
          deadline,
          notes: notes.trim(),
        },
        editingTask?.id
      );
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Unable to save task.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <h2
            id="task-modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Prepare Q4 Engineering Roadmap"
              maxLength={160}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Detailed Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="Outline key deliverables, scope, or acceptance criteria..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="task-category"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Category
              </label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-status"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'Not Started' | 'In Progress' | 'Completed')
                }
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-start-date"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Start Date
              </label>
              <input
                id="task-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>

            <div>
              <label
                htmlFor="task-deadline"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Deadline
              </label>
              <input
                id="task-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="task-notes"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Optional Notes
            </label>
            <textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={4000}
              placeholder="Links, reminders, or follow-up details..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
