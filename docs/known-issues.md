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

### 4. WordPress inline embedding not implemented

**Problem:** Current loader uses `fetch(WIDGET_BASE_URL + 'widget.html')`. For WordPress, the recommended approach is inline embedding via `wp_footer` hook to eliminate the fetch round-trip and URL configuration headache.
**Location:** `js/widget-loader.js`.
**Suggested fix:** Provide an alternative deployment mode where `widget.html` content is rendered inline by the theme/plugin, and the loader is omitted entirely.
**Priority:** Medium — blocks straightforward WP deployment.

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
