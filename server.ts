import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { initDatabase } from './backend/db.js';
import authRouter from './backend/routes/auth.js';
import resumesRouter from './backend/routes/resumes.js';
import interviewsRouter from './backend/routes/interviews.js';
import questionsRouter from './backend/routes/questions.js';
import reportsRouter from './backend/routes/reports.js';
import questionBankRouter from './backend/routes/questionBank.js';
import analyticsRouter from './backend/routes/analytics.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize Database
  await initDatabase();

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/resumes', resumesRouter);
  app.use('/api/interviews', questionsRouter);
  app.use('/api/interviews', interviewsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/questions', questionBankRouter);
  app.use('/api/analytics', analyticsRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      platform: 'InterviewIQ Local-First'
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middleware in development mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve static build in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`  INTERVIEWIQ — LOCAL-FIRST AI INTERVIEW PLATFORM`);
    console.log(`  Running on: http://localhost:${PORT}`);
    console.log(`  Environment: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`==================================================\n`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
