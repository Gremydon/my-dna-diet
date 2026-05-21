# STAB-003 — Accuracy Hardening (branch: `stab-003-accuracy-hardening`)

**Status:** Not merged to `main` until mobile scan + regression checklist passes.

## New files

| File | Role |
|------|------|
| `ingredientAliases.js` | Category alias groups (dairy, soy, gluten, corn, msg, dyes, sugar alcohols) |
| `ingredient-matching.js` | Normalization, fuzzy match, hierarchy parse, evaluation engine |
| `ingredient-matching-tests.js` | Extended browser-console tests |

## Debug mode

In browser console before scan:

```js
window.MY_DNA_DIET_MATCH_DEBUG = true;
location.reload();
```

Logs: raw token, normalized token, match type, fuzzy target, confidence.

## Pre-merge checklist

- [ ] iPhone Safari: scan → results → scan another label (STAB-002 flow intact)
- [ ] Android Chrome: same
- [ ] Profile switch after scan — data persists
- [ ] Test ingredient modal — confirmed vs possible tiers
- [ ] No console parse errors
- [ ] `IngredientMatching.runIngredientMatchingTests()` all pass

## Merge policy

Do **not** merge to `main` until checklist signed off.
