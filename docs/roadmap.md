x# Roadmap

Living document. Reordering and rescoping are normal — confirm priority with the user before starting any item.

## Short term

- **WordPress inline embedding** — implement `wp_footer` hook approach, remove the fetch dependency. See [docs/known-issues.md](known-issues.md) item 4.
- **Video loading state** — spinner or skeleton during `loadstart`. See [docs/known-issues.md](known-issues.md) item 1.
- **Safari MP4 fallback verification** — confirm alpha-channel fallback works on macOS and iOS.
- **Avatar / person image preview** — show a poster image before the video starts. See [docs/known-issues.md](known-issues.md) item 3.
- **Brand color alignment** — audit current pinks against the Hypoport palette. See [docs/known-issues.md](known-issues.md) item 5.

## Medium term

- **Enhanced minimized widget UX** — redesign the minimized chat-bubble with: (1) larger container (starting at 256×256), (2) fixed splash-screen image of the person (same as avatar image from finding 1, required), (3) lazy-reveal chat-bubble on hover or timed delay showing contextual hardcoded text (e.g. "Hallo ich bin Nathalie und helfe dir gern weiter wenn du Fragen hast"), (4) clicking the bubble expands to full video player, (5) minimize button appears only on hover over upper-right corner (not center or other corners), (6) no "disable widget completely" button at this time. Requires careful pointer-events management and z-index strategy. **Depends on:** avatar image (finding 1) and brand color palette (finding 2). **Target:** v1.6.
- **Extended scrubbing feature** — explore thumbnail preview on ring hover, time tooltip, snap-to-chapter
- **CSS custom properties for theming** — replace hardcoded `rgb(255, 40, 110)` / `rgb(255, 180, 200)` with `var(--vg-primary)` etc.
- **i18n** — extract German button titles (`Minimieren`, `Stummschalten`, `Maximieren`, `Play / Pause`) to a config object so they can be overridden
- **Analytics hooks** — emit custom DOM events (or push to `dataLayer`) for `play`, `pause`, `scrub`, `minimize`, `restore`. No bundled analytics library.
- **Accessibility audit** — NVDA + VoiceOver test, WCAG 2.1 AA contrast verification, keyboard scrubbing (Left/Right arrows on focused ring)
- **`aria-label` + `aria-live`** — add explicit accessible names and announce video state transitions
- **Dynamic job-url loading for demo2** — replace the static `jobUrls` array in `demo2.html` with a runtime fetch against `karriere.hypoport.de` (likely `/jobs/jobs-sitemap.xml`), so the demo never goes stale. **Open question:** does karriere.hypoport.de send `Access-Control-Allow-Origin: *` (or similar) for cross-origin browser fetches? If not, this approach is blocked and we need an alternative (scheduled build-step regeneration, CORS proxy, or accept manual curation). First actionable step: open the sitemap URL in a browser console fetch from a non-hypoport origin and inspect the response headers.

## Longer term

- **Closed captions** — WebVTT support via `<track>` element. Existing `sample/*.vtt` files in `sample/` may already cover the test asset.
- **Playback speed control** — 0.5x / 1x / 1.5x / 2x
- **Multiple video sources** — runtime switching, playlist support
- **Fullscreen** — explicit fullscreen button (currently `disablepictureinpicture` is set; revisit if PiP is wanted later)

## Architecture changes (only if needed)

These are not in flight. Document the trigger before starting any of them:

- **ES modules** — convert to module pattern for cleaner encapsulation
- **Web Components** — refactor as `<video-guide-widget>` custom element
- **Build process** — minification + bundling. Currently zero-build. Adds complexity; only worth it if asset size becomes a real problem.
- **TypeScript** — type safety for editor support. Pure overhead for a 4-file project; only useful if the surface area grows substantially.

## Code quality (not yet started)

- **Unit tests** — Jest for `setPercentage`, `getRingProgress`, and any future pure helpers
- **Integration tests** — Playwright or Cypress for the full interaction matrix
- **Linting** — ESLint + Stylelint with this project's rules pinned
- **Visual regression** — screenshot comparison (Percy, Chromatic, or local equivalent)
