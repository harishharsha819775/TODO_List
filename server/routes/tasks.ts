import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../auth.ts';
import { db, getTodayIsoDate, toTaskItem } from '../db.ts';
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  type AnalyticsSummary,
  type CategoryStat,
  type DailyCompletionPoint,
  type PriorityStat,
  type TaskCategory,
  type TaskItem,
  type TaskPriority,
  type WeeklyTrendPoint,
} from '../../src/types/taskflow.ts';

const router = Router();
router.use(requireAuth);

const VALID_CATEGORIES = new Set<string>(TASK_CATEGORIES);
const VALID_PRIORITIES = new Set<string>(TASK_PRIORITIES);
const VALID_BASE_STATUSES = new Set<string>(['Not Started', 'In Progress', 'Completed']);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function addDaysIso(baseIso: string, offsetDays: number): string {
  const d = new Date(`${baseIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function formatShortLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function getMondayOfWeek(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sun, 1 = Mon
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const todayStr = getTodayIsoDate();
    const rawTasks = await db.listTasksForUser(req.userId!, false);
    let items: TaskItem[] = rawTasks.map((t) => toTaskItem(t, todayStr));

    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const priority = typeof req.query.priority === 'string' ? req.query.priority.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const date = typeof req.query.date === 'string' ? req.query.date.trim() : '';
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate.trim() : '';
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate.trim() : '';
    const sort = typeof req.query.sort === 'string' ? req.query.sort.trim() : 'newest';

    if (search) {
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.notes.toLowerCase().includes(search) ||
          t.category.toLowerCase().includes(search)
      );
    }
    if (category && category !== 'All') {
      items = items.filter((t) => t.category === category);
    }
    if (priority && priority !== 'All') {
      items = items.filter((t) => t.priority === priority);
    }
    if (status && status !== 'All') {
      items = items.filter((t) => t.status === status);
    }
    if (date && isValidIsoDate(date)) {
      items = items.filter((t) => t.deadline === date || t.startDate === date);
    }
    if (startDate && isValidIsoDate(startDate)) {
      items = items.filter((t) => t.deadline >= startDate);
    }
    if (endDate && isValidIsoDate(endDate)) {
      items = items.filter((t) => t.deadline <= endDate);
    }

    if (sort === 'oldest') {
      items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } else if (sort === 'deadline') {
      items.sort((a, b) => a.deadline.localeCompare(b.deadline));
    } else {
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    res.json({ tasks: items, serverToday: todayStr });
  } catch (err) {
    console.error('[Tasks List Error]', err);
    res.status(500).json({ error: 'Failed to load tasks.' });
  }
});

router.get('/deleted', async (req: AuthenticatedRequest, res) => {
  try {
    const todayStr = getTodayIsoDate();
    const rawDeleted = await db.listTasksForUser(req.userId!, true);
    const tasks = rawDeleted
      .map((t) => toTaskItem(t, todayStr))
      .sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? ''));
    res.json({ tasks });
  } catch (err) {
    console.error('[Deleted Tasks Error]', err);
    res.status(500).json({ error: 'Failed to load recently deleted tasks.' });
  }
});

router.delete('/deleted/purge', async (req: AuthenticatedRequest, res) => {
  try {
    const count = await db.purgeDeletedTasks(req.userId!);
    res.json({ purgedCount: count });
  } catch (err) {
    console.error('[Purge Deleted Error]', err);
    res.status(500).json({ error: 'Failed to empty recently deleted tasks.' });
  }
});

router.get('/analytics', async (req: AuthenticatedRequest, res) => {
  try {
    const todayStr = getTodayIsoDate();
    const rawTasks = await db.listTasksForUser(req.userId!, false);
    const deletedTasks = await db.listTasksForUser(req.userId!, true);
    const tasks = rawTasks.map((t) => toTaskItem(t, todayStr));

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
    const overdueTasks = tasks.filter((t) => t.status === 'Overdue').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
    const notStartedTasks = tasks.filter((t) => t.status === 'Not Started').length;
    const pendingTasks = totalTasks - completedTasks;
    const dueTodayTasks = tasks.filter((t) => t.deadline === todayStr && t.status !== 'Completed').length;
    const completedTodayTasks = tasks.filter(
      (t) => t.status === 'Completed' && t.completedAt && t.completedAt.slice(0, 10) === todayStr
    ).length;

    const weekStart = getMondayOfWeek(todayStr);
    const weekEnd = addDaysIso(weekStart, 6);
    const weekTasks = tasks.filter(
      (t) =>
        (t.deadline >= weekStart && t.deadline <= weekEnd) ||
        (t.completedAt && t.completedAt.slice(0, 10) >= weekStart && t.completedAt.slice(0, 10) <= weekEnd)
    );
    const weeklyTotalCount = weekTasks.length;
    const weeklyCompletedCount = weekTasks.filter((t) => t.status === 'Completed').length;
    const weeklyProductivityPct =
      weeklyTotalCount > 0 ? Math.round((weeklyCompletedCount / weeklyTotalCount) * 100) : 0;

    const currentMonthPrefix = todayStr.slice(0, 7); // YYYY-MM
    const monthTasks = tasks.filter(
      (t) =>
        t.deadline.startsWith(currentMonthPrefix) ||
        t.startDate.startsWith(currentMonthPrefix) ||
        (t.completedAt && t.completedAt.startsWith(currentMonthPrefix))
    );
    const monthlyTotalCount = monthTasks.length;
    const monthlyCompletedCount = monthTasks.filter((t) => t.status === 'Completed').length;
    const monthlyCompletionRate =
      monthlyTotalCount > 0 ? Math.round((monthlyCompletedCount / monthlyTotalCount) * 100) : 0;

    // Daily completion over last 14 days
    const dailyCompletion: DailyCompletionPoint[] = [];
    for (let offset = -13; offset <= 0; offset++) {
      const dateIso = addDaysIso(todayStr, offset);
      const completedOnDay = tasks.filter(
        (t) => t.status === 'Completed' && t.completedAt && t.completedAt.slice(0, 10) === dateIso
      ).length;
      const createdOnDay = tasks.filter((t) => t.createdAt.slice(0, 10) === dateIso).length;
      dailyCompletion.push({
        date: dateIso,
        label: formatShortLabel(dateIso),
        completed: completedOnDay,
        created: createdOnDay,
      });
    }

    // Weekly trend over last 4 weeks
    const weeklyTrend: WeeklyTrendPoint[] = [];
    for (let w = 3; w >= 0; w--) {
      const start = addDaysIso(weekStart, -7 * w);
      const end = addDaysIso(start, 6);
      const slice = tasks.filter(
        (t) =>
          (t.deadline >= start && t.deadline <= end) ||
          (t.completedAt && t.completedAt.slice(0, 10) >= start && t.completedAt.slice(0, 10) <= end)
      );
      const comp = slice.filter((t) => t.status === 'Completed').length;
      const tot = slice.length;
      weeklyTrend.push({
        weekLabel: w === 0 ? 'This Week' : formatShortLabel(start),
        completed: comp,
        total: tot,
        rate: tot > 0 ? Math.round((comp / tot) * 100) : 0,
      });
    }

    // Category distribution
    const categoryDistribution: CategoryStat[] = TASK_CATEGORIES.map((category: TaskCategory) => {
      const slice = tasks.filter((t) => t.category === category);
      const comp = slice.filter((t) => t.status === 'Completed').length;
      const over = slice.filter((t) => t.status === 'Overdue').length;
      const pend = slice.length - comp;
      return {
        category,
        total: slice.length,
        completed: comp,
        pending: pend,
        overdue: over,
        percentage: totalTasks > 0 ? Math.round((slice.length / totalTasks) * 100) : 0,
      };
    });

    // Priority breakdown
    const priorityBreakdown: PriorityStat[] = TASK_PRIORITIES.map((priority: TaskPriority) => {
      const slice = tasks.filter((t) => t.priority === priority);
      return {
        priority,
        total: slice.length,
        completed: slice.filter((t) => t.status === 'Completed').length,
      };
    });

    const summary: AnalyticsSummary = {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      notStartedTasks,
      overdueTasks,
      dueTodayTasks,
      completedTodayTasks,
      weeklyProductivityPct,
      weeklyCompletedCount,
      weeklyTotalCount,
      monthlyCompletionRate,
      monthlyCompletedCount,
      monthlyTotalCount,
      dailyCompletion,
      weeklyTrend,
      categoryDistribution,
      priorityBreakdown,
      deletedCount: deletedTasks.length,
    };

    res.json({ analytics: summary, serverToday: todayStr });
  } catch (err) {
    console.error('[Analytics Error]', err);
    res.status(500).json({ error: 'Failed to compute analytics.' });
  }
});

router.post('/seed', async (req: AuthenticatedRequest, res) => {
  try {
    const existing = await db.listTasksForUser(req.userId!, false);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Workspace already contains tasks.' });
      return;
    }

    const today = getTodayIsoDate();
    const starterTasks: Array<{
      title: string;
      description: string;
      category: TaskCategory;
      priority: TaskPriority;
      status: 'Not Started' | 'In Progress' | 'Completed';
      startDate: string;
      deadline: string;
      notes: string;
      completedAt?: string | null;
    }> = [
      {
        title: 'Finalize Q4 Sprint Roadmap & Milestones',
        description: 'Align engineering deliverables, QA windows, and release milestones with product stakeholders.',
        category: 'Work',
        priority: 'Urgent',
        status: 'In Progress',
        startDate: addDaysIso(today, -2),
        deadline: today,
        notes: 'Confirm API freeze date before Friday standup.',
      },
      {
        title: 'Submit Distributed Systems Lab Report',
        description: 'Complete Raft consensus benchmark analysis, latency graphs, and bibliography.',
        category: 'Education',
        priority: 'High',
        status: 'Not Started',
        startDate: addDaysIso(today, -1),
        deadline: addDaysIso(today, 2),
        notes: 'Export charts at 300 DPI for appendix.',
      },
      {
        title: 'Evening 5K Tempo Run & Mobility Session',
        description: 'Maintain 5:00/km pace for 3km followed by 15 minutes of hip and ankle mobility.',
        category: 'Health',
        priority: 'Medium',
        status: 'Not Started',
        startDate: today,
        deadline: today,
        notes: 'Hydrate 1 hour prior.',
      },
      {
        title: 'Reconcile Monthly Cloud Infrastructure Budget',
        description: 'Audit database storage growth, egress metrics, and unused staging instances.',
        category: 'Work',
        priority: 'High',
        status: 'Not Started',
        startDate: addDaysIso(today, -5),
        deadline: addDaysIso(today, -1),
        notes: 'Overdue check: verify staging cluster auto-shutdown rule.',
      },
      {
        title: 'Prepare Weekly Study Flashcards (Algorithms)',
        description: 'Review dynamic programming patterns, network flow reductions, and amortized bounds.',
        category: 'Education',
        priority: 'Medium',
        status: 'Completed',
        startDate: addDaysIso(today, -4),
        deadline: addDaysIso(today, -1),
        notes: 'Completed 45 cards with 91% recall.',
        completedAt: `${addDaysIso(today, -1)}T16:30:00.000Z`,
      },
      {
        title: 'Schedule Annual Dental & Vision Checkup',
        description: 'Call clinic to book morning appointment window next week.',
        category: 'Health',
        priority: 'Low',
        status: 'Completed',
        startDate: addDaysIso(today, -3),
        deadline: today,
        notes: 'Booked for Thursday 9:30 AM.',
        completedAt: `${today}T09:15:00.000Z`,
      },
      {
        title: 'Organize Tax Receipts & Expense Folder',
        description: 'Scan paper receipts and categorize Q4 deductible hardware purchases.',
        category: 'Personal',
        priority: 'Low',
        status: 'Not Started',
        startDate: today,
        deadline: addDaysIso(today, 5),
        notes: 'Store encrypted backup copy.',
      },
      {
        title: 'Design System Audit: Dark Mode Contrast Check',
        description: 'Verify WCAG AA 4.5:1 contrast across form controls, table headers, and chart axes.',
        category: 'Work',
        priority: 'High',
        status: 'Completed',
        startDate: addDaysIso(today, -6),
        deadline: addDaysIso(today, -2),
        notes: 'All primary surfaces passed audit.',
        completedAt: `${addDaysIso(today, -2)}T18:00:00.000Z`,
      },
    ];

    const created: TaskItem[] = [];
    for (const item of starterTasks) {
      const record = await db.createTask({
        userId: req.userId!,
        ...item,
      });
      created.push(toTaskItem(record, today));
    }

    res.status(201).json({ tasks: created });
  } catch (err) {
    console.error('[Seed Tasks Error]', err);
    res.status(500).json({ error: 'Failed to populate starter tasks.' });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const taskId = String(req.params.id ?? '');
    const record = await db.findTaskById(req.userId!, taskId);
    if (!record || record.deletedAt !== null) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }
    res.json({ task: toTaskItem(record) });
  } catch (err) {
    console.error('[Get Task Error]', err);
    res.status(500).json({ error: 'Failed to load task.' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const body = req.body ?? {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const category = typeof body.category === 'string' ? body.category : 'Work';
    const priority = typeof body.priority === 'string' ? body.priority : 'Medium';
    const status = typeof body.status === 'string' ? body.status : 'Not Started';
    const todayStr = getTodayIsoDate();
    const startDate = body.startDate !== undefined ? body.startDate : todayStr;
    const deadline = body.deadline !== undefined ? body.deadline : todayStr;
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

    if (title.length < 1 || title.length > 160) {
      res.status(400).json({ error: 'Task title is required and must be 160 characters or fewer.' });
      return;
    }
    if (description.length > 4000) {
      res.status(400).json({ error: 'Description cannot exceed 4000 characters.' });
      return;
    }
    if (notes.length > 4000) {
      res.status(400).json({ error: 'Notes cannot exceed 4000 characters.' });
      return;
    }
    if (!VALID_CATEGORIES.has(category)) {
      res.status(400).json({ error: 'Invalid task category.' });
      return;
    }
    if (!VALID_PRIORITIES.has(priority)) {
      res.status(400).json({ error: 'Invalid task priority.' });
      return;
    }
    if (!VALID_BASE_STATUSES.has(status)) {
      res.status(400).json({ error: 'Invalid task status.' });
      return;
    }
    if (!isValidIsoDate(startDate)) {
      res.status(400).json({ error: 'Start date must be a valid YYYY-MM-DD date.' });
      return;
    }
    if (!isValidIsoDate(deadline)) {
      res.status(400).json({ error: 'Deadline must be a valid YYYY-MM-DD date.' });
      return;
    }
    if (deadline < startDate) {
      res.status(400).json({ error: 'Deadline cannot be earlier than the start date.' });
      return;
    }

    const created = await db.createTask({
      userId: req.userId!,
      title,
      description,
      category: category as TaskCategory,
      priority: priority as TaskPriority,
      status: status as 'Not Started' | 'In Progress' | 'Completed',
      startDate,
      deadline,
      notes,
    });

    res.status(201).json({ task: toTaskItem(created, todayStr) });
  } catch (err) {
    console.error('[Create Task Error]', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const taskId = String(req.params.id ?? '');
    const existing = await db.findTaskById(req.userId!, taskId);
    if (!existing || existing.deletedAt !== null) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const body = req.body ?? {};
    const patch: Parameters<typeof db.updateTask>[2] = {};

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.trim().length > 160) {
        res.status(400).json({ error: 'Title must be between 1 and 160 characters.' });
        return;
      }
      patch.title = body.title.trim();
    }
    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || body.description.length > 4000) {
        res.status(400).json({ error: 'Description cannot exceed 4000 characters.' });
        return;
      }
      patch.description = body.description.trim();
    }
    if (body.notes !== undefined) {
      if (typeof body.notes !== 'string' || body.notes.length > 4000) {
        res.status(400).json({ error: 'Notes cannot exceed 4000 characters.' });
        return;
      }
      patch.notes = body.notes.trim();
    }
    if (body.category !== undefined) {
      if (typeof body.category !== 'string' || !VALID_CATEGORIES.has(body.category)) {
        res.status(400).json({ error: 'Invalid task category.' });
        return;
      }
      patch.category = body.category as TaskCategory;
    }
    if (body.priority !== undefined) {
      if (typeof body.priority !== 'string' || !VALID_PRIORITIES.has(body.priority)) {
        res.status(400).json({ error: 'Invalid task priority.' });
        return;
      }
      patch.priority = body.priority as TaskPriority;
    }
    if (body.status !== undefined) {
      if (typeof body.status !== 'string' || !VALID_BASE_STATUSES.has(body.status)) {
        res.status(400).json({ error: 'Invalid task status.' });
        return;
      }
      patch.status = body.status as 'Not Started' | 'In Progress' | 'Completed';
    }
    if (body.startDate !== undefined) {
      if (!isValidIsoDate(body.startDate)) {
        res.status(400).json({ error: 'Invalid start date.' });
        return;
      }
      patch.startDate = body.startDate;
    }
    if (body.deadline !== undefined) {
      if (!isValidIsoDate(body.deadline)) {
        res.status(400).json({ error: 'Invalid deadline.' });
        return;
      }
      patch.deadline = body.deadline;
    }

    const nextStart = patch.startDate ?? existing.startDate;
    const nextDeadline = patch.deadline ?? existing.deadline;
    if (nextDeadline < nextStart) {
      res.status(400).json({ error: 'Deadline cannot be earlier than the start date.' });
      return;
    }

    const updated = await db.updateTask(req.userId!, taskId, patch);
    if (!updated) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }
    res.json({ task: toTaskItem(updated) });
  } catch (err) {
    console.error('[Update Task Error]', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const taskId = String(req.params.id ?? '');
    const permanent = req.query.permanent === 'true';

    if (permanent) {
      const ok = await db.permanentlyDeleteTask(req.userId!, taskId);
      if (!ok) {
        res.status(404).json({ error: 'Task not found.' });
        return;
      }
      res.json({ deleted: true, permanent: true });
      return;
    }

    const existing = await db.findTaskById(req.userId!, taskId);
    if (!existing || existing.deletedAt !== null) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const updated = await db.updateTask(req.userId!, taskId, {
      deletedAt: new Date().toISOString(),
    });
    res.json({ deleted: true, permanent: false, task: updated ? toTaskItem(updated) : null });
  } catch (err) {
    console.error('[Delete Task Error]', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

router.post('/:id/restore', async (req: AuthenticatedRequest, res) => {
  try {
    const taskId = String(req.params.id ?? '');
    const existing = await db.findTaskById(req.userId!, taskId);
    if (!existing || existing.deletedAt === null) {
      res.status(404).json({ error: 'Deleted task not found.' });
      return;
    }

    const restored = await db.updateTask(req.userId!, taskId, { deletedAt: null });
    if (!restored) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }
    res.json({ task: toTaskItem(restored) });
  } catch (err) {
    console.error('[Restore Task Error]', err);
    res.status(500).json({ error: 'Failed to restore task.' });
  }
});

export default router;
