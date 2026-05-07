# Sign Language Database (backend-only)

This directory is the runtime home of the 手语词典 data used by 手诺 · Signo.

## Contents

- `sign_themed.db` (2.2 MB, committed) — SQLite snapshot with:
  - `signs(id, image_path, description, source_entry, letter, volume, theme)`
  - `meanings(id, sign_id, text, variant_index, order_in_entry)` — one row per Chinese word synonym
  - `themes(name, difficulty_rank, tier)` — 31 themes across 7 tiers (入门→专项)
- `images/` (≈350 MB, **NOT committed**) — 6699 sign illustration JPGs (`v{vol}_{key}.jpg`, ~695×399)

## Where the data came from

Derived from 《国家通用手语词典（全四册）》. Non-commercial use only. Upstream:
`../../sign-language-database/` (sibling directory at repo root).

## How to populate `images/`

Run once from `signo-web/`:

```bash
pnpm sign-db:bootstrap
```

This copies `sign_themed.db` + `images/` from the upstream folder. If the upstream
lives elsewhere, pass `SIGN_DB_SRC=/abs/path/to/sign-language-database`.

## How app code reads this

- Never hit it directly. Go through `src/lib/signDb/` (better-sqlite3 readonly).
- Images are served via `GET /api/signs/image/[signId]`; `Media.path` in the
  curriculum DB stores exactly that URL.

## License / attribution

Non-commercial, educational, accessibility use. Any public deployment must
preserve the attribution to the official dictionary and provide a takedown contact.
