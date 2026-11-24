import { useState } from 'react';
import type {
  AnalyticsSummary,
  CategoryStat,
  DailyCompletionPoint,
  WeeklyTrendPoint,
} from '../types/taskflow';

export function DailyCompletionChart({
  data,
  days = 7,
}: {
  data: DailyCompletionPoint[];
  days?: 7 | 14;
}) {
  const slice = data.slice(-days);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(2, ...slice.map((d) => Math.max(d.completed, d.created)));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-500 inline-block" />
            <span>Completed</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-slate-300 dark:bg-slate-700 inline-block" />
            <span>Created</span>
          </span>
        </div>
        {hoveredIdx !== null && slice[hoveredIdx] && (
          <div className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300">
            {slice[hoveredIdx].label}: {slice[hoveredIdx].completed} completed ·{' '}
            {slice[hoveredIdx].created} created
          </div>
        )}
      </div>

      <div className="grid gap-2 items-end h-44 pt-4" style={{ gridTemplateColumns: `repeat(${slice.length}, minmax(0, 1fr))` }}>
        {slice.map((point, idx) => {
          const compPct = Math.round((point.completed / maxVal) * 100);
          const createdPct = Math.round((point.created / maxVal) * 100);
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={point.date}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex flex-col items-center h-full justify-end group cursor-default"
            >
              <div className="w-full flex items-end justify-center gap-1 h-32">
                <div
                  className={`w-2.5 sm:w-3 rounded-t-sm transition-all duration-150 ${
                    isHovered
                      ? 'bg-emerald-500 dark:bg-emerald-400'
                      : 'bg-emerald-600 dark:bg-emerald-500'
                  }`}
                  style={{ height: `${Math.max(point.completed > 0 ? 10 : 3, compPct)}%` }}
                  title={`${point.label}: ${point.completed} completed`}
                />
                <div
                  className={`w-2.5 sm:w-3 rounded-t-sm transition-all duration-150 ${
                    isHovered
                      ? 'bg-slate-400 dark:bg-slate-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  style={{ height: `${Math.max(point.created > 0 ? 10 : 3, createdPct)}%` }}
                  title={`${point.label}: ${point.created} created`}
                />
              </div>
              <span className="mt-2 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate max-w-full">
                {days === 14 ? point.label.replace(/\s+/, ' ') : point.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StatusDonutChart({ analytics }: { analytics: AnalyticsSummary }) {
  const total = analytics.totalTasks;
  const segments = [
    {
      label: 'Completed',
      count: analytics.completedTasks,
      color: '#16a34a',
      textClass: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'In Progress',
      count: analytics.inProgressTasks,
      color: '#d97706',
      textClass: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Not Started',
      count: analytics.notStartedTasks,
      color: '#64748b',
      textClass: 'text-slate-600 dark:text-slate-400',
    },
    {
      label: 'Overdue',
      count: analytics.overdueTasks,
      color: '#dc2626',
      textClass: 'text-red-600 dark:text-red-400',
    },
  ];

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  const completionPct = total > 0 ? Math.round((analytics.completedTasks / total) * 100) : 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90">
          <circle
            cx="66"
            cy="66"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            className="text-slate-100 dark:text-slate-800"
          />
          {total > 0 &&
            segments.map((seg) => {
              if (seg.count === 0) return null;
              const fraction = seg.count / total;
              const dash = fraction * circumference;
              const offset = -cumulative * circumference;
              cumulative += fraction;
              return (
                <circle
                  key={seg.label}
                  cx="66"
                  cy="66"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="14"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {completionPct}%
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Complete</span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
          return (
            <div key={seg.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-slate-700 dark:text-slate-300">{seg.label}</span>
              </div>
              <div className="font-mono tabular-nums text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{seg.count}</span>{' '}
                ({pct}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CategoryDistributionChart({ data }: { data: CategoryStat[] }) {
  const maxTotal = Math.max(1, ...data.map((d) => d.total));

  return (
    <div className="space-y-3.5">
      {data.map((cat) => {
        const barWidth = Math.round((cat.total / maxTotal) * 100);
        const completedInnerWidth = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
        return (
          <div key={cat.category} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {cat.category}
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {cat.completed}/{cat.total} done ({cat.percentage}% share)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden transition-all duration-200"
                style={{ width: `${cat.total > 0 ? Math.max(6, barWidth) : 0}%` }}
              >
                <div
                  className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-200"
                  style={{ width: `${completedInnerWidth}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WeeklyTrendChart({ data }: { data: WeeklyTrendPoint[] }) {
  const width = 420;
  const height = 160;
  const padX = 28;
  const padY = 20;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = data.map((item, index) => {
    const x =
      data.length > 1 ? padX + (index / (data.length - 1)) * innerW : padX + innerW / 2;
    const y = padY + innerH - (item.rate / 100) * innerH;
    return { ...item, x, y };
  });

  const linePath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padY + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padY + innerH).toFixed(1)} Z`
      : '';

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
        <defs>
          <linearGradient id="tfWeeklyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0, 50, 100].map((tick) => {
          const y = padY + innerH - (tick / 100) * innerH;
          return (
            <g key={tick}>
              <line
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke="currentColor"
                strokeDasharray="3 3"
                className="text-slate-200 dark:text-slate-800"
              />
              <text
                x={padX - 6}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-mono"
              >
                {tick}%
              </text>
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill="url(#tfWeeklyGrad)" />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map((p) => (
          <g key={p.weekLabel}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4.5"
              className="fill-white dark:fill-slate-900 stroke-emerald-600 dark:stroke-emerald-400"
              strokeWidth="2.5"
            />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              className="fill-slate-700 dark:fill-slate-200 text-[10px] font-mono font-semibold"
            >
              {p.rate}%
            </text>
            <text
              x={p.x}
              y={height - 2}
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400 text-[10px]"
            >
              {p.weekLabel}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
