# Result reliability: prevent misleading all-clear messages

This follow-up branch is based on PR #1 at `7553519`, not on either accuracy
branch. PR #1 was verified open, draft, and unmerged on 2026-11-20. Review this PR
against `stabilization/profile-safety-and-persistence` so only this follow-up is
shown. PR #1 must be reviewed separately; this work does not authorize merging it.

## Behavior

Camera and uploaded-photo assessments now show **Unable to assess**, an explanation,
and an actionable next step when:

- No image is available or image validation fails.
- OCR fails, returns no letter-containing text, or supplies an unusable confidence
  score.
- Existing parsing produces zero usable ingredient tokens.
- The selected profile is absent, has an empty list, or its loaded matching data
  contains malformed/empty/non-letter entries.
- An upload exceeds the existing 50-ingredient analysis cap without a detected
  conflict in the processed portion. Partial processing is not an all-clear.

Warnings appear in both the scanner and results panel. Starting a new assessment
replaces the old result with a processing message; a failed attempt cannot leave
an old reassuring result displayed. The existing scan-again actions remain
available, and processing state is released after failures.

The manual check and diet-analysis screens also reject empty/unusable input or
missing profile data. Unreadable/empty diet documents and missing document-reader
libraries produce a visible Unable to assess result.

A valid no-match result says **No listed conflicts detected in the text analyzed**,
followed by a reminder that this does not confirm the food is safe. Removed the
previous safe-food claims and celebratory no-issue wording. Detected conflicts
continue to display as before.

The successful uploaded-photo path also referenced a removed `ingredientInput`
DOM field. That legacy write is now optional, allowing the existing upload
analysis to complete without adding a new control. Its OCR call now uses the
Tesseract 2.1.1 API's `(image, language, options)` arguments; previously its options
object occupied the language argument. Camera/upload regression stubs enforce the
expected language and options positions. No OCR matching or normalization rule
was changed.

## Confidence policy and limits

Tesseract returns a score on a 0–100 scale. This patch provisionally rejects a
score below **50**, a missing/non-numeric/non-finite score, or a score above 100.
This is a conservative result-eligibility check, not a calibrated ingredient
accuracy score or a medical/food-safety probability. The boundary is explicit and
covered by tests; it needs validation with real Android/iPhone label photos before
release. High-confidence OCR can still omit or misread ingredients.

The existing parser and matcher are unchanged. Letter-containing text is only a
basic usability check; this patch cannot prove that a complete ingredients panel
was photographed or that every token is a real ingredient. It does not validate
the medical basis, completeness, or accuracy of uploaded intolerance profiles.

## Scope preserved

- `parseIngredients`, `cleanOCRText`, `ingredientTokenMatchesIntolerances`, and
  `getActiveIntoleranceStringsForMatching` are unchanged from PR #1.
- Camera/upload/manual/diet matching comparisons and aliases were not rewritten
  or unified. Known differences between those paths still need a separate patch.
- No profile storage, migration, export, seed files, or live data were changed by
  this follow-up. Regression tests verify that successful and failed scan attempts
  do not write profile storage or recovery backups.
- The test workflow includes the PR #1 branch as a permitted target so a stacked
  draft can run CI. It contains no deployment or merge steps.

## Verification

Run the inherited suite plus the new result-reliability tests:

```sh
node --check script.js
python -m unittest discover -s tests -v
```

Use `CHROMIUM_PATH=/usr/bin/chromium` if selecting a system-installed browser.
Installation instructions remain in `STABILIZATION-PROFILE-SAFETY.md`.

Tests use synthetic profiles and labels, intercepted network requests, and stubbed
OCR responses. They exercise real app entry points and renderers, including
success → failure → success recovery. No real user data is printed or uploaded.
Stubbed OCR verifies control flow and messaging, not physical camera/OCR accuracy.

## Before deployment

Review both draft PRs, preserve off-device backups, validate the confidence policy
and scan recovery on real phones, and keep accuracy/privacy/dependency follow-ups
separate. No merge or deployment is authorized by this assignment.

## Recorded local verification (2026-11-20)

- Full browser suite: **46 tests passed** (17 new reliability tests plus all 29
  PR #1 regressions). The final rerun is recorded in the PR.
- JavaScript syntax, Python test compilation, and `git diff --check`: passed.
- Source comparison confirmed the four parsing/normalization/matching helpers
  listed above are identical to PR #1.
- GitHub-hosted CI status is recorded separately on the draft pull request.
