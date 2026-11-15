# Public example profile exposure: review and options

## Confirmed scope

The repository is public. Four named profile JSON seed files are tracked on main
and inherited by the development branches. They contain profile and intolerance
records; this report intentionally does not repeat their contents. Their history
also predates the current stabilization commits, so a future file replacement
alone would not remove the historical copies.

GitHub Pages currently serves a public site from the root of main. The profile
files are web-accessible static assets. Deleting an example inside the application
only affects that browser/session; it does not remove a public repository asset.

Whether these are fictional, consented examples, or real personal records needs
owner confirmation. No private database, browser profile, or cloud Gist was
inspected. No seed file, Git history, hosting setting, or live profile was changed.

## Safest sequence, subject to a separate decision

1. Privately retain the originals and the owners' browser exports, and confirm
   who owns the data and whether public distribution is intended. Never attach
   originals to a public issue, PR, or CI artifact.
2. If personal, prepare a separate reviewed patch replacing the public examples
   with entirely synthetic records, neutral example identities, and matching
   UI/loader references. Preserve people's existing local records; do not ship a
   migration that silently rewrites them. Replacement is preferable to publishing
   a sanitized fragment that may still identify a person.
3. After explicit deployment approval, publish the synthetic examples and verify
   the old public asset URLs and any downloadable exports. Merely hiding profile
   buttons does not stop public access.
4. Decide separately whether to rewrite repository history and clean all affected
   branches/tags. That requires coordinated backups and explicit authorization:
   it changes commit IDs, can disrupt collaborators, and may require forced pushes.
   Ask GitHub Support about sensitive-data removal/cache handling if applicable.
5. Verify the remaining exposure and explain the limits: copies already cloned,
   downloaded, forked, indexed, or cached by others cannot be reliably recalled.

If immediate withdrawal is preferred, taking the public site offline and changing
repository visibility are separate owner-approved containment actions. A private
repository alone does not guarantee a private GitHub Pages site, and changing
visibility does not recall existing copies.

## Decision needed after this PR review

Confirm whether the example records are intended to be public. If not, authorize
synthetic replacement and decide whether urgent containment and/or coordinated
history cleanup is warranted. This stabilization PR performs none of those
potentially destructive or public-hosting actions.
