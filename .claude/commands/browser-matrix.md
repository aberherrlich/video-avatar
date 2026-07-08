---
description: Run through the browser + viewport test matrix
---

Walk me through the browser and viewport test matrix for the widget. Before starting, ask which change I'm validating (so we know what to focus on) and which browsers I have available right now.

**Browser matrix (priority order):**

| Browser | Versions | Priority | Notes |
|---------|----------|----------|-------|
| Chrome  | Latest 2 | High     | Primary dev browser, WebM VP9 alpha works natively |
| Firefox | Latest 2 | High     | Strong WebM VP9 support |
| Edge    | Latest 2 | High     | Chromium-based, behaves like Chrome |
| Safari  | Latest 2 (macOS + iOS) | Medium | MP4 fallback critical, no WebM VP9 alpha |
| Mobile Safari | iOS 14+ | Medium | Widget hidden below 576px — verify @media |

**Video format check:** In Safari specifically, confirm the second `<source>` (MP4) loads instead of the WebM. Open DevTools → Network tab → reload → check which video request returns 200.

**Viewports to test:**
- Desktop: 1920×1080, 1366×768
- Tablet: 768×1024 (iPad portrait), 1024×768 (landscape)
- Mobile: 375×667 (iPhone), 360×640 (Android)
- <576px: widget should be `display: none` (intentional, see `@media` in `css/video-guide.css`)

**For each browser, ask me to verify:**
1. No console errors during load
2. Restore + minimize works
3. Play/pause + scrubbing works
4. Progress ring renders smoothly (no flicker)
5. Volume toggle works (icon + actual audio mute state)

Report findings after each browser; do not auto-proceed to the next one without my confirmation.
