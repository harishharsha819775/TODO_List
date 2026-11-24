import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Edit3,
  LayoutGrid,
  List,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { PriorityIndicator, StatusIndicator } from '../components/TaskStatusText';
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskItem,
  type TaskSortOption,
  type TaskViewMode,
} from '../types/taskflow';
import { formatDeadlineRelative, formatShortDate } from '../utils/dateUtils';

interface TasksPageProps {
  tasks: TaskItem[];
  deletedTasks: TaskItem[];
  todayIso: string;
  defaultView: TaskViewMode;
  loading: boolean;
  onCreateTask: () => void;
  onSelectTask: (task: TaskItem) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
  onPermanentDeleteTask: (task: TaskItem) => void;
  onRestoreTask: (task: TaskItem) => void;
  onPurgeDeleted: () => void;
  onQuickStatusChange: (task: TaskItem, status: 'Not Started' | 'In Progress' | 'Completed') => void;
}

export function TasksPage({
  tasks,
  deletedTasks,
  todayIso,
  defaultView,
  loading,
  onCreateTask,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onPermanentDeleteTask,
  onRestoreTask,
  onPurgeDeleted,
  onQuickStatusChange,
}: TasksPageProps) {
  const [tab, setTab] = useState<'active' | 'deleted'>('active');
  const [viewMode, setViewMode] = useState<TaskViewMode>(defaultView);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<TaskSortOption>('newest');

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = tasks.filter((t) => {
      if (q) {
        const hay = `${t.title} ${t.description} ${t.notes} ${t.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (dateFilter && t.deadline !== dateFilter && t.startDate !== dateFilter) return false;
      return true;
    });

    const sorted = [...list];
    if (sortBy === 'oldest') {
      sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } else if (sortBy === 'deadline') {
      sorted.sort((a, b) => a.deadline.localeCompare(b.deadline));
    } else {
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [tasks, search, categoryFilter, priorityFilter, statusFilter, dateFilter, sortBy]);

  function clearFilters() {
    setSearch('');
    setCategoryFilter('All');
    setPriorityFilter('All');
    setStatusFilter('All');
    setDateFilter('');
    setSortBy('newest');
  }

  const hasActiveFilters =
    search !== '' ||
    categoryFilter !== 'All' ||
    priorityFilter !== 'All' ||
    statusFilter !== 'All' ||
    dateFilter !== '';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 self-start">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              tab === 'active'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('deleted')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              tab === 'deleted'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Recently Deleted ({deletedTasks.length})
          </button>
        </div>

        {tab === 'active' ? (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'list'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  viewMode === 'card'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
            </div>
          </div>
        ) : (
          deletedTasks.length > 0 && (
            <button
              type="button"
              onClick={onPurgeDeleted}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors whitespace-nowrap self-end sm:self-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Empty Recently Deleted</span>
            </button>
          )
        )}
      </div>

      {tab === 'active' && (
        <>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="lg:col-span-2 relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks by keyword, notes, or category..."
                  aria-label="Search tasks"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-emerald-600 focus:outline-none"
              >
                <option value="All">All Categories</option>
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                aria-label="Filter by priority"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-emerald-600 focus:outline-none"
              >
                <option value="All">All Priorities</option>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-emerald-600 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as TaskSortOption)}
                  aria-label="Sort tasks"
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-emerald-600 focus:outline-none"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="deadline">Sort: Deadline</option>
                </select>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>Date filter:</span>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 text-xs font-mono tabular-nums text-slate-800 dark:text-slate-200"
                  />
                </label>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
              <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {hasActiveFilters ? 'No tasks match your current filters' : 'No tasks created yet'}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {hasActiveFilters
                  ? 'Try adjusting your search keywords or clearing active filters.'
                  : 'Create your first task to start organizing your schedule.'}
              </p>
              <div className="mt-4 flex justify-center gap-3">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onCreateTask}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-medium text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Task</span>
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/50">
                    <th className="py-3 pl-4 pr-2 w-10">Done</th>
                    <th className="py-3 px-3">Task</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Deadline</th>
                    <th className="py-3 pl-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredTasks.map((task) => {
                    const isDone = task.status === 'Completed';
                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 pl-4 pr-2">
                          <button
                            type="button"
                            onClick={() =>
                              onQuickStatusChange(task, isDone ? 'In Progress' : 'Completed')
                            }
                            aria-label={
                              isDone
                                ? `Reopen ${task.title}`
                                : `Mark ${task.title} as completed`
                            }
                            className={`transition-colors ${
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
                        </td>
                        <td className="py-2.5 px-3 max-w-xs sm:max-w-sm">
                          <button
                            type="button"
                            onClick={() => onSelectTask(task)}
                            className="text-left w-full group"
                          >
                            <p
                              className={`font-medium truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 ${
                                isDone
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {task.description}
                              </p>
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {task.category}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <PriorityIndicator priority={task.priority} />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusIndicator status={task.status} />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`text-xs font-mono tabular-nums ${
                              task.status === 'Overdue'
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {formatShortDate(task.deadline)}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditTask(task)}
                              title="Edit task"
                              aria-label={`Edit ${task.title}`}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTask(task)}
                              title="Delete task"
                              aria-label={`Delete ${task.title}`}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTasks.map((task) => {
                const isDone = task.status === 'Completed';
                return (
                  <article
                    key={task.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4 hover:border-emerald-500/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onSelectTask(task)}
                          className="text-left flex-1 min-w-0"
                        >
                          <h3
                            className={`font-display text-base font-semibold leading-snug ${
                              isDone
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400'
                            }`}
                          >
                            {task.title}
                          </h3>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onQuickStatusChange(task, isDone ? 'In Progress' : 'Completed')
                          }
                          aria-label={isDone ? `Reopen ${task.title}` : `Complete ${task.title}`}
                          className={`shrink-0 ${
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
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{task.category}</span>
                        <span aria-hidden="true">·</span>
                        <PriorityIndicator priority={task.priority} />
                        <span aria-hidden="true">·</span>
                        <StatusIndicator status={task.status} />
                      </div>

                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {task.description || 'No description added.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-mono tabular-nums ${
                          task.status === 'Overdue'
                            ? 'text-red-600 dark:text-red-400 font-medium'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {formatShortDate(task.deadline)} ({formatDeadlineRelative(task.deadline, todayIso)})
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditTask(task)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          aria-label={`Edit ${task.title}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          aria-label={`Delete ${task.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'deleted' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {deletedTasks.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Recently deleted is empty
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Deleted tasks appear here so you can restore them or remove them permanently.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {deletedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {task.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {task.category} · Deadline {formatShortDate(task.deadline)}
                      {task.deletedAt ? ` · Deleted ${new Date(task.deletedAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onRestoreTask(task)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors whitespace-nowrap"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restore</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPermanentDeleteTask(task)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Forever</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
