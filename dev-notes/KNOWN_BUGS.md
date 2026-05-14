# Known Bugs & Risk Register

**Format:** ID — severity — status — notes

---

### BUG-001 — `saveAllProfilesToStorage` is undefined

- **Severity:** High
- **Status:** **Fixed** (2026-05-14) — removed erroneous call; migration uses `saveAllProfiles()` only.

---

### BUG-002 — Duplicate `logout` function declarations

- **Severity:** Medium
- **Status:** **Fixed** (2026-05-14) — single `logout`; respects `BETA_LOCAL_FIRST` for post-logout UI.

---

### BUG-003 — Duplicate `saveAllProfiles` function declarations

- **Severity:** Medium
- **Status:** **Fixed** (2026-05-14) — one implementation remains (writes `profileData` + `myDNADiet_allProfiles`).

---

### BUG-004 — Scan vs test modal use different intolerance sources

- **Severity:** High
- **Status:** **Fixed** (2026-05-14) — `getActiveIntoleranceStringsForMatching()` + `ingredientTokenMatchesIntolerances()` shared by OCR scan, test modal, and diet analysis entry points.

---

### BUG-005 — OCR match used exact token equality only

- **Severity:** High
- **Status:** **Fixed** (2026-05-14) — substring-style matching aligned with manual test behavior.

---

### BUG-006 — Login gate blocks app when signed out (Firebase path)

- **Severity:** High (beta friction)
- **Status:** **Mitigated** (2026-05-14) — `BETA_LOCAL_FIRST`: auth sign-out keeps app open; login section hidden by default in `index.html`; `showLoginSection` no-ops when flag is true.

---

### BUG-007 — `loadAllProfilesFromStorage` assumed `.item` on all intolerance rows

- **Severity:** Medium
- **Status:** **Fixed** (2026-05-14) — handles string arrays vs `{ item, ... }` objects when restoring user profiles.

---

### BUG-008 — `closeOnboarding()` always calls `selectPet("Mocha")`

- **Severity:** Low
- **Status:** **Open** — may surprise users with a custom profile; consider `selectPet(currentProfileName || lastProfile || "Mocha")`.

---

### RISK-001 — Firebase config in client `script.js`

- **Severity:** Operational / security (public client config)
- **Status:** Open — acceptable for Firebase web apps; rotate keys if compromised; see `SECURITY_IMPLEMENTATION_GUIDE.md`.

---

### RISK-002 — Accidental repo artifacts

- **Severity:** Low
- **Examples:** `cript.js`, `tatus`, `et --hard HEAD~1` (if present)
- **Status:** Open — optional cleanup.

---

*Append new rows as testers report issues; link fixes to `BUILD_HISTORY.md`.*
