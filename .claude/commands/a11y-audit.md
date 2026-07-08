---
description: Run a WCAG 2.1 AA accessibility audit on the widget
---

Run an accessibility audit against WCAG 2.1 AA. Walk me through each section, ask me to confirm or report issues, and at the end summarize what passed and what needs attention.

**1. Keyboard navigation**
- Tab order: restore button → minimize → volume → play/pause
- Each button must be reachable, focus indicator must be visible (`:focus-visible` styles in CSS)
- Enter and Space activate buttons (native `<button>` behavior — should work for free)
- No focus traps — Tab must be able to leave the widget area
- Space outside input fields toggles play/pause (custom handler in `js/video-guide.js`)

**2. Screen reader (NVDA / VoiceOver)**
- Buttons announce their `title` attribute as accessible name
- `aria-pressed` on toggle buttons (speaker, playPause) updates as state changes — verify by listening for "pressed" / "not pressed" announcements
- Decorative SVGs have `aria-hidden="true"`
- Ask user to test with NVDA (Windows) or VoiceOver (Cmd+F5 on macOS)

**3. Color contrast (WCAG AA targets)**
- Required: 4.5:1 for normal text, 3:1 for large text + UI components + icons
- Known audit results (verify still accurate):
  - Primary pink `rgb(255, 40, 110)` on white → 3.4:1 → passes for icons/large text, fails for normal text
  - Light pink `rgb(255, 180, 200)` on white → 1.7:1 → fails everywhere
- Current widget uses these only for icons/UI surfaces (no text labels), so it passes — but flag immediately if any text labels are added.
- Run Chrome DevTools Lighthouse audit and report Accessibility score.

**4. Zoom + high-contrast mode**
- Test at 200% browser zoom — widget should still fit and be usable (or hide gracefully)
- Test Windows High Contrast Mode if on Windows — buttons should remain visible

**5. Quick wins worth flagging**
- If `aria-live` is missing for video state changes (playing/paused), suggest adding it
- If `title` attributes are translated to German but `aria-label` is missing, consider whether screen readers in non-German contexts have a problem

Output: pass/fail list per section + 3–5 concrete improvements ranked by impact.
