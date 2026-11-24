import { useState, type FormEvent } from 'react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { api } from '../api/client';
import type { AppPage, TaskViewMode, UserProfile } from '../types/taskflow';

interface SettingsPageProps {
  user: UserProfile;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onUserUpdated: (user: UserProfile) => void;
  onLogout: () => void;
}

export function SettingsPage({
  user,
  theme,
  onToggleTheme,
  onUserUpdated,
  onLogout,
}: SettingsPageProps) {
  const [name, setName] = useState(user.name);
  const [roleTitle, setRoleTitle] = useState(user.roleTitle);
  const [defaultView, setDefaultView] = useState<TaskViewMode>(user.preferences.defaultView);
  const [defaultPage, setDefaultPage] = useState<AppPage>(user.preferences.defaultPage);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    setProfileSaving(true);
    try {
      const res = await api.auth.updateProfile({
        name: name.trim(),
        roleTitle: roleTitle.trim(),
        preferences: {
          theme,
          defaultView,
          defaultPage,
        },
      });
      onUserUpdated(res.user);
      setProfileMessage({ type: 'ok', text: 'Profile and preferences saved.' });
    } catch (err) {
      setProfileMessage({ type: 'err', text: (err as Error).message });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'err', text: 'New passwords do not match.' });
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await api.auth.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'ok', text: res.message });
    } catch (err) {
      setPasswordMessage({ type: 'err', text: (err as Error).message });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          Appearance
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Switch between Light and Dark interface modes
        </p>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="h-5 w-5 text-emerald-500" />
            ) : (
              <Sun className="h-5 w-5 text-emerald-600" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synced with your workspace preferences
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          Profile &amp; Workspace Preferences
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Update your display details and default workspace layout
        </p>

        {profileMessage && (
          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              profileMessage.type === 'ok'
                ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
            }`}
          >
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="settings-name"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Full Name
              </label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="settings-role"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Role Title
              </label>
              <input
                id="settings-role"
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="settings-email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Account Email
            </label>
            <input
              id="settings-email"
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="settings-default-view"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Default My Tasks Format
              </label>
              <select
                id="settings-default-view"
                value={defaultView}
                onChange={(e) => setDefaultView(e.target.value as TaskViewMode)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none"
              >
                <option value="list">List Table</option>
                <option value="card">Card Grid</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="settings-default-page"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Default Landing Page
              </label>
              <select
                id="settings-default-page"
                value={defaultPage}
                onChange={(e) => setDefaultPage(e.target.value as AppPage)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none"
              >
                <option value="dashboard">Dashboard</option>
                <option value="tasks">My Tasks</option>
                <option value="today">Today&apos;s Tasks</option>
                <option value="upcoming">Upcoming Tasks</option>
                <option value="calendar">Calendar</option>
                <option value="analytics">Analytics</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
            >
              {profileSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          Security &amp; Password
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Update your account password
        </p>

        {passwordMessage && (
          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              passwordMessage.type === 'ok'
                ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
            }`}
          >
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="current-password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Current Password
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-5 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 transition-colors disabled:opacity-60"
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Session
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign out of your TaskFlow account on this browser
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-900/60 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors whitespace-nowrap"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </section>
    </div>
  );
}
