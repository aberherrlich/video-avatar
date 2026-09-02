# Known Issues

Verified against the current codebase on 2026-05-13. Each issue is something actually present in the code right now — not a historical artifact.

## Open

### 1. No visual loading state for video

**Problem:** Between page load and the first frame of video, there's a brief blank period inside the viewport.
**Location:** `js/video-guide.js` — no listener on `loadstart` / `waiting` events.
**Impact:** Mild UX hiccup, visible on slow networks.
**Suggested fix:** Add a `loadstart` listener that adds a `video-loading` class (spinner via CSS), remove it on `canplay`.
**Priority:** Low (cosmetic).

### 2. Safari MP4 fallback not yet verified in production

**Problem:** WebM VP9 with alpha is not supported in Safari. The widget falls back to `sample2.mp4`, but the MP4 doesn't have an alpha channel, so the circular crop may look different than the WebM version.
**Location:** `widget.html` — two `<source>` tags.
**Impact:** Visual inconsistency between Safari and Chrome/Firefox/Edge.
**Suggested fix:** Render the MP4 with the same alpha-equivalent treatment (e.g. matte against the viewport white circle), or accept the difference and document it.
**Priority:** Medium — depends on how visible Safari traffic is.

### 4. Widget HTML is still fetched at runtime rather than inlined

**Problem:** The loader uses `fetch(cfg.baseUrl + 'widget.html')`. The URL configuration part of this is solved — `window.videoGuideConfig.baseUrl` drives both the fetch and the asset paths inside the injected markup — but the round-trip itself remains, and it is subject to the host page's CSP (`connect-src`) and to CORS if `widget.html` is not served same-origin.
**Location:** `js/widget-loader.js`.
**Impact:** One extra request before the widget can render, and one more thing that can be blocked by host page policy. The widget degrades silently (console error only) if it fails.
**Suggested fix:** Offer an alternative mode where the plugin renders `widget.html`'s content inline via `wp_footer` and the loader is omitted, dispatching `videoGuideWidgetLoaded` directly.
**Priority:** Medium — no longer a deployment blocker, now a robustness and latency item.

### 10. Widget JS declares five names at global scope

**Problem:** `js/video-guide.js` is not wrapped in an IIFE. `REVEAL_DELAY_MS`, `REVEAL`, `BUBBLE_DELAY_MS`, `BUBBLE_HIDE_GRACE_MS` and `initVideoGuide` are top-level declarations. On a page where another script declares a top-level `const` with any of those names, one of the two scripts throws.
**Location:** `js/video-guide.js` — the whole file.
**Impact:** Unlikely given the names, but the failure mode is total for whichever script loses. Conflicts with PROJECT.md success criterion 6 ("no CSS/JS conflicts with the host page").
**Suggested fix:** Wrap the file in an IIFE, as `js/widget-loader.js` already is. Two lines.
**Priority:** Low probability, high impact — worth doing before production.

### 6. Mobile UX undecided

**Problem:** Widget is `display: none` below 576px. Whether mobile users should see it at all (with simpler controls) or whether this is final is an open design question.
**Location:** `@media(max-width: 576px)` rule in `css/video-guide.css`.
**Priority:** Low — explicitly deferred.


## Resolved (kept for reference)

These were flagged in the older Copilot instructions and are now fixed. Don't reintroduce.

- **`setInterval` leak in `progressLoop()`** — replaced with RAF (`startProgressLoop`/`stopProgressLoop`) with a guard against double-starts. Don't go back to interval-based progress updates.
- **Debug yellow background on controls** — already commented out in `css/video-guide.css` line ~479. Safe to remove the commented line entirely if you're tidying.
- **Rewind / forward buttons** — removed entirely. Older docs describe them as core features; they no longer exist in the build. Don't re-add without product approval.
- **jQuery dependency in main widget** — removed. Pure vanilla JS.
- **Orb effect experiment** — removed entirely (canvas-based experiment from earlier design explorations). New approach: static avatar image + chat-bubble text interaction.

---

### 7. Playback continues when widget is minimized (FIXED 2026-05-13)

**Fix:** Added `if (!video.paused) video.pause();` to minimize handler in `js/video-guide.js` line 194. Video now pauses when widget is minimized, preventing silent playback in the background. On restore, currentTime is preserved naturally.

### 8. jQuery loaded but unused on demo2.html (FIXED 2026-05-13)

**Fix:** Deleted unused jQuery `<script>` tag from `demo2.html` line 48. No jQuery code was found anywhere in the file. Cleanup removes ~32KB and one network request per demo load.

### 9. setInterval without cleanup path in demo2.html job rotator (FIXED 2026-05-13)

**Fix:** Simplified job rotation logic to pick a fresh random job on every page reload instead of using hourly rotation with `setInterval`. Job URL list updated with 19 validated active postings from `karriere.hypoport.de/jobs` (verified 2026-05-12). No interval leaks, no localStorage caching, pure vanilla JS.

### 5. Brand color audit & CSS custom properties (FIXED 2026-05-13)

**Fix:** Complete color system overhaul in `css/video-guide.css`:
- Added `:root` CSS custom properties: `--vg-primary` (Deep Blue), `--vg-accent` (Signal Green), `--vg-interaction` (CTA Red)
- Default button backgrounds: Deep Blue (`#00003c`) instead of light pink
- Progress ring background: Signal Green (`#1ef0aa`) instead of CTA Red
- Progress ring fill (left/right halves): Deep Blue instead of light pink
- Icon colors: White in default state, Deep Blue on hover
- Interaction states: CTA Red (`#ff286e`) for hover, active, and focus-visible
- Play icon background: Deep Blue with rgba() using CSS var RGB form
- All hardcoded color values replaced with CSS variables for easy theming
- Added 5-step tint/shade system for each color (`-50`, `-100`, `-400`, `-600` variants) for future versatility
- Impact: Aligns widget with Hypoport brand palette (locked 2026-05-12), maintains accessibility contrast ratios, enables future color customization

### 3. Avatar image preview (FIXED 2026-05-13)

**Fix:** Complete avatar image implementation:
- Added `<img class="video-guide__avatar">` in `widget.html` pointing to `sample/avatar.jpg`
- Doubled widget size: 240×240 → 480×480 px
- Avatar displays with 4px border (8px total width subtracted), 1:1 aspect ratio, centered
- Uses `object-fit: cover` and `object-position: center` for proper display
- Fallback background color: `--vg-primary-100` (light blue) if image fails to load
- Avatar automatically hides when video starts playing (via `.video-playing` class)
- Added avatar element reference and state management in `js/video-guide.js`
- Impact: Provides visual context before video plays, larger minimized widget shows avatar in full circle

### 11. Stylesheet leaked global resets onto host pages (FIXED 2026-09-02)

**Fix:** `scss/base.scss` declared `* {box-sizing}`, `html, body {margin/padding/overflow-x/width}`, `body {min-height:100vh}` and `p {font-size:24px}` at top level, and all four were in the compiled CSS. `p {font-size:24px}` would have resized every paragraph on a live job offer page.

- The `html`/`body`/`p` rules moved into `index.html`'s own `<style>` block — they only ever existed to make that lorem ipsum page readable. `demo2.html` already carried its own equivalents inline.
- `* {box-sizing: border-box}` became `.video-guide, .video-guide * {box-sizing: border-box}`. It could not simply be dropped: the widget's fixed-size circles measure their 4px/8px borders inside their own width, the chat bubble's padding depends on it, and the AI pill's 46px inset is built on it. Deliberately **not** extended to `::before`/`::after` — `*` never matched pseudo-elements and `box-sizing` is not inherited, so the widget's pseudo-elements have always rendered as `content-box`; including them would have changed existing layout.
- Impact: `css/base.css` is now safe to drop onto any host page. Don't reintroduce an unscoped top-level selector.

### 12. Reveal never fired if the widget.html fetch landed after window.load (FIXED 2026-09-02)

**Fix:** `initVideoGuide()` runs off the `videoGuideWidgetLoaded` event, i.e. after the loader's fetch resolves. It then registered `window.addEventListener('load', …)` to start the intro — but on a slow host page the fetch can resolve *after* `window.load` has already fired, and a listener for a past event never runs. The widget stayed parked below the viewport indefinitely.

- `js/video-guide.js` now checks `document.readyState === 'complete'` first and schedules `runReveal()` immediately in that case, falling back to the `load` listener otherwise.
- Impact: On a real WordPress job offer page the late-fetch order is the *likely* one, not the exotic one, so this would have shown up as "the widget sometimes doesn't appear".
