import { useCallback, useEffect, useState } from 'react';
import { api, setAuthToken } from './api/client';
import { AuthView } from './components/AuthView';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Sidebar } from './components/Sidebar';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { TaskModal } from './components/TaskModal';
import { TopBar } from './components/TopBar';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CalendarPage } from './pages/CalendarPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { TasksPage } from './pages/TasksPage';
import { TodayPage } from './pages/TodayPage';
import { UpcomingPage } from './pages/UpcomingPage';
import type {
  AnalyticsSummary,
  AppPage,
  AuthResponse,
  TaskFormPayload,
  TaskItem,
  UserProfile,
} from './types/taskflow';
import { getTodayIso } from './utils/dateUtils';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = window.localStorage.getItem('taskflow_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<TaskItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [todayIso, setTodayIso] = useState<string>(getTodayIso);
  const [loadingData, setLoadingData] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Modal & Drawer State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Confirm Dialog State
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem('taskflow_theme', theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const refreshWorkspace = useCallback(async () => {
    setLoadingData(true);
    setBannerError(null);
    try {
      const [tasksRes, deletedRes, analyticsRes] = await Promise.all([
        api.tasks.list(),
        api.tasks.listDeleted(),
        api.tasks.analytics(),
      ]);
      setTasks(tasksRes.tasks);
      setTodayIso(tasksRes.serverToday);
      setDeletedTasks(deletedRes.tasks);
      setAnalytics(analyticsRes.analytics);

      setSelectedTask((prev) => {
        if (!prev) return null;
        return tasksRes.tasks.find((t) => t.id === prev.id) ?? null;
      });
    } catch (err) {
      setBannerError((err as Error).message || 'Failed to sync tasks from server.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void refreshWorkspace();
    }
  }, [user, refreshWorkspace]);

  function handleAuthenticated(auth: AuthResponse) {
    setAuthToken(auth.token);
    setUser(auth.user);
    if (auth.user.preferences?.theme) {
      setTheme(auth.user.preferences.theme);
    }
    if (auth.user.preferences?.defaultPage) {
      setCurrentPage(auth.user.preferences.defaultPage);
    }
  }

  function handleLogout() {
    setAuthToken(null);
    setUser(null);
    setTasks([]);
    setDeletedTasks([]);
    setAnalytics(null);
    setSelectedTask(null);
    setCurrentPage('dashboard');
  }

  async function handleToggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (user) {
      try {
        const res = await api.auth.updateProfile({ preferences: { theme: nextTheme } });
        setUser(res.user);
      } catch {
        // Non-blocking preference sync
      }
    }
  }

  function openCreateModal(date?: string) {
    setEditingTask(null);
    setModalDefaultDate(date);
    setTaskModalOpen(true);
  }

  function openEditModal(task: TaskItem) {
    setEditingTask(task);
    setModalDefaultDate(undefined);
    setTaskModalOpen(true);
  }

  async function handleSaveTask(payload: TaskFormPayload, taskId?: string) {
    if (taskId) {
      await api.tasks.update(taskId, payload);
    } else {
      await api.tasks.create(payload);
    }
    await refreshWorkspace();
  }

  async function handleQuickStatusChange(
    task: TaskItem,
    status: 'Not Started' | 'In Progress' | 'Completed'
  ) {
    try {
      await api.tasks.update(task.id, { status });
      await refreshWorkspace();
    } catch (err) {
      setBannerError((err as Error).message || 'Failed to update task status.');
    }
  }

  function requestDeleteTask(task: TaskItem) {
    setConfirmState({
      open: true,
      title: 'Move Task to Recently Deleted?',
      message: `"${task.title}" will be moved to Recently Deleted where you can restore it later or delete it permanently.`,
      confirmLabel: 'Move to Trash',
      onConfirm: async () => {
        await api.tasks.remove(task.id, false);
        if (selectedTask?.id === task.id) setSelectedTask(null);
        await refreshWorkspace();
      },
    });
  }

  function requestPermanentDeleteTask(task: TaskItem) {
    setConfirmState({
      open: true,
      title: 'Delete Task Permanently?',
      message: `This will permanently remove "${task.title}" from the database. This action cannot be undone.`,
      confirmLabel: 'Delete Forever',
      onConfirm: async () => {
        await api.tasks.remove(task.id, true);
        await refreshWorkspace();
      },
    });
  }

  function requestPurgeDeleted() {
    setConfirmState({
      open: true,
      title: 'Empty Recently Deleted?',
      message: `All ${deletedTasks.length} deleted tasks will be permanently removed from your account.`,
      confirmLabel: 'Empty Trash',
      onConfirm: async () => {
        await api.tasks.purgeDeleted();
        await refreshWorkspace();
      },
    });
  }

  async function handleRestoreTask(task: TaskItem) {
    try {
      await api.tasks.restore(task.id);
      await refreshWorkspace();
    } catch (err) {
      setBannerError((err as Error).message || 'Failed to restore task.');
    }
  }

  async function handleSeedWorkspace() {
    setSeeding(true);
    setBannerError(null);
    try {
      await api.tasks.seedStarter();
      await refreshWorkspace();
    } catch (err) {
      setBannerError((err as Error).message || 'Failed to populate starter tasks.');
    } finally {
      setSeeding(false);
    }
  }

  if (!user) {
    return (
      <AuthView
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  const overdueCount = tasks.filter((t) => t.status === 'Overdue').length;
  const todayCount = tasks.filter((t) => t.deadline === todayIso && t.status !== 'Completed').length;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        currentPage={currentPage}
        user={user}
        overdueCount={overdueCount}
        todayCount={todayCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          currentPage={currentPage}
          theme={theme}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onToggleTheme={handleToggleTheme}
          onOpenNewTask={() => openCreateModal()}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {bannerError && (
            <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              <span>{bannerError}</span>
              <button
                type="button"
                onClick={() => setBannerError(null)}
                className="text-xs font-medium underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {currentPage === 'dashboard' && (
            <DashboardPage
              tasks={tasks}
              analytics={analytics}
              todayIso={todayIso}
              loading={loadingData}
              seeding={seeding}
              onCreateTask={() => openCreateModal()}
              onSeedSampleWorkspace={handleSeedWorkspace}
              onNavigate={setCurrentPage}
              onSelectTask={setSelectedTask}
              onToggleComplete={(task) =>
                handleQuickStatusChange(
                  task,
                  task.status === 'Completed' ? 'In Progress' : 'Completed'
                )
              }
            />
          )}

          {currentPage === 'tasks' && (
            <TasksPage
              tasks={tasks}
              deletedTasks={deletedTasks}
              todayIso={todayIso}
              defaultView={user.preferences.defaultView}
              loading={loadingData}
              onCreateTask={() => openCreateModal()}
              onSelectTask={setSelectedTask}
              onEditTask={openEditModal}
              onDeleteTask={requestDeleteTask}
              onPermanentDeleteTask={requestPermanentDeleteTask}
              onRestoreTask={handleRestoreTask}
              onPurgeDeleted={requestPurgeDeleted}
              onQuickStatusChange={handleQuickStatusChange}
            />
          )}

          {currentPage === 'today' && (
            <TodayPage
              tasks={tasks}
              todayIso={todayIso}
              onCreateTaskForToday={() => openCreateModal(todayIso)}
              onSelectTask={setSelectedTask}
              onQuickStatusChange={handleQuickStatusChange}
            />
          )}

          {currentPage === 'upcoming' && (
            <UpcomingPage
              tasks={tasks}
              todayIso={todayIso}
              onSelectTask={setSelectedTask}
              onQuickStatusChange={handleQuickStatusChange}
            />
          )}

          {currentPage === 'calendar' && (
            <CalendarPage
              tasks={tasks}
              todayIso={todayIso}
              onSelectTask={setSelectedTask}
              onCreateTaskForDate={(iso) => openCreateModal(iso)}
              onQuickStatusChange={handleQuickStatusChange}
            />
          )}

          {currentPage === 'analytics' && (
            <AnalyticsPage
              analytics={analytics}
              loading={loadingData}
              onCreateTask={() => openCreateModal()}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              user={user}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onUserUpdated={setUser}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      <TaskModal
        open={taskModalOpen}
        editingTask={editingTask}
        defaultDate={modalDefaultDate}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      <TaskDetailDrawer
        task={selectedTask}
        todayIso={todayIso}
        onClose={() => setSelectedTask(null)}
        onEdit={(task) => {
          setSelectedTask(null);
          openEditModal(task);
        }}
        onDelete={requestDeleteTask}
        onQuickStatusChange={handleQuickStatusChange}
      />

      <ConfirmDialog
        open={Boolean(confirmState?.open)}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        confirmLabel={confirmState?.confirmLabel ?? 'Confirm'}
        loading={confirmLoading}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          if (!confirmState) return;
          setConfirmLoading(true);
          try {
            await confirmState.onConfirm();
            setConfirmState(null);
          } catch (err) {
            setBannerError((err as Error).message || 'Action failed.');
            setConfirmState(null);
          } finally {
            setConfirmLoading(false);
          }
        }}
      />
    </div>
  );
}
