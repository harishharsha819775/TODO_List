export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysIso(baseIso: string, days: number): string {
  const d = new Date(`${baseIso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatShortDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMonthDay(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDeadlineRelative(deadline: string, todayIso: string): string {
  if (deadline === todayIso) return 'Due today';
  const tomorrow = addDaysIso(todayIso, 1);
  if (deadline === tomorrow) return 'Due tomorrow';
  const yesterday = addDaysIso(todayIso, -1);
  if (deadline === yesterday) return '1 day overdue';
  if (deadline < todayIso) {
    const diffMs =
      new Date(`${todayIso}T12:00:00`).getTime() - new Date(`${deadline}T12:00:00`).getTime();
    const diffDays = Math.round(diffMs / 86400000);
    return `${diffDays} days overdue`;
  }
  const diffMs =
    new Date(`${deadline}T12:00:00`).getTime() - new Date(`${todayIso}T12:00:00`).getTime();
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays <= 7) return `In ${diffDays} days`;
  return formatMonthDay(deadline);
}

export interface CalendarCell {
  isoDate: string;
  dayNumber: number;
  inCurrentMonth: boolean;
}

export function buildMonthGrid(year: number, monthZeroIndexed: number): CalendarCell[] {
  const firstOfMonth = new Date(year, monthZeroIndexed, 1, 12, 0, 0);
  const startDayOfWeek = firstOfMonth.getDay(); // 0=Sun..6=Sat
  // Monday-first grid: Mon=0..Sun=6
  const mondayOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const gridStart = new Date(year, monthZeroIndexed, 1 - mondayOffset, 12, 0, 0);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);
    const y = cellDate.getFullYear();
    const m = String(cellDate.getMonth() + 1).padStart(2, '0');
    const d = String(cellDate.getDate()).padStart(2, '0');
    cells.push({
      isoDate: `${y}-${m}-${d}`,
      dayNumber: cellDate.getDate(),
      inCurrentMonth: cellDate.getMonth() === monthZeroIndexed,
    });
  }
  return cells;
}
