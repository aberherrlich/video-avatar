---
description: Walk through the 7-item interaction checklist for the widget
---

Walk through the current widget's interaction checklist. For each item, state what to test, what the expected result is, and ask me to confirm before moving on.

The widget is loaded by opening `index.html`, `demo.html`, or `demo2.html` in a browser. It starts in minimized mode (small restore button only). Clicking the restore button shows the full circle.

**Checklist:**

1. **Restore from minimized:** Click the small chat-bubble button (bottom-right) → widget expands to full circle, video viewport visible.
2. **Play/pause toggle:** Click play icon (or anywhere on the video) → video plays, play SVG swaps to pause SVG, `aria-pressed="true"`, progress ring starts filling.
3. **Volume toggle:** Click speaker button → mute toggles, SVG swaps between volume-on / volume-off, `aria-pressed` updates.
4. **Minimize:** Click minimize button (top-right, hide icon) → widget collapses, small restore button reappears.
5. **Progress ring fill:** Let video play 0→100% → right half rotates 0–180°, then left half flips and rotates again. No gaps, no flicker.
6. **Progress ring scrubbing:** Click and drag on the pink ring → `video.currentTime` jumps to that angle, ring updates live. `setPointerCapture` keeps drag tracking even if pointer leaves the ring.
7. **Keyboard space:** Focus is not on input/textarea → press Space → play/pause toggles. With focus inside an `<input>`, Space should type a space, not toggle.

After all 7 pass, also ask me to check the browser console for errors and warn about any `TypeError`, `ReferenceError`, or `Failed to load resource` entries.
