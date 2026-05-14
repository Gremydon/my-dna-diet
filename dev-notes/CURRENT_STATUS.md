# My DNA Diet — Current Status (Stabilization / Beta)

**Last reviewed:** 2026-05-14  
**Mode:** Local-first beta (see `CURRENT_PRIORITY.md`)

## What this repo is

Single-page web app: `index.html` + `style.css` + `script.js`. No build step. Intended for GitHub Pages or “open HTML in browser.”

## What works today

- **Profiles & intolerances:** Example JSON profiles (`don-data.json`, etc.), user-created profiles, manual entry, multi-format upload (JSON, CSV, PDF, DOCX, TXT) with parsers in `script.js`.
- **Local persistence:** Primary keys under `myDNADiet_*` via `safeStorage`; legacy `profileData` / `currentProfile` in raw `localStorage`; consolidated snapshot `myDNADiet_allProfiles`.
- **Label scan:** Camera or file → Tesseract OCR → `parseIngredients` → match → `renderScanResults`.
- **Manual test & diet plan:** Modals call comparison logic against profile intolerance lists.
- **Optional cloud:** Firebase + GitHub OAuth + private Gist sync (when enabled and user is logged in).

## Technical debt (rolling)

| Area | Notes |
|------|--------|
| **Dual storage** | `profileData` still uses raw `localStorage` while `myDNADiet_*` uses `safeStorage` — `saveAllProfiles()` / `autoSaveIntolerances()` must stay aligned until a future consolidation. |
| **CDN / offline** | First load needs network for Firebase, Tesseract, PDF.js, etc. True offline-first install is partial unless assets are cached or bundled. |
| **Post-beta** | Re-enable prominent cloud sync by setting `BETA_LOCAL_FIRST` to `false` and restoring default visibility of `#login-section` in `index.html`. |

~~Duplicate `logout` / `saveAllProfiles`~~ — addressed STAB-001.  
~~`saveAllProfilesToStorage`~~ — removed.  
~~Scan vs test / OCR equality~~ — addressed via shared matching helpers.

## Product stance (beta)

- **Trust:** Medical disclaimer in README and in-app Terms; app is informational, not diagnostic.
- **Data:** All intolerance processing is client-side; cloud is optional and separate from core scanning.

## Files that matter for stability

| File | Role |
|------|------|
| `script.js` | All logic: persistence, OCR, comparison, auth, migrations. |
| `index.html` | Shell UI, modals, CDN script tags. |
| `style.css` | Layout and components (partial overlap with inline styles in HTML). |
| `*-data.json` | Example profile seeds. |
| `sample-*.json` / `*.csv` | User templates. |

## Stabilization flag (2026-05-14)

- `BETA_LOCAL_FIRST` in `script.js` (top): when `true`, the app opens without a login wall, avoids GitHub login prompts, skips autosync to Gist on autosave, and messaging emphasizes **browser local storage**.
- Login markup remains in `index.html` but is **hidden by default**; `showLoginSection()` is a no-op while the flag is true.
- Trust copy: `#localDataTrustBanner` inside `#app-content`.

## Next actions

Tracked in `CURRENT_PRIORITY.md`. Bug candidates in `KNOWN_BUGS.md`.
