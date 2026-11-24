import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.ts';
import authRoutes from './server/routes/auth.ts';
import taskRoutes from './server/routes/tasks.ts';

async function bootstrap() {
  const dbInfo = await initDatabase();

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, engine: dbInfo.engine });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);

  // Return JSON 404 for unknown API paths
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  // Always listen on port 3000 in AI Studio preview unless overridden explicitly by PORT=3000
  const listenPort = process.env.NODE_ENV === 'production' ? port : 3000;
  app.listen(listenPort, '0.0.0.0', () => {
    console.log(`[TaskFlow] Server listening on http://0.0.0.0:${listenPort} (${dbInfo.engine})`);
  });
}

bootstrap().catch((err) => {
  console.error('[TaskFlow] Fatal startup error:', err);
  process.exit(1);
});
