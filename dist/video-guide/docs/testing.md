# Testing

There is no automated test suite. All testing is manual, in real browsers. Browser tests are the ground truth — code that "looks correct" hasn't shipped until a human has clicked through it.

## Browser matrix

| Browser | Versions | Priority | Notes |
|---------|----------|----------|-------|
| Chrome  | Latest 2 | High     | Primary dev browser |
| Firefox | Latest 2 | High     | Strong WebM VP9 support |
| Edge    | Latest 2 | High     | Chromium-based, similar to Chrome |
| Safari  | Latest 2 (macOS + iOS) | Medium | MP4 fallback critical; no WebM VP9 alpha |
| Mobile Safari | iOS 14+ | Medium | Widget hidden below 576px |

Verify MP4 fallback in Safari specifically: DevTools → Network → reload → confirm the `.mp4` source loads (not the `.webm`).

## Viewports

- Desktop: 1920×1080, 1366×768
- Tablet: 768×1024, 1024×768
- Mobile: 375×667, 360×640
- Below 576px: widget should be `display: none` (intentional)

## Interaction checklist

After any code change, walk through these in the active browser:

1. **Restore from minimized** — click restore button → widget expands.
2. **Play/pause toggle** — click play icon (or anywhere on the video) → SVG swaps, `aria-pressed` updates, progress ring starts filling.
3. **Volume toggle** — click speaker → mute toggles, SVG and `aria-pressed` update.
4. **Minimize** — click minimize → widget collapses, restore button reappears.
5. **Progress ring fill** — let video play 0→100% → ring fills smoothly, no flicker.
6. **Progress ring scrubbing** — click and drag the ring → `video.currentTime` jumps and ring updates live. Verify drag continues even if pointer leaves the ring.
7. **Keyboard space** — focus outside any input → press Space → play/pause toggles. Focus inside an `<input>` → Space types normally.

Run `/interaction-check` for an interactive version.

## Console error rules

Open DevTools console before testing. **No red errors during normal interaction.**

Acceptable warnings:
- CORS warnings from CDN-loaded assets (depending on host)
- Deprecation notices about non-essential APIs

Critical, must investigate:
- `Uncaught TypeError` — property/function doesn't exist
- `Uncaught ReferenceError` — variable not defined
- `Failed to load resource` — video / script / stylesheet missing
- `Unhandled promise rejection` — missing `.catch`

## Video format testing

- WebM VP9 with alpha → Chrome, Firefox, Edge
- MP4 fallback → Safari, older browsers
- Test error path: temporarily break the `<source>` URLs → widget should add `.video-error` class on `<video class="video-guide__video-wrapper">` and log a friendly error code (1–4 or "unknown").

## Post-change protocol

After any non-trivial edit:

1. Save file, refresh page
2. Check console (F12)
3. Test the main use case for whatever you touched
4. Test keyboard nav if you changed focus styles
5. Test responsive if you changed layout/sizing
6. Compare against screenshots if the change is visual

Don't tell the user "done" before this loop completes.

## Visual regression

When making CSS changes, compare before/after for:
- Button sizes and positions
- Progress ring thickness, color, sweep direction
- Viewport circle size and border
- Z-index layering (progress behind viewport, controls on top)
- Transition smoothness (no jank, no flashing)
