# Code Style

## BEM (strict)

- **Block:** `.video-guide`
- **Element:** `.video-guide__element` (double underscore)
- **Modifier:** `.video-guide__element--modifier` (double dash)
- **State classes** added by JS to parent containers: `.video-playing`, `.video-error`, `.is-dragging`, `.is-visible`, `.video-guide--minimized`

JS uses camelCase for variables and functions. CSS uses kebab-case inside BEM.

## CSS rules

- Keep selectors scoped to the `.video-guide` block — no leaking into the host page
- Use `rgb()` for colors, not hex (matches the existing palette references)
- Property order inside a rule: positioning → display → dimensions → colors → transitions
- Group related selectors
- Use `transform` for animations, not `left/right/top/bottom`
- 4-space indentation

## JavaScript rules

- `const` by default, `let` only when reassignment is needed; no `var` in new code (the legacy `widget-loader.js` IIFE uses `var` — leave it alone unless refactoring the file)
- Always wait for `videoGuideWidgetLoaded` before reading DOM in widget code
- Cache element references at init in `initVideoGuide()`; do not re-query in event handlers or hot paths
- Single quotes for string literals
- 4-space indentation

## Comment style

**Inline comments:** lowercase, no capitalization at the start.

```js
// track pointer even if it leaves the element
let progressRafId = null; // requestAnimationFrame handle for progress loop
```

```css
/* prevent scroll hijack during ring drag */
touch-action: none;
```

**Section headers and block-comment openers:** `-> Name` format.

```js
// -> video state management

/*
 * -> progress ring scrubbing
 * details here
 */
```

```css
/* -> progress ring */
```

```html
<!-- -> control buttons -->
```

When you edit a section that uses an older comment style, update it to this format.

## File header template (every JS/CSS file)

```js
/**
 * file-name.js
 *
 * purpose: one sentence describing what this file does
 * dependencies: list direct dependencies (other files, libs, DOM requirements)
 * key functions: comma-separated list of important exports / public functions
 * event listeners: custom events this file dispatches or listens for
 */
```

```css
/**
 * file-name.css
 *
 * purpose: one sentence describing what this file styles
 * components: high-level chunks (container, ring, viewport, controls)
 * key patterns: any non-obvious technique used (pointer-events layering, z-index stacking, state classes)
 * dependencies: usually "none (self-contained)"
 */
```

## Function header template (significant functions only)

```js
/**
 * functionName()
 * purpose: one sentence
 * input: what it takes
 * output: what it returns or what side effect it produces
 * conditions: any guard clauses or special cases
 * dependencies: which DOM elements or other functions it relies on
 */
```

Skip headers for trivial wrappers and one-liners. Update the header when you change the function — outdated headers are worse than no headers.

## SVG conventions

- Always include `xmlns`, `viewBox`, `width`, `height`, `aria-hidden="true"`
- Mix `fill` and `stroke` carefully — pick one approach per button family. Current buttons use `fill` (minimize, play, volume). If you add a stroke-based icon, override `fill` explicitly to neutralize browser defaults.
- Inline SVG in HTML for static icons; JS string constants (`SVG_PLAY`, `SVG_PAUSE`, `SVG_VOLUME_ON`, `SVG_VOLUME_OFF` in `video-guide.js`) for icons that toggle.

## When to deviate

Rules are for consistency; they're not absolute. Acceptable deviation reasons:

1. **Performance-critical** — e.g. inline `style.transform` for 60fps, with a comment explaining why
2. **Third-party constraint** — external library imposes its own pattern (none currently)
3. **Browser compatibility** — needing a fallback for an unsupported property
4. **Legacy consistency** — matching the surrounding style instead of mixing
5. **Tech-debt trade-off** — quick fix with a `TODO:` or `FIXME:` and a remediation plan

When you deviate: add an explanatory comment, label tech debt with `TODO:`/`FIXME:`, get user approval for anything architectural, and don't let the exception become the new pattern.

**Never deviate on:** security (XSS, validation), accessibility requirements (keyboard nav, contrast), error handling for critical paths (video load, event attachment), or anti-hallucination rules.
