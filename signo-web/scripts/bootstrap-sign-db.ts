#!/usr/bin/env tsx
/**
 * Populate signo-web/data/sign-database/ from the upstream 手语词典 snapshot.
 *
 * Default source: `<repo>/sign-language-database` (sibling of signo-web).
 * Override with env var SIGN_DB_SRC.
 *
 * Idempotent: files with identical size+mtime are skipped.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SRC = resolve(
  process.env.SIGN_DB_SRC ?? join(process.cwd(), '..', 'sign-language-database')
);
const DEST = resolve(process.cwd(), 'data', 'sign-database');

function die(msg: string): never {
  console.error(`[bootstrap-sign-db] ${msg}`);
  process.exit(1);
}

function sameFile(a: string, b: string): boolean {
  if (!existsSync(b)) return false;
  const sa = statSync(a);
  const sb = statSync(b);
  return sa.size === sb.size && Math.abs(sa.mtimeMs - sb.mtimeMs) < 2000;
}

function copyIfChanged(src: string, dest: string): 'copied' | 'skipped' {
  if (sameFile(src, dest)) return 'skipped';
  cpSync(src, dest, { preserveTimestamps: true });
  return 'copied';
}

function ensureDir(p: string) {
  mkdirSync(p, { recursive: true });
}

function main() {
  if (!existsSync(SRC)) die(`source not found: ${SRC}. set SIGN_DB_SRC.`);
  const srcDb = join(SRC, 'sign_themed.db');
  const srcImg = join(SRC, 'images');
  if (!existsSync(srcDb)) die(`missing ${srcDb}`);
  if (!existsSync(srcImg)) die(`missing ${srcImg}`);

  ensureDir(DEST);
  ensureDir(join(DEST, 'images'));

  console.log(`[bootstrap-sign-db] src=${SRC}`);
  console.log(`[bootstrap-sign-db] dest=${DEST}`);

  const dbResult = copyIfChanged(srcDb, join(DEST, 'sign_themed.db'));
  console.log(`[bootstrap-sign-db] sign_themed.db: ${dbResult}`);

  const files = readdirSync(srcImg);
  let copied = 0;
  let skipped = 0;
  for (const f of files) {
    const r = copyIfChanged(join(srcImg, f), join(DEST, 'images', f));
    if (r === 'copied') copied++;
    else skipped++;
  }
  console.log(
    `[bootstrap-sign-db] images: ${copied} copied, ${skipped} skipped (of ${files.length})`
  );
}

main();
