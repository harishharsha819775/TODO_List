import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Moon, ShieldCheck, Sun } from 'lucide-react';
import { api } from '../api/client';
import type { AuthResponse } from '../types/taskflow';

interface AuthViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onAuthenticated: (auth: AuthResponse) => void;
}

export function AuthView({ theme, onToggleTheme, onAuthenticated }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'register') {
        const res = await api.auth.register({
          name: name.trim(),
          email: email.trim(),
          password,
          roleTitle: roleTitle.trim(),
        });
        onAuthenticated(res);
      } else {
        const res = await api.auth.login({
          email: email.trim(),
          password,
        });
        onAuthenticated(res);
      }
    } catch (err) {
      setError((err as Error).message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <header className="flex items-center justify-between gap-8 px-6 sm:px-10 h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-display font-bold text-sm">
            TF
          </span>
          <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0">
            TaskFlow
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <section className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Productivity Workspace
              </p>
              <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white text-balance leading-tight">
                Organize daily work, deadlines, and progress in one focused system.
              </h1>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400">
                Built for students, professionals, and teams to plan daily schedules, detect overdue commitments automatically, and measure weekly completion velocity.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  {
                    title: 'Automated Overdue Detection',
                    desc: 'Deadlines are tracked continuously and surfaced before work slips.',
                  },
                  {
                    title: 'Daily, Weekly & Calendar Planners',
                    desc: 'Switch effortlessly between list grids, task cards, and monthly calendars.',
                  },
                  {
                    title: 'Persistent User-Scoped Storage',
                    desc: 'Your tasks, notes, and analytics remain private to your account.',
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <img
                src="/src/assets/images/avatar_workspace_user_1795507149897.jpg"
                alt="TaskFlow Workspace Member"
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                  Private Account Isolation
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Salted password hashing &amp; verified session tokens</span>
                </p>
              </div>
            </div>
          </section>

          <section className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1 mb-7">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
            </div>

            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {mode === 'register' ? 'Set up your TaskFlow workspace' : 'Welcome back to TaskFlow'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {mode === 'register'
                ? 'Create a personal account to save tasks, schedules, and analytics.'
                : 'Sign in with your email and password to access your tasks.'}
            </p>

            {error && (
              <div className="mt-5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      required
                      minLength={2}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="auth-role"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Role or Focus <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      id="auth-role"
                      type="text"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="e.g., Graduate Student, Product Engineer"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Minimum 8 characters' : 'Enter your password'}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60"
              >
                <span>
                  {submitting
                    ? 'Please wait...'
                    : mode === 'register'
                      ? 'Create Workspace'
                      : 'Sign In to Workspace'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
