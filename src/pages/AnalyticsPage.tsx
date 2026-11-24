import {
  CategoryDistributionChart,
  DailyCompletionChart,
  StatusDonutChart,
  WeeklyTrendChart,
} from '../components/Charts';
import type { AnalyticsSummary } from '../types/taskflow';

interface AnalyticsPageProps {
  analytics: AnalyticsSummary | null;
  loading: boolean;
  onCreateTask: () => void;
}

export function AnalyticsPage({ analytics, loading, onCreateTask }: AnalyticsPageProps) {
  if (loading && !analytics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          />
        ))}
      </div>
    );
  }

  if (!analytics || analytics.totalTasks === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center max-w-xl mx-auto mt-6">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          No analytics data yet
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Add and complete tasks to unlock daily completion velocity, weekly trends, and category distribution analytics.
        </p>
        <button
          type="button"
          onClick={onCreateTask}
          className="mt-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          Create First Task
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Weekly Productivity
          </p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {analytics.weeklyProductivityPct}%
          </p>
          <p className="mt-1 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {analytics.weeklyCompletedCount} of {analytics.weeklyTotalCount} tasks completed
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Monthly Completion Rate
          </p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {analytics.monthlyCompletionRate}%
          </p>
          <p className="mt-1 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {analytics.monthlyCompletedCount} of {analytics.monthlyTotalCount} tasks this month
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Completed vs. Pending
          </p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {analytics.completedTasks} / {analytics.pendingTasks}
          </p>
          <p className="mt-1 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {analytics.overdueTasks} currently overdue
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Completed Today
          </p>
          <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {analytics.completedTodayTasks}
          </p>
          <p className="mt-1 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {analytics.dueTodayTasks} still due today
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="mb-2">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Daily Task Completion (14 Days)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hover over any day to inspect completed vs. newly created task volume
            </p>
          </div>
          <DailyCompletionChart data={analytics.dailyCompletion} days={14} />
        </div>

        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="mb-2">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Weekly Productivity Trend
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Completion percentage across the last four weeks
            </p>
          </div>
          <WeeklyTrendChart data={analytics.weeklyTrend} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="mb-4">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Category-Wise Task Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Green fill indicates completed tasks within each category
            </p>
          </div>
          <CategoryDistributionChart data={analytics.categoryDistribution} />
        </div>

        <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-4">
              Completed vs. Pending Breakdown
            </h2>
            <StatusDonutChart analytics={analytics} />
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Priority Completion Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {analytics.priorityBreakdown.map((item) => (
                <div
                  key={item.priority}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3"
                >
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {item.priority}
                  </p>
                  <p className="mt-1 text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {item.completed}/{item.total}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
