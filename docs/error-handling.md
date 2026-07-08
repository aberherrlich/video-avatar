# Error Handling

The widget must never crash the host page. All failures degrade gracefully and log to console.

## Video element errors

`<video>` errors arrive on the `error` event. `video.error.code` is one of:

| Code | Constant | Meaning |
|---|---|---|
| 1 | `MEDIA_ERR_ABORTED` | User aborted the fetch |
| 2 | `MEDIA_ERR_NETWORK` | Network failure mid-download |
| 3 | `MEDIA_ERR_DECODE` | Corrupt video or codec mismatch |
| 4 | `MEDIA_ERR_SRC_NOT_SUPPORTED` | No matching `<source>` (e.g. Safari with WebM-only) |

Current handler (in `js/video-guide.js`):

```js
video.addEventListener('error', function() {
    const err = video.error;
    const codes = { 1: 'ABORTED', 2: 'NETWORK', 3: 'DECODE', 4: 'SRC_NOT_SUPPORTED' };
    console.error('video-guide: Video load error:',
        err ? (codes[err.code] || 'code ' + err.code) : 'unknown');
    videoWrapper.classList.add('video-error');
});
```

The `.video-error` class is the hook for any visual fallback (e.g. poster image, error placeholder). The CSS doesn't currently style it — add a rule when needed.

## Autoplay blocking

`video.play()` returns a Promise that rejects when autoplay is blocked. Always attach `.catch`:

```js
video.play().catch(function(err) {
    console.warn('video-guide: play() blocked:', err);
});
```

This is already in place for the play button handler. Browser-blocked autoplay is normal and expected; don't escalate to error.

## Fetch failures (widget-loader.js)

The loader rejects on non-2xx and logs the failure. No further action — the widget simply doesn't appear. Don't try to retry indefinitely or fallback to bundled HTML; failing silently is correct here.

## Null-guard on init

`initVideoGuide()` reads all required DOM references first and aborts with `console.error` if any are missing:

```js
if (!video || !playPause || !speakerBtn || !minimizeBtn ||
    !videoWrapper || !progressRing || !progressRingRight ||
    !widget || !restoreBtn) {
    console.error('video-guide.js: Required DOM elements not found. Initialization aborted.');
    return;
}
```

Add to this list when adding new required elements. Drop from this list when removing them.

## Promise rejection handling

Any new async work (fetch, async/await) must catch errors and degrade visibly:

```js
fetch('/api/video-data')
    .then(data => processData(data))
    .catch(error => {
        console.error('Failed to fetch video data:', error);
        showDefaultState();
    });
```

Unhandled promise rejections in third-party widgets often surface in host-page error monitoring. Treat them as bugs.

## Event-listener attachment failures

For attachments that can fail (mostly `video.play()` and feature-detected APIs), wrap in `try/catch` or `.catch`. For idempotent attachments (`addEventListener`), no wrapper is needed.

## Graceful degradation principles

- If the video fails to load: show the `.video-error` styling, keep the controls inert but visible
- If a control fails to bind: log and continue — never throw out of `initVideoGuide`
- If the async fetch fails: log and accept that the widget doesn't appear; do not block the host page render
- Core function (video playback) should work even if custom controls fail — the `<video>` element has native controls available as a last resort if you remove `controls=""` from markup; the project intentionally doesn't expose them, but it's a fallback knob
