import Database from 'better-sqlite3';
import { join } from 'node:path';

const DB_PATH = join(process.cwd(), 'data', 'sign-database', 'sign_themed.db');
const IMAGES_ROOT = join(process.cwd(), 'data', 'sign-database');

declare global {
  var __signDb: Database.Database | undefined;
}

function openDb(): Database.Database {
  const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  db.pragma('journal_mode = OFF');
  db.pragma('query_only = ON');
  return db;
}

export function signDb(): Database.Database {
  if (!globalThis.__signDb) {
    globalThis.__signDb = openDb();
  }
  return globalThis.__signDb;
}

export function signDbImagesRoot(): string {
  return IMAGES_ROOT;
}
