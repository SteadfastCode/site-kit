# CLAUDE.md

Shared, dependency-free UI pieces for the sites Steadfast Code builds (public, MIT). See README.md.

## Rules

- **No dependencies and no build step.** Every piece is plain HTML/CSS/JS that a site can inline or
  link; the Astro component only wraps the same files. A WordPress theme must be able to use it.
- **Progressive enhancement.** Without JavaScript the markup still works (photo links open the
  photo). Respect the visitor: no tracking, no external requests, keyboard and screen-reader usable.
- **Tested in a real browser before a tag.** `yarn test` (Playwright, mouse + keyboard + CDP touch).
  A bug found on a site gets a test here first, the way the swipe-then-tap regression did.
- **Versioned by tag** (`v0.1.0`); sites pin a tag. Breaking markup or option changes bump the minor
  version while we're below 1.0 and get a line in the log below.
- Yarn, not npm.

## Decision Log

- **2026-10-30 — Started with the photo viewer and justified rows from mrdandyman.biz/work.**
  Daniel asked for the viewer to be generalized. Public so Cloudflare Pages builds can install it
  from GitHub without credentials, and because it's a fair sample of the work. Touch taps act on
  pointerup because Chrome on Android drops the first tap's click after a swipe.
