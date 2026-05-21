import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';
import { cleanupOldFiles, ensureDirectories } from './utils/fileManager';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

ensureDirectories();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', apiRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

// Cleanup old uploaded files every hour
cron.schedule('0 * * * *', () => {
  console.log('[Cron] Cleaning up old files...');
  cleanupOldFiles();
});

app.listen(PORT, () => {
  console.log(`\n🚀 PDF Studio Backend running at http://localhost:${PORT}`);
  console.log(`   Frontend URL: ${FRONTEND_URL}\n`);
});

export default app;
