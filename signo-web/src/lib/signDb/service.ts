import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { signDb, signDbImagesRoot } from './db';
import type { Meaning, Sign, Theme } from './types';

type SignRow = {
  id: number;
  image_path: string;
  description: string;
  source_entry: string | null;
  letter: string;
  volume: number;
  theme: string | null;
};

type MeaningRow = {
  id: number;
  sign_id: number;
  text: string;
  variant_index: number | null;
  order_in_entry: number | null;
};

type ThemeRow = {
  name: string;
  difficulty_rank: number;
  tier: string;
};

function toSign(r: SignRow): Sign {
  return {
    id: r.id,
    imagePath: r.image_path,
    description: r.description,
    sourceEntry: r.source_entry,
    letter: r.letter,
    volume: r.volume,
    theme: r.theme,
  };
}

function toMeaning(r: MeaningRow): Meaning {
  return {
    id: r.id,
    signId: r.sign_id,
    text: r.text,
    variantIndex: r.variant_index,
    orderInEntry: r.order_in_entry,
  };
}

/** Returns all signs whose theme column contains the given theme as an exact pipe-token. */
export function listSignsByTheme(themeName: string): Sign[] {
  const rows = signDb()
    .prepare<[string, string, string, string], SignRow>(
      `SELECT id, image_path, description, source_entry, letter, volume, theme
       FROM signs
       WHERE theme = ? OR theme LIKE ? OR theme LIKE ? OR theme LIKE ?
       ORDER BY id ASC`
    )
    .all(themeName, `${themeName}|%`, `%|${themeName}`, `%|${themeName}|%`);
  return rows.map(toSign);
}

export function getSign(signId: number): Sign | null {
  const row = signDb()
    .prepare<[number], SignRow>(
      `SELECT id, image_path, description, source_entry, letter, volume, theme
       FROM signs WHERE id = ?`
    )
    .get(signId);
  return row ? toSign(row) : null;
}

export function getMeanings(signId: number): Meaning[] {
  const rows = signDb()
    .prepare<[number], MeaningRow>(
      `SELECT id, sign_id, text, variant_index, order_in_entry
       FROM meanings WHERE sign_id = ? ORDER BY order_in_entry ASC, id ASC`
    )
    .all(signId);
  return rows.map(toMeaning);
}

/** Returns all signs whose meanings include the exact given text (synonyms share a sign). */
export function findSignsByMeaning(text: string): Sign[] {
  const rows = signDb()
    .prepare<[string], SignRow>(
      `SELECT s.id, s.image_path, s.description, s.source_entry, s.letter, s.volume, s.theme
       FROM signs s JOIN meanings m ON m.sign_id = s.id
       WHERE m.text = ?
       ORDER BY s.id ASC`
    )
    .all(text);
  const seen = new Set<number>();
  const out: Sign[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(toSign(r));
  }
  return out;
}

export function listThemes(): Theme[] {
  const rows = signDb()
    .prepare<[], ThemeRow>(
      `SELECT name, difficulty_rank, tier FROM themes ORDER BY difficulty_rank ASC`
    )
    .all();
  return rows.map((r) => ({ name: r.name, difficultyRank: r.difficulty_rank, tier: r.tier }));
}

/** Absolute filesystem path to a sign's image, or null if missing. */
export function getImageAbsolutePath(signId: number): string | null {
  const sign = getSign(signId);
  if (!sign) return null;
  const abs = join(signDbImagesRoot(), sign.imagePath);
  return existsSync(abs) ? abs : null;
}
