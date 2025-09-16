
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authRequired } from '../middleware/auth.js';
import { generateMandelbrot } from '../utils/mandelbrot.js';
import { generateJuliaSet } from '../utils/juliaSet.js';
import { run, all, get } from '../db.js';

const router = Router();
const IMAGE_DIR = process.env.IMAGE_DIR || path.join(process.cwd(), 'data', 'images');

// POST /generate  -> CPU-intensive Mandelbrot render
router.post('/generate', authRequired, async (req, res, next) => {
  try {
    const { width=1920, height=1080, maxIterations=1500, palette } = req.body || {};
    const paletteHex = Array.isArray(palette) && palette.length ? palette : undefined;
    const { id, filename } = await generateJuliaSet({ width, height, maxIterations, palette: paletteHex, outDir: IMAGE_DIR });
    const createdAt = new Date().toISOString();
    await run(`INSERT INTO images (id, owner, filename, width, height, maxIterations, palette, createdAt)
               VALUES (?,?,?,?,?,?,?,?)`,
               [id, req.user.username, filename, width, height, maxIterations, JSON.stringify(paletteHex||null), createdAt]);
    res.status(201).json({ id, filename, createdAt });
  } catch (e) {
    next(e);
  }
});

// GET /:id -> metadata
router.get('/:id', authRequired, async (req, res, next) => {
  try {
    const row = await get(`SELECT * FROM images WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { next(e); }
});

// GET /:id/file -> download image
router.get('/:id/file', async (req, res, next) => {
  try {
    const row = await get(`SELECT filename FROM images WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const full = path.join(IMAGE_DIR, row.filename);
    if (!fs.existsSync(full)) return res.status(404).json({ error: 'File not found' });
    res.sendFile(full);
  } catch (e) { next(e); }
});

// GET / -> list with pagination, sort, filter by owner
router.get('/', authRequired, async (req, res, next) => {
  try {
    const {
      page=1, pageSize=10,
      sort='createdAt', order='desc',
      owner
    } = req.query;
    const offset = (parseInt(page)-1) * parseInt(pageSize);
    const where = [];
    const params = [];
    if (owner) { where.push('owner = ?'); params.push(owner); }
    const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';
    const rows = await all(`SELECT * FROM images ${whereSql} ORDER BY ${sort} ${order === 'asc' ? 'ASC' : 'DESC'} LIMIT ? OFFSET ?`, [...params, parseInt(pageSize), offset]);
    res.json({ items: rows, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (e) { next(e); }
});

export default router;
