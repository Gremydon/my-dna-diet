# Current Priority — Stabilization Mode (Local-First Beta)

**Ordered list.** Do not reorder upward without team agreement.

## 1. Bulletproof local profile persistence (P0)

- Single writer path for “profile + intolerances” snapshots where possible.
- Ensure migrations never call undefined helpers.
- After edits: `profileData`, `myDNADiet_userIntolerances`, `myDNADiet_profile_*`, `myDNADiet_allProfiles`, and `intolerances` map stay aligned.

## 2. Autosave after every meaningful change (P0)

- `autoSaveIntolerances()` already central; verify all add/remove/upload paths invoke it or `saveIntolerances()`.
- Avoid redundant alerts on autosave (quiet success, loud failure).

## 3. Reliable ingredient scanning flow (P0)

- OCR pipeline: image → `ocrExtract` → `parseIngredients` → match → `renderScanResults`.
- Matching must tolerate real labels (substring / multi-token), not only exact token equality.
- Active intolerance list must match the profile the user thinks is active (unify `currentPet` / `currentProfileName` / `userIntoleranceList`).

## 4. Export / import backup (P1)

- JSON export exists (`exportCurrentIntolerances`, `exportCSV`).
- Add or document a **full backup** (all profiles + metadata) if not present; verify import round-trip.

## 5. UI clarity & trust messaging (P1)

- Plain language: where data lives (this device), that clearing site data clears app data, optional cloud later.
- Reduce login/sync prominence during local-first beta.

## 6. Cloud / Firebase (P2 — deprioritized)

- Keep code paths but gated; no login wall for core flows.
- Re-enable prominently post-beta when security checklist (see `SECURITY_IMPLEMENTATION_GUIDE.md`) is satisfied.

---

**Principle:** Reliability and clarity over new features until beta sign-off.
