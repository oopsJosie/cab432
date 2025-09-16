
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
sqlite3.verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data.sqlite');

export const db = new sqlite3.Database(dbPath);

export async function ensureDb() {
  await run(`PRAGMA journal_mode = WAL;`);
  await run(`CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY,
    owner TEXT NOT NULL,
    filename TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    maxIterations INTEGER NOT NULL,
    palette TEXT,
    createdAt TEXT NOT NULL
  );`);
}

export function run(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

export function all(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function(err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function get(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function(err, row) {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
