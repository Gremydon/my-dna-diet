# Development notes (stabilization)

This folder is the **single source of truth** for beta stabilization status.

| File | Purpose |
|------|---------|
| [CURRENT_STATUS.md](./CURRENT_STATUS.md) | Architecture snapshot and what changed recently |
| [CURRENT_PRIORITY.md](./CURRENT_PRIORITY.md) | Ordered work priorities (local-first) |
| [KNOWN_BUGS.md](./KNOWN_BUGS.md) | Bug register and risks |
| [BUILD_HISTORY.md](./BUILD_HISTORY.md) | Change log with test notes |

**Note:** The product flag `BETA_LOCAL_FIRST` lives in `script.js` at the top. Set to `false` only when re-enabling the full login gate and autosync behavior.
