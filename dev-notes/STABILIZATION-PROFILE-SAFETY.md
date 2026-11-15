# Profile safety and persistence stabilization

Review branch: `stabilization/profile-safety-and-persistence`, based on main `6453872`.
No accuracy branches were merged. Ingredient normalization, aliases, fuzzy matching,
and scanner matching algorithms are unchanged.

## Backup verification before editing

The existing application was exercised in disposable Chromium contexts using only
synthetic profiles. The original `backupAllProfiles()` download and
`restoreFromBackup()` round trip preserved profile rows, an empty profile, and
custom metadata in `profileData` and browser storage. The original single-profile
`exportProfileData()` / `importProfileData()` round trip also passed.

This verifies the tools, not whether a particular person already has an off-device
backup. No live browser data or private profiles were accessed. Existing restore
failed to rebuild runtime matching state; this patch repairs that behavior.

## What changed

- Restore the missing seed loader; failures of example files or optional PDF.js
  no longer interrupt first-visit onboarding. Personal legacy data loads before
  seeds, so an example cannot override a same-named personal profile.
- Select one profile for matching and hydrate its editor from that profile's
  records. Clear previous results on selection changes and reject asynchronous
  scan/import results if selection changes during processing.
- Preserve rich intolerance rows (including severity, category, and extra fields),
  empty lists, and existing profile metadata. Read existing canonical, aggregate,
  per-profile, and legacy user formats without automatically deleting old keys.
- Save item removals and empty lists through the same persistence path. Surface
  failures in a visible alert banner. Roll back interrupted multi-key writes when
  possible, and block writes over unreadable canonical storage.
- Before the first profile write, retain the original raw profile storage under
  `myDNADiet_stabilizationBackup_v1`. This is an on-device recovery snapshot,
  not a substitute for a downloaded backup and not a guarantee against a browser
  crash between writes or clearing site data.
- Full backups now include runtime/legacy profiles and raw profile storage
  snapshots, excluding authentication storage. Restore accepts existing version
  `1.0` and new `1.1` backups, validates before writes, rebuilds matching state,
  and retains profiles absent from the backup. Matching names are replaced only
  after confirmation. Invalid/unreadable raw snapshots are retained for manual
  recovery; they are not blindly written back into live storage.
- Current-list JSON export/import supports an intentionally empty list and
  retains the imported profile identity. Full backups preserve broader metadata;
  current-list JSON and CSV are not full application backups.
- Encode user-controlled values at HTML sinks, including ingredient/category
  names, profiles, filenames, OCR result tokens, and errors. Debug text uses
  `textContent`. Extracted ingredients are passed to their button through an event
  listener closure, never interpolated into JavaScript source.
- Prevent legacy cloud restores from replacing local state while
  `BETA_LOCAL_FIRST` is enabled. Optional cloud operation outside that mode has
  not been certified by this patch.

## Backup/restore procedures

Current-list backup is available in **Upload Intolerances → Export Current List**.
Upload that JSON to restore the named list. Confirm a replacement only when
intended. The patch also accepts empty current-list JSON files.

The pre-existing full-backup developer functions remain available without adding
new product controls:

```js
backupAllProfiles();                 // Downloads a private JSON backup.
restoreFromBackup(backupObject);      // Validate and merge a parsed backup.
exportProfileData(profileName);      // Downloads one complete profile record.
importProfileData(profileObject);    // Restore one exported profile record.
```

Use these against the review build first. Keep downloads private and off-device.
Do not paste real backups, recovery snapshots, or localStorage dumps into public
issues, pull requests, CI logs, screenshots, or this repository. Full-backup UI
controls were not added because this assignment excludes new features.

Before any approved deployment: export real profiles, retain the original files,
and test copies in an isolated browser. Do not clear the live site's storage to
test this patch. No real profiles were modified during this assignment.

## Automated verification

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
node --check script.js
python -m unittest discover -s tests -v
```

For an already-installed system browser:

```sh
CHROMIUM_PATH=/usr/bin/chromium python -m unittest discover -s tests -v
```

The suite uses Playwright with disposable browser contexts, intercepted requests,
and synthetic seed responses. It never contacts the live site, GitHub, Firebase,
or actual example profile JSON files. No browser state, reports, screenshots, or
backups containing personal information are uploaded as test artifacts.

Coverage includes startup with missing dependencies/seeds; selected-profile
isolation; edits and deletion through actual controls; empty-list reloads;
canonical-versus-legacy conflicts; orphan per-profile keys; rich row metadata;
backup file downloads, restores and reloads; invalid backup rejection; recovery
snapshot preservation; interrupted/blocked/corrupt storage; JSON/TXT import and
CSV callback persistence; safe HTML rendering; extracted-ingredient event
handling; special object-key names; asynchronous profile changes; and gating of
legacy cloud restores in local-first mode.

The GitHub workflow runs only tests on pull requests/manual dispatch, with
read-only repository permissions. It has no deployment or merge steps.

## Remaining work outside this patch

- Resolve the separately documented ingredient matching inconsistencies, alias
  semantics, OCR quality gates, and zero-ingredient reassurance. In particular,
  this patch does not make a negative result a food-safety guarantee.
- Test physical Android/iPhone cameras, repeat scans, permissions, and large
  images. Desktop Chromium simulation does not certify real camera hardware.
- Review outdated third-party dependencies, optional authentication/cloud
  behavior, offline claims, and privacy wording before wider beta.
- Review public profile remediation separately; see PUBLIC-PROFILE-REMEDIATION.md.

Main, live hosting settings, deployed files, and existing seed JSON files remain
unchanged by this branch until an explicitly approved merge/deployment.

## Recorded local result (2026-11-15)

- Existing backup/export baseline verification passed before application edits.
- `node --check script.js`: passed.
- `python -m py_compile tests/test_stabilization.py`: passed.
- Chromium regression suite: **29 tests passed** in 50.193 seconds, using
  Playwright 1.62.0 with system Chromium.
- `git diff --check`: passed.
- GitHub-hosted workflow status is reported separately in the pull request;
  local results do not assert a hosted CI pass.
