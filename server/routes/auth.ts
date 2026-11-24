import { Router } from 'express';
import {
  hashPassword,
  requireAuth,
  signToken,
  verifyPassword,
  type AuthenticatedRequest,
} from '../auth.ts';
import { db, toPublicUser } from '../db.ts';
import type { AppPage, TaskViewMode } from '../../src/types/taskflow.ts';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_THEMES = new Set(['light', 'dark']);
const VALID_VIEWS = new Set<TaskViewMode>(['list', 'card']);
const VALID_PAGES = new Set<AppPage>([
  'dashboard',
  'tasks',
  'today',
  'upcoming',
  'calendar',
  'analytics',
  'settings',
]);

router.post('/register', async (req, res) => {
  try {
    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const roleTitle = typeof body.roleTitle === 'string' ? body.roleTitle.trim() : '';

    if (name.length < 2 || name.length > 80) {
      res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
      return;
    }
    if (!EMAIL_RE.test(email) || email.length > 160) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = hashPassword(password);
    const created = await db.createUser({
      name,
      email,
      passwordHash,
      roleTitle: roleTitle || 'Productive Individual',
    });

    const token = signToken(created.id, created.email);
    res.status(201).json({
      token,
      user: toPublicUser(created),
    });
  } catch (err) {
    console.error('[Auth Register Error]', err);
    res.status(500).json({ error: 'Unable to create account right now.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const body = req.body ?? {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await db.findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signToken(user.id, user.email);
    res.json({
      token,
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error('[Auth Login Error]', err);
    res.status(500).json({ error: 'Unable to sign in right now.' });
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await db.findUserById(req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    console.error('[Auth Me Error]', err);
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

router.patch('/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = req.body ?? {};
    const patch: Parameters<typeof db.updateUser>[1] = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 80) {
        res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
        return;
      }
      patch.name = body.name.trim();
    }

    if (body.roleTitle !== undefined) {
      if (typeof body.roleTitle !== 'string' || body.roleTitle.trim().length > 80) {
        res.status(400).json({ error: 'Role title must be 80 characters or fewer.' });
        return;
      }
      patch.roleTitle = body.roleTitle.trim() || 'Productive Individual';
    }

    if (body.preferences !== undefined) {
      if (typeof body.preferences !== 'object' || body.preferences === null || Array.isArray(body.preferences)) {
        res.status(400).json({ error: 'Invalid preferences payload.' });
        return;
      }
      const prefs: NonNullable<typeof patch.preferences> = {};
      if (body.preferences.theme !== undefined) {
        if (typeof body.preferences.theme !== 'string' || !VALID_THEMES.has(body.preferences.theme)) {
          res.status(400).json({ error: 'Invalid theme preference.' });
          return;
        }
        prefs.theme = body.preferences.theme as 'light' | 'dark';
      }
      if (body.preferences.defaultView !== undefined) {
        if (
          typeof body.preferences.defaultView !== 'string' ||
          !VALID_VIEWS.has(body.preferences.defaultView as TaskViewMode)
        ) {
          res.status(400).json({ error: 'Invalid default view preference.' });
          return;
        }
        prefs.defaultView = body.preferences.defaultView as TaskViewMode;
      }
      if (body.preferences.defaultPage !== undefined) {
        if (
          typeof body.preferences.defaultPage !== 'string' ||
          !VALID_PAGES.has(body.preferences.defaultPage as AppPage)
        ) {
          res.status(400).json({ error: 'Invalid default page preference.' });
          return;
        }
        prefs.defaultPage = body.preferences.defaultPage as AppPage;
      }
      patch.preferences = prefs;
    }

    const updated = await db.updateUser(req.userId!, patch);
    if (!updated) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }
    res.json({ user: toPublicUser(updated) });
  } catch (err) {
    console.error('[Profile Update Error]', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

router.patch('/password', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = req.body ?? {};
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    const user = await db.findUserById(req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    const updated = await db.updateUser(req.userId!, {
      passwordHash: hashPassword(newPassword),
    });
    if (!updated) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[Password Update Error]', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

export default router;
