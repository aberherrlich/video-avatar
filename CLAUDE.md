# Video Guide Widget — Claude Code Instructions

A self-contained, embeddable circular video player for Hypoport. Fixed bottom-right, chat-bubble style. Loads asynchronously: `widget-loader.js` fetches `widget.html` and dispatches a `videoGuideWidgetLoaded` custom event; `video-guide.js` listens and initializes. Zero dependencies, no build step.

> Canonical project goal and success criteria: see [PROJECT.md](PROJECT.md).

## Communication

- Be pragmatic, concise, blunt, honest. No hedging. No apologizing for limitations — state facts.
- No emojis in responses.
- No anticipating needs — answer the actual request only.
- Don't restate the user's question.
- **Language:** English for all code (variables, functions, comments). German UI labels (`Minimieren`, `Stummschalten`, `Maximieren`) are intentional — preserve them. Reply in German only when the user writes in German. Technical explanations stay English unless asked otherwise.

## Certainty labeling

Label every recommendation that isn't obviously verified:

- **[Verified]** — confirmed by reading this codebase or official docs (MDN, browser specs)
- **[Best Practice]** — industry standard (accessibility, performance, semantic HTML)
- **[Inference]** — logical reasoning from existing patterns in this project
- **[Experimental]** — needs browser testing before production
- **[Unverified]** — no reliable source

Don't chain inferences. If any part of a recommendation is unverified, label the whole output. Don't invent APIs, methods, event names, or CSS properties — if unsure, say so.

## Task discipline

- Only do what's asked. No volunteer optimizations, refactors, or features.
- Be self-skeptical. Verify assumptions before acting.
- Don't declare "complete" or "final" until the user has tested. Browser tests are the only ground truth for this widget.
- After 3 failed attempts on the same issue, stop and ask for an alternative approach.
- Before any file deletion / overwrite / major refactor: require explicit user confirmation. Label destructive suggestions with `⚠️ WARNING:`.

## Architecture (one-page summary)

Sibling layout — not nested:

```
.video-guide                          fixed bottom-right, 240×240 with 16px padding
└── .video-guide__content             relative container, 208×208 actual
    ├── .video-guide__progress-ring   absolute, z-index 1 — scrubbing target, ring fill
    │   ├── ...progress-ring-left
    │   └── ...progress-ring-right
    ├── .video-guide__viewport        absolute, z-index 2 — video + play icon
    │   └── .video-guide__video-wrapper
    │       ├── <video> WebM VP9 alpha + MP4 fallback, disablepictureinpicture
    │       └── .video-guide__play-icon
    └── .video-guide__controls        absolute, z-index 3 — pointer-events: none overlay
        ├── .video-guide__btn--minimize   (top-right)
        ├── .video-guide__btn--volume     (bottom-center-left)
        └── .video-guide__btn--play       (bottom-center-right)

.video-guide__restore-btn             separate, appears when widget is minimized
```

The widget starts **minimized**. Restore button maximizes it. Only three controls in current build: minimize, volume, play/pause. **Rewind/forward buttons do not exist.** Progress ring is scrubbable (pointerdown/move/up with `setPointerCapture`, `atan2(dy, dx) + π/2` for angle).

Async flow: `widget-loader.js` (IIFE) → `fetch(WIDGET_BASE_URL + 'widget.html')` → `insertAdjacentHTML('beforeend', ...)` → `dispatchEvent('videoGuideWidgetLoaded')` → `video-guide.js` runs `initVideoGuide()`.

For deep dives, read [docs/architecture.md](docs/architecture.md).

## ALWAYS

- **Edit scss/base.scss for all style changes.** Do NOT edit css/video-guide.css (deprecated as of 2026-05-21). After editing base.scss, compile to css/base.css (SCSS → CSS build step required).
- Ensure index.html and demo2.html reference `css/base.css` and `css/base.css.map`, never `css/video-guide.css`.
- Use BEM strictly: `.video-guide__element--modifier` (double underscore / double dash)
- Keep `pointer-events: none` on `.video-guide__controls`; `pointer-events: auto` on each button
- Maintain z-index hierarchy 1 / 2 / 3 (ring / viewport / controls)
- Include `xmlns`, `viewBox`, `width`, `height`, `aria-hidden="true"` on SVGs
- Use `:focus-visible` for keyboard focus styling; pair it with an explicit `:focus` to neutralize global overrides
- Use `transform` for animations (hardware accelerated), not `left/right/top/bottom`
- Use `requestAnimationFrame` (not `setInterval`) for progress-loop-style updates
- Use `setPointerCapture` for drag-style pointer interactions
- Cache DOM element references at init; never re-query in hot paths
- Update function-header comments when changing function behavior

## NEVER

- Nest the viewport inside the progress ring (they're siblings)
- Add `pointer-events: auto` to the controls container itself (it stays `none`)
- Show buttons whose intended state is "while playing" when `video.paused` is true
- Use `:focus` alone for keyboard styling (use `:focus-visible`)
- Create `setInterval` instances without a cleanup path
- Forget to `dispatchEvent('videoGuideWidgetLoaded')` after HTML injection — `video-guide.js` won't init
- Use `innerHTML` with anything that isn't a trusted hardcoded template (XSS)
- Re-introduce jQuery (current widget is pure vanilla JS)

## Comment style

- **Inline comments:** lowercase, no capitalization. `// track pointer even if it leaves the element`
- **Section headers and block-comment openers:** `// -> Section Name` / `/* -> Section Name */` / `<!-- -> Section Name -->`
- File header for every JS/CSS file: purpose / dependencies / key functions / event listeners. See [docs/code-style.md](docs/code-style.md) for the template.

## Color reference

```
rgb(255,  40, 110)    primary pink — active, hover, ring fill
rgb(255, 180, 200)    light pink — default button, ring background
#fff                  viewport background
```

Contrast notes: primary pink on white = 3.4:1 (passes AA for icons/large text, fails for normal text). Light pink on white = 1.7:1 (fails all AA). Current widget uses both only for icon/UI surfaces — no text labels — so it passes. Flag immediately if anyone adds text labels in pink.

## Doc index — when to read which

Each is loaded on demand, not auto-loaded. Cite the file path when an answer needs detail beyond this overview.

- [docs/architecture.md](docs/architecture.md) — HTML tree, z-index, async flow, scrubbing math, state classes
- [docs/code-style.md](docs/code-style.md) — BEM details, comment templates, file header format, naming
- [docs/security.md](docs/security.md) — XSS prevention, input validation, HTTPS/CORS
- [docs/error-handling.md](docs/error-handling.md) — video error codes, promise rejection, graceful degradation
- [docs/performance.md](docs/performance.md) — RAF over setInterval, debouncing, hardware acceleration
- [docs/accessibility.md](docs/accessibility.md) — WCAG 2.1 AA, contrast audit, keyboard nav, screen readers
- [docs/testing.md](docs/testing.md) — browser matrix, viewports, interaction checklist, post-change protocol
- [docs/known-issues.md](docs/known-issues.md) — current open issues with status
- [docs/roadmap.md](docs/roadmap.md) — short/medium/long term enhancements

Slash commands: `/interaction-check`, `/browser-matrix`, `/a11y-audit`, `/triage`.

## Hypoport AI compliance (reminder)

Already enforced at org policy level — restated here for visibility:

- Don't paste secrets, credentials, internal tokens, or personal customer data into prompts.
- Only technically necessary inputs.
- Least-privilege: terminal / write / execute rights only in the approved scope.
- Critical or potentially security-relevant actions require manual user confirmation.
- AI-assisted code goes through the regular review / test / release process.
