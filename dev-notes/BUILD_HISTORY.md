# Build History — Stabilization & Beta

Chronological log of **meaningful** changes. Each entry should say what, why, and what to test.

---

## 2026-05-21 — STAB-002: Scan results recovery UX

**What**

- After label scan, results panel includes sticky actions: Scan Another Label, Back to App, Clear Results.
- Successful scan now calls `closeScanModal()` (stops camera, resets capture state) instead of only `hide()`.
- `openScanModal()` removes `.hidden` so repeat scans can reopen the modal.
- `resetScannerUI()` clears canvas, preview, file input, and processing flags.
- One-time scanner event listener binding to avoid duplicate handlers.

**Why**

- Beta testers were trapped below long results with no obvious path to scan again.

**What to test**

1. Scan label → see results → tap Scan Another Label → fresh scanner opens.
2. Back to App scrolls to main button row.
3. Clear Results empties panel without losing profile data.
4. Repeat scan on mobile (iOS Safari): camera stops between scans.

---

## 2026-05-21 — STAB-001-HOTFIX: Missing `showOnboarding` closing brace

**What**

- Added missing `}` at end of `showOnboarding()` in `script.js` (STAB-001 edit left function unclosed).

**Why**

- Unclosed function caused `SyntaxError: Unexpected end of input`; entire script failed to parse, so live site showed only header/background (`#app-content` never initialized).

**What to test**

1. Hard refresh live URL — full app UI visible without login.
2. Browser console: no parse errors on load.
3. Existing profiles/intolerances still present after refresh.

---

## 2026-05-14 — STAB-000: Stabilization system + documentation baseline

**What**

- Added `dev-notes/` with `CURRENT_STATUS.md`, `CURRENT_PRIORITY.md`, `KNOWN_BUGS.md`, and this file.
- Captured pre-change audit: duplicate functions, missing `saveAllProfilesToStorage`, login gate vs local-first goals, scan matching gaps.

**Why**

- Establish a single place for beta readiness, priorities, and regression tracking before code edits.

**What to test**

- N/A (documentation only).

---

## 2026-05-14 — STAB-001: Local-first beta + persistence/scan fixes

**What**

- Introduced `BETA_LOCAL_FIRST` in `script.js`: **no login wall**; signed-out auth state still shows main app; `showLoginSection` no-ops; logout keeps app usable.
- `index.html`: login section default `display: none`; `#localDataTrustBanner` explains local storage + export; onboarding GitHub button has `id="onboardingGithubBtn"` and is hidden when flag is true.
- Removed duplicate `logout` and duplicate early `saveAllProfiles` (single writer for `profileData` + `myDNADiet_allProfiles`).
- Removed broken `saveAllProfilesToStorage()` call from migration.
- Added `getActiveIntoleranceStringsForMatching()` and `ingredientTokenMatchesIntolerances()` — used by OCR scan, `testFoodIngredients`, `analyzeDietPlan`, and `viewDiet`.
- `loadAllProfilesFromStorage`: tolerate string vs object intolerance arrays for user profiles.
- `selectPet`: normalize per-profile `myDNADiet_profile_*` payloads (strings vs objects).
- `saveIntolerances`: beta messaging (device-only + export hint); optional cloud attempt only if authenticated.
- `autoSaveIntolerances`: no Gist writes while `BETA_LOCAL_FIRST` (reduces surprise network I/O).
- Online event: skip auto cloud sync when `BETA_LOCAL_FIRST`.

**Why**

- Reliability, simplicity, and clear trust messaging for non-technical beta testers.

**What to test**

1. Fresh load: main app visible; login strip not shown; trust banner readable.
2. Upload or add intolerances → Save → refresh → data persists.
3. **Scan** and **Test ingredients** agree for the same ingredient line (substring cases, e.g. “whole milk” vs “milk”).
4. **Diet plan** modal still processes supported file types.
5. Migration path: legacy `myDNADiet_userIntolerances` only → no console throw from missing function.
6. If Firebase session exists: Logout → app stays open; local lists unchanged.

---

*Append new entries to the top or bottom consistently — this file uses chronological order (oldest stabilization doc first, then STAB-001).*
