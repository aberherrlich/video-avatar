# Accessibility

Target: WCAG 2.1 Level AA.

## Color contrast

WCAG AA requires:
- **4.5:1** for normal text
- **3:1** for large text (18pt+ or 14pt+ bold) and UI components / icons

### Current palette audit

| Color | RGB | On white | Verdict |
|---|---|---|---|
| Primary pink | `rgb(255, 40, 110)` | 3.4:1 | ✅ icons / large text · ❌ normal text |
| Light pink | `rgb(255, 180, 200)` | 1.7:1 | ❌ everywhere |
| White viewport | `#fff` | n/a | n/a |

The widget currently uses pink only for **icons and UI surfaces** (button fills, ring fill) — no text labels — so it passes.

**⚠️ If anyone adds text labels in pink, the contrast fails immediately.** Either use a darker pink, white text on the pink fill (verify 4.5:1), or pure black/dark text.

## Keyboard navigation

Required tab order in the current build: restore → minimize → volume → play/pause.

- All controls are native `<button>` elements — Enter and Space activate them for free.
- `:focus-visible` must be styled distinctly so keyboard users can see focus. Pair with an explicit `:focus` rule that neutralizes any global override the host page might apply.
- Don't trap focus: Tab must be able to leave the widget area.

Custom keyboard shortcut: `Space` toggles play/pause when focus is not inside an `<input>` or `<textarea>` (see `keydown` handler in `js/video-guide.js`). The guard prevents stealing space-bar typing in form fields.

## Screen readers

Currently in place:

- `title` attributes on every button (`Minimieren`, `Stummschalten`, `Play / Pause`, `Maximieren`) — most screen readers fall back to `title` when no `aria-label` or text content is present.
- `aria-pressed` on the speaker and play/pause buttons, kept in sync with state via `setAttribute('aria-pressed', String(...))`.
- `aria-hidden="true"` on every decorative SVG so screen readers don't try to announce path data.

Worth considering (not yet done):

- `aria-label` on each button as the primary accessible name, so screen readers don't depend on `title` fallback behavior. The German labels are intentional — use German strings for `aria-label` too.
- `aria-live` region announcing video state changes ("playing", "paused", "ended").
- A descriptive label for the progress ring as a slider, e.g. `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`. The current ring is mouse-only — keyboard scrubbing (Left/Right arrow keys) is not implemented.

## Zoom & high-contrast mode

- Test at 200% browser zoom (WCAG requirement). The widget should still be usable; if it overflows, document the limitation.
- Test in Windows High Contrast Mode if available. SVG icons must still be visible — currently they rely on `fill="#000000"` paths, which High Contrast may override.

## Mobile / responsive

Below 576px the widget is `display: none` via `@media`. This is **intentional** — the design decision is that mobile UX doesn't fit the chat-bubble pattern. If product changes the requirement, this is the @media rule to revisit.

## Testing tools

- **Lighthouse** (Chrome DevTools → Lighthouse → Accessibility) — quick smoke test, but doesn't catch everything.
- **axe DevTools** (browser extension, also `deque-systems.vscode-axe-linter` is in `.vscode/extensions.json`) — better coverage than Lighthouse.
- **NVDA** (Windows, free) or **VoiceOver** (macOS, Cmd+F5) — actual screen reader testing is the only ground truth.

Run `/a11y-audit` for a guided walkthrough.
