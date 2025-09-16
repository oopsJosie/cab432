
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import authRouter from './routes/auth.js';
import imagesRouter from './routes/images.js';
import palettesRouter from './routes/palettes.js';
import { ensureDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '10mb' }));

// Ensure DB is ready
await ensureDb();

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// API v1
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/images', imagesRouter);
app.use('/api/v1/palettes', palettesRouter);

// Static web client
app.use('/', express.static(path.join(__dirname, '..', 'public')));

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

export default app;
