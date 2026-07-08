# Performance

The widget must be cheap. It runs on third-party pages and competes for the host's main thread.

## Use `requestAnimationFrame`, not `setInterval`, for animated state

The progress ring is updated with RAF, started on `play`, cancelled on `pause`/`ended`:

```js
let progressRafId = null;

function startProgressLoop() {
    if (progressRafId) return;      // guard: never start twice
    function loop() {
        if (video.duration > 0) {
            setPercentage(Math.round((video.currentTime / video.duration) * 100));
        }
        progressRafId = requestAnimationFrame(loop);
    }
    progressRafId = requestAnimationFrame(loop);
}

function stopProgressLoop() {
    if (progressRafId) {
        cancelAnimationFrame(progressRafId);
        progressRafId = null;
    }
}
```

Older versions used `setInterval` inside a `timeupdate` listener — that created a new interval on every fire and leaked. Don't reintroduce that pattern.

## Debounce high-frequency events

`mousemove`, `pointermove`, `resize`, and `scroll` can fire dozens of times per second. If a handler does more than trivial work, debounce or throttle:

```js
let debounceTimer;
videoWrapper.addEventListener('mousemove', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => handleMousePosition(e), 100);
});
```

Exception: the ring scrubbing handler (`pointermove` → `seekToPointer`) must update *every* move for the drag to feel responsive. Don't debounce it.

## Cache DOM references

`initVideoGuide()` caches every element it needs at the top of the function. Don't `querySelector` inside event handlers or loops.

```js
// ✅ once, at init
const video = document.getElementById('videoPlayer');

// ❌ repeated query in a handler
function updateButton() {
    document.querySelector('.video-guide__btn--play').classList.add('active');
}
```

## Use `transform`, not `left/right/top/bottom`

Transforms are GPU-accelerated and don't trigger reflow. The progress ring half-rotation uses `transform: rotate(...)` for exactly this reason.

```css
/* ✅ */
.video-guide__btn--minimize { transform: translateX(-50px); }

/* ❌ — forces reflow */
.video-guide__btn--minimize { left: -50px; }
```

## CSS containment / will-change

Don't sprinkle `will-change` everywhere — it costs memory. Only add it where you've measured a benefit and only on the element actively animating.

## Asset sizes

- Inline SVGs are small (a few hundred bytes each) — fine to keep in JS as string constants for icons that toggle.
- The widget loads `widget.html`, `video-guide.js`, `video-guide.css`, and the video files. No external scripts. No analytics (yet). No tracking pixels.
- Video files in `sample/` are the largest assets. Production deployments should serve the WebM and MP4 from a CDN with proper caching headers.

## Avoid blocking the main thread

- No synchronous network calls (no `XMLHttpRequest` with `async: false`, no synchronous `fetch`).
- No long-running loops in event handlers. If you need to iterate over many items, `setTimeout` with chunks or `requestIdleCallback`.

## Measurement

Use Chrome DevTools Performance panel to check for:
- Long tasks (>50ms) during init
- Layout thrash during ring updates
- Forced synchronous layouts (purple bars in flame chart)

Lighthouse Performance score is informative but not gospel for a third-party widget — it measures the host page, not just the widget.
