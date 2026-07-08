# video guide widget — project notes

Circular video guide widget. Chatbot-style, fixed bottom-right, self-contained embeddable component. Loads asynchronously via `widget-loader.js`, initializes via custom DOM event.

---

## Project goal

A self-contained, embeddable circular video player that delivers a short branded video introduction on any Hypoport landing page — with zero build step, zero dependencies, and no impact on the host page's layout, performance, or accessibility baseline.

### Success criteria

1. Loads asynchronously; never blocks host page render
2. Works on current Chrome, Firefox, Edge, and Safari (desktop)
3. Mobile behavior is intentional and documented (currently hidden < 576px)
4. WCAG 2.1 AA for icons, controls, and keyboard interaction
5. Deployable into WordPress via one snippet, no plugin
6. No CSS/JS conflicts with the host page (BEM-scoped, no jQuery)

---

## Current feature state

| feature | status | notes |
|---|---|---|
| video playback (play/pause) | ✅ done | click button or click video |
| volume toggle (mute/unmute) | ✅ done | speaker button, aria-pressed synced |
| minimize / maximize | ✅ done | class-based, opacity transition |
| progress ring visualization | ✅ done | RAF-based loop, no setInterval leak |
| progress ring scrubbing | ✅ done | click + drag, setPointerCapture, atan2 math |
| keyboard shortcut (space) | ✅ done | play/pause, guarded against input fields |
| video error handling | ✅ done | logs error code, adds .video-error class |
| autoplay block handling | ✅ done | video.play().catch() |
| null guard on init | ✅ done | aborts with console.error if DOM missing |
| wordpress path config | ✅ done | WIDGET_BASE_URL in widget-loader.js |

---

## Architecture

See [CLAUDE.md](CLAUDE.md) for the one-page summary, and [docs/architecture.md](docs/architecture.md) for HTML tree, z-index layers, async load flow, scrubbing math, and state classes.

---

## Constraints (project-specific)

- **video format** — WebM VP9 with alpha channel (Chrome/Firefox/Edge) + MP4 fallback (Safari)
- **pointer-events pattern** — `.video-guide__controls` overlay stays `pointer-events: none`; only buttons get `pointer-events: auto`

For BEM, comment style, no-jQuery, no-build, and SVG attribute rules, see [CLAUDE.md](CLAUDE.md).

---

## Next steps

See [docs/roadmap.md](docs/roadmap.md) — short / medium / long term enhancements.

---

## Open issues and design decisions

See [docs/known-issues.md](docs/known-issues.md) — open bugs and undecided design questions (mobile UX, WordPress deployment mode, video source loading).

---

## File map

```
widget.html             DOM structure, loaded by widget-loader.js
js/widget-loader.js     fetches widget.html, dispatches init event
js/video-guide.js       all widget logic
css/video-guide.css     all styles, BEM
index.html              development test page
demo.html               demo page
demo2.html              demo page 2
sample/                 sample video files + VTT
CLAUDE.md               AI coding rules entry point (loaded every session)
PROJECT.md              this file — project dashboard, goals, status
docs/                   detailed AI-facing guidance (architecture, code-style, a11y, etc.)
.claude/                Claude Code config (settings.json + custom slash commands)
```
