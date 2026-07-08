# Architecture

## File responsibilities

| File | Role |
|---|---|
| `widget.html` | DOM structure for the widget. Loaded dynamically, never linked from the host page's `<head>`. |
| `js/widget-loader.js` | Tiny IIFE. Fetches `widget.html`, injects at end of `<body>`, dispatches a custom event. |
| `js/video-guide.js` | All widget logic. Waits for the custom event, then runs `initVideoGuide()`. |
| `css/video-guide.css` | All styles, BEM, self-contained. |

## HTML structure — single fixed root, children stacked via absolute positioning

`.video-guide` is the single fixed anchor (256×256, `right: 64px, bottom: 64px`, `display: flex`). All four direct children are `position: absolute` and stack inside it. The flex centering handles 128×128 children automatically — no manual offset math. Inside `__content`, the progress ring, viewport, and controls are **siblings**, not nested.

```
.video-guide  (fixed 256×256, flex center — js-minimized starts ON by default)  role="region"
├── .video-guide__content          absolute inset: 0  (fills root)
│   ├── .video-guide__progress-ring             z 1 — scrubbing target, ring fill
│   │   ├── .video-guide__progress-ring-left    aria-hidden
│   │   └── .video-guide__progress-ring-right   aria-hidden
│   ├── .video-guide__viewport                  z 2 — circular video viewport
│   │   └── .video-guide__video-wrapper
│   │       ├── <video id="vg-video">
│   │       │     <source ... .webm type="video/webm">
│   │       │     <source ... .mp4  type="video/mp4">
│   │       │   </video>
│   │       └── .video-guide__play-icon         aria-hidden
│   └── .video-guide__controls                  z 3 — overlay with pointer-events: none
│       ├── .video-guide__btn--minimize  #vg-btn-minimize  aria-label="Minimieren"
│       ├── .video-guide__btn--volume    #vg-btn-volume    aria-label="Stummschalten"  aria-pressed
│       └── .video-guide__btn--play      #vg-btn-play      aria-label="Play / Pause"   aria-pressed
├── .video-guide__load-indicator   absolute 128×128, centered by parent flex
│                                  aria-hidden — decorative breathing dots
├── .video-guide__splash  #vg-splash   absolute inset: 0, flex center
│   ├── .video-guide__btn--splash  aria-label="Video Guide öffnen"
│   │   └── <img .video-guide__avatar>
│   └── .video-guide__chat-bubble               role="status" aria-live="polite"
│       └── .video-guide__chat-bubble-text
└── .video-guide__toggle  #vg-toggle  absolute 128×128, centered by parent flex (empty — minimize/maximize reserved)
```

Only three controls exist in the current widget. There are **no rewind / forward buttons** — older docs sometimes mention them; the current build does not have them.

## Layer sizing

| Element | Size | How positioned |
|---|---|---|
| `.video-guide` (root) | 256×256 | `position: fixed`, `right: 64px`, `bottom: 64px` |
| `__content` | 128×128 | `position: absolute; top: 64px; right: 64px` (centered, same as splash/toggle) |
| `__load-indicator` | 128×128 | `position: absolute`, centered by root `display: flex` |
| `__splash` | fills root | `position: absolute; inset: 0` |
| `__toggle` | 128×128 | `position: absolute`, centered by root `display: flex` |

`__content` and `__splash` fill the root and cross-fade via `opacity` transition. 128×128 children center automatically — no coordinate arithmetic needed.

## Z-index layers (within `__content`)

```
z 1   .video-guide__progress-ring       (must be clickable for scrubbing)
z 2   .video-guide__viewport            (video + play icon)
z 3   .video-guide__controls            (button overlay)
```

Sequential and small. Don't introduce new z-indexes without reading this section.

## Pointer-events pattern

`.video-guide__controls` has `pointer-events: none` so clicks fall through to the video below. Each `.video-guide__btn` reasserts `pointer-events: auto` so the buttons stay clickable. Don't break this: putting `pointer-events: auto` on the container blocks clicks from reaching the video.

## Async loading flow

```js
// widget-loader.js
(function() {
    var WIDGET_BASE_URL = '';      // set to absolute URL for WP / CDN
    fetch(WIDGET_BASE_URL + 'widget.html')
        .then(r => r.ok ? r.text() : Promise.reject('HTTP ' + r.status))
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            document.dispatchEvent(new CustomEvent('videoGuideWidgetLoaded'));
        })
        .catch(err => console.error('video-guide: Failed to load widget.html:', err));
})();

// video-guide.js
document.addEventListener('videoGuideWidgetLoaded', function() {
    initVideoGuide();
});
```

All widget logic is scoped inside `initVideoGuide()` — no global pollution. Null-guards abort init with a console.error if any required DOM element is missing.

## WordPress deployment options

1. **Fetch mode (current default):** set `WIDGET_BASE_URL` in `widget-loader.js` to an absolute URL pointing to the widget assets folder. Works on same-origin or CDN.
2. **Inline mode (recommended, not yet implemented):** embed `widget.html` content directly via the `wp_footer` hook and remove the loader entirely. No fetch round-trip and no URL configuration.

## State management

State is conveyed by class names on container elements, not by JS variables. Add/remove classes; never inline `style.display`.

All JS-toggled state classes use the `js-` prefix. These classes carry no styles of their own — CSS selects on them to apply visual state.

| Class | On | Meaning |
|---|---|---|
| `js-minimized` | `.video-guide` | Widget is collapsed. Splash is shown. |
| `js-splash-visible` | `.video-guide__splash` | Splash screen is visible (paired with minimized state). |
| `js-playing` | `.video-guide__video-wrapper` | Video is currently playing. |
| `js-error` | `.video-guide__video-wrapper` | Video load failed; show fallback styling. |
| `js-dragging` | `.video-guide__progress-ring` | Pointer is actively scrubbing the ring. |
| `js-bubble-visible` | `.video-guide__chat-bubble` | Chat bubble is shown. |
| `js-hidden` | `.video-guide__load-indicator` | Load indicator is hidden after reveal delay. |
| `js-toggle-revealed` | `.video-guide__toggle` | Toggle moves from center to top-right corner (64×64). |

## Progress ring scrubbing — the math

Pointer events on `.video-guide__progress-ring` capture the pointer and convert position to a 0–1 seek value:

```js
function getRingProgress(e) {
    const rect = progressRing.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    let angle = Math.atan2(dy, dx) + Math.PI / 2; // shift origin from 3 o'clock to 12 o'clock
    if (angle < 0) angle += Math.PI * 2;
    return angle / (Math.PI * 2);                 // normalized 0..1, clockwise
}
```

`pointerdown` captures the pointer (`setPointerCapture`) and seeks. `pointermove` continues seeking while dragging. `pointerup` finalizes; a pure click without movement still seeks. `pointercancel` aborts cleanly.

## Progress ring fill — the two-halves trick

`setPercentage(v)` rotates one of two stacked half-rings:

- 0–50%: right half rotates from 0° to 180°, left half stays pink — visible progress sweeps from 12 to 6 o'clock.
- 50–100%: right half background is set to `inherit` (matches the surrounding ring), and rotates again from 0° to 180° — now the unmasked area is the *left* half sweeping from 6 to 12.

Driven by `requestAnimationFrame` (`startProgressLoop` / `stopProgressLoop`). Don't replace with `setInterval`.
