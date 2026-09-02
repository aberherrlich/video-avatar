# Video Guide Widget — Handover

Integration document for the **job portal** WordPress plugin team at
`karriere.hypoport.de`. Everything below describes the tree you were handed
(`dist/video-guide/`); see `VERSION` in that tree for the exact commit.

---

## 1. What it is

A self-contained, embeddable circular video player. It sits fixed in the bottom-right corner of the
page in a chat-bubble style: it arrives with a short intro animation, rests as a 128 px avatar disc
with a greeting bubble, and expands into a 256 px video player with a scrubbable progress ring when
the visitor clicks it.

On a job offer page its job is to deliver a short, per-offer video introduction — a recruiter or team
member talking about that specific role.

**Design goals it was built against:**

1. Loads asynchronously; never blocks host page render
2. Works on current Chrome, Firefox, Edge and Safari (desktop)
3. Mobile behaviour is intentional and documented (currently hidden below 576 px)
4. WCAG 2.1 AA for icons, controls and keyboard interaction
5. Deployable via one snippet, no build step on your side
6. No CSS or JS conflicts with the host page

Goal 6 is the one most relevant to you, and section 7 lists exactly what was done to guarantee it
plus the one caveat that remains.

## 2. Tech stack

| | |
|---|---|
| **Language** | Vanilla JavaScript, ES2015+ (`const`/`let`, default parameters, `Number.isFinite`) |
| **Framework** | None. No React, no Vue, no jQuery. |
| **Runtime dependencies** | None. Zero npm packages, zero CDN requests. |
| **Styling** | Hand-written SCSS compiled to plain CSS. BEM naming throughout. |
| **Build step** | SCSS → CSS only. The CSS in this tree is already compiled — you do not need Sass. |
| **Total size** | ~1.3 MB, almost all of it the two images. Code is ~50 KB. |

**Not minified, comments intact — deliberately.** The CSS is `expanded` format and `scss/base.scss`
ships alongside it. Sass strips `//` comments from every output format, and the overwhelming majority
of this stylesheet's ~650 comments are that kind, so the compiled CSS cannot carry the reasoning
behind the animation timings and layout decisions. The SCSS source is the only place it survives. Do
not minify these files as part of your asset pipeline without keeping a readable copy.

**Browser APIs relied on** (all baseline in evergreen browsers, none polyfilled):
`fetch`, `CustomEvent`, `insertAdjacentHTML`, `requestAnimationFrame` / `cancelAnimationFrame`,
`Element.setPointerCapture`, `window.matchMedia`, `classList.replace`, `Element.closest`,
`getBoundingClientRect`, `HTMLMediaElement.load`.
CSS: custom properties, `clip-path`, `@keyframes`, `filter: blur()`. Autoprefixed for
`> 1%, last 2 versions, not dead`.

## 3. File inventory

```
widget.html               the widget's DOM. fetched at runtime by widget-loader.js
                          and injected at the end of <body>. not a page.
js/widget-loader.js       IIFE. fetches widget.html, injects it, then dispatches the
                          'videoGuideWidgetLoaded' event. ~1.5 KB.
js/video-guide.js         all widget logic — controls, progress ring, scrubbing,
                          greeting bubble, intro sequence, config handling. ~32 KB.
css/base.css              all styles. expanded, unminified.
css/base.css.map          source map pointing at scss/base.scss.
scss/base.scss            the stylesheet's source, with all 633 inline comments.
                          ships for reference; you do not need to compile it.
assets/splash-aline.jpg   default avatar still (52 KB). overridable per offer page.
assets/viewport-bg.png    blurred backdrop behind the video inside the circle
                          (1.2 MB). referenced from the CSS, NOT overridable.
docs/                     architecture, code style, accessibility, security,
                          error handling, performance, testing, known issues.
HANDOVER.md               this file.
VERSION                   build date, commit, branch, repository.
```

**No video files are included.** See section 6.

## 4. How to integrate

### Load order

Four things, in this order:

1. `css/base.css` — enqueue as a normal stylesheet, no dependencies.
2. **The config object**, as an inline script — it must execute *before* the loader.
3. `js/widget-loader.js`
4. `js/video-guide.js`

In WordPress terms: `wp_enqueue_style` for the CSS, `wp_enqueue_script` for the two JS files, and
`wp_add_inline_script( 'video-guide-loader', $config_js, 'before' )` for the config. `video-guide.js`
should declare the loader as a dependency so the order is guaranteed.

Both scripts are safe to load with `defer`. Neither writes to the document during parsing.

### What happens at runtime

```
widget-loader.js  →  fetch(baseUrl + 'widget.html')
                  →  document.body.insertAdjacentHTML('beforeend', html)
                  →  document.dispatchEvent(new CustomEvent('videoGuideWidgetLoaded'))
video-guide.js    →  listens for that event  →  initVideoGuide()
                  →  applyConfig() rewrites the media paths and greeting
                  →  intro sequence starts after window.load + revealDelayMs
```

**The runtime `fetch` is the one thing that can bite you.** Three consequences:

- `widget.html` must be reachable at `baseUrl + 'widget.html'`. Serve it **same-origin** with the
  page and there is no CORS involved at all. Cross-origin requires
  `Access-Control-Allow-Origin` on that file.
- A restrictive Content-Security-Policy will block it. `connect-src` must allow the origin serving
  `widget.html`. If the page has a CSP at all, check this first when the widget does not appear.
- The widget renders nothing until the fetch resolves. Failures are logged to the console as
  `video-guide: Failed to load widget.html:` and degrade silently — the host page is never affected.

### Per-page activation

There is no "enabled" flag in the widget. **Do not enqueue the assets on pages that should not have
it.** An offer page without the widget should ship none of these four files. That keeps the cost of
the optional integration at exactly zero for the pages that opt out.

## 5. Configuration reference

One optional global, read by both scripts. Every key falls back to what the tree ships, so a page
that sets nothing still renders — but on WordPress, `baseUrl` and the two video keys are effectively
required (see notes).

```php
window.videoGuideConfig = {
  baseUrl:       'https://staging.karriere.hypoport.de/wp-content/plugins/job-portal/video-guide/',
  videoWebm:     'https://staging.karriere.hypoport.de/wp-content/uploads/2026/09/aline.webm',
  videoMp4:      'https://staging.karriere.hypoport.de/wp-content/uploads/2026/09/aline.mp4',
  splashImage:   'https://staging.karriere.hypoport.de/wp-content/uploads/2026/09/aline-splash.jpg',
  splashAlt:     'Video Guide Präsentatorin Aline',
  bubbleText:    'Hallo, ich bin Aline und helfe dir gern weiter wenn du Fragen hast.',
  revealDelayMs: 1500
};
```

| key | required | falls back to | suggested editor field |
|---|---|---|---|
| `baseUrl` | **yes** | `''` | none — a plugin constant, not editor input |
| `videoWebm` | **yes** | a path that is not in this tree | per-offer video upload (WebM) |
| `videoMp4` | **yes** | a path that is not in this tree | per-offer video upload (MP4) |
| `splashImage` | no | `assets/splash-aline.jpg` | per-offer avatar still |
| `splashAlt` | no | `Video Guide Präsentatorin Aline` | alt text of the avatar still |
| `bubbleText` | no | the German Aline greeting | per-offer greeting text |
| `revealDelayMs` | no | `1500` | none — a plugin constant |

**`baseUrl`** must end in a trailing slash. It is the folder containing `widget.html`, `css/`, `js/`
and `assets/`. It matters twice: the loader's fetch uses it, and `applyConfig()` uses it to repair
the relative paths inside the injected markup. Without it, `assets/splash-aline.jpg` resolves against
the page URL and becomes `/jobs/<slug>/assets/splash-aline.jpg` — a 404 on every offer page.

**`videoWebm` / `videoMp4`** — the markup's fallbacks point into a `sample/` folder that is
intentionally not part of this distribution, so if you omit these the video will not load. Supply
both: WebM is used by Chrome, Firefox and Edge; Safari needs the MP4.

**`bubbleText`** is written to the DOM with `textContent`, never `innerHTML`. It is safe to pass
editor input directly and HTML in it will render as literal text rather than markup. It cannot
contain formatting — that is deliberate, it is the one untrusted string that enters the widget.

**Absolute URLs win outright.** Any key you set is used verbatim. Keys you omit keep the shipped
relative path with `baseUrl` prefixed onto it. Values that are already absolute (`https://…`,
`//…`) or root-relative (`/…`) are never prefixed, so passing full media-library URLs is always
correct.

## 6. Media requirements

**No video ships with this tree.** Per-offer video comes from the WordPress media library.

| | |
|---|---|
| **Primary format** | WebM, VP9 codec, **with alpha channel** |
| **Fallback format** | MP4, H.264 — Safari does not support VP9 alpha |
| **Aspect** | square or centre-safe; it is displayed inside a 256 px circle |
| **Splash still** | JPG, square, ≥ 256 px per side. The shipped one is 52 KB. |

The alpha channel is what lets the presenter appear to stand on the blurred backdrop rather than
inside a video box. The MP4 fallback has no alpha, so Safari's rendering differs — see section 7.

⚠️ **The sample videos are far too large for production.** The development samples are 43 MB (WebM)
and 27 MB (MP4). That is unacceptable as a page-load asset. Re-encoding to a sane bitrate before
launch is a prerequisite, and it is on your side of the handover — the widget imposes no size limit,
the network does. A ~10-second clip at this display size should be well under 2 MB. Also consider
that the `<video>` element has no `preload="none"`, so the browser starts fetching immediately.

## 7. Constraints and known issues

**Host page safety — what was done:**

Every selector in `base.css` is scoped under `.video-guide`, every CSS custom property is
`--vg-`-prefixed, and every `@keyframes` is `vg-`-prefixed. The stylesheet previously carried global
resets — including a `p { font-size: 24px }` that would have resized every paragraph on your job
pages — and those were removed for this release. Dropping this CSS onto a page should be visually
inert outside the widget's own corner. **Please verify this explicitly on staging** (section 8,
step 4); it is the single highest-impact thing that could go wrong.

**The one JS caveat that remains:** `js/video-guide.js` declares `REVEAL_DELAY_MS`, `REVEAL`,
`BUBBLE_DELAY_MS`, `BUBBLE_HIDE_GRACE_MS` and `initVideoGuide` at global scope. If another script on
the page declares a top-level `const` with any of those exact names, one of the two scripts throws.
The names are specific enough that this is unlikely, but tell us if you hit it — wrapping the file in
an IIFE is a two-line fix on our side.

**Known limitations:**

| | |
|---|---|
| **Mobile** | `display: none` below 576 px. Deliberate, and an open design question — not a bug. |
| **Safari** | No VP9 alpha support, so the MP4 fallback renders without transparency and looks different from Chrome/Firefox/Edge. Not yet verified in production. |
| **One instance per page** | Element IDs are fixed (`vg-video`, `vg-toggle`, `vg-splash`, `vg-loader`, `vg-btn-play`, `vg-btn-volume`, `vg-btn-info`, `vg-btn-minimize`, `vg-btn-bubble-close`). Two widgets on one page will not work. |
| **Intro timing** | The intro starts at `window.load` + `revealDelayMs`. On an image-heavy job page `window.load` can fire late, pushing the intro noticeably later than it appears in our test pages. `revealDelayMs` is the knob; lower it if the widget feels slow to arrive. |
| **No closed captions** | The `<track>` element is not wired up yet. |
| **No loading state** | There is a brief blank moment inside the circle between load and first frame on slow connections. |
| **AI disclosure button** | The "AI GENERATED" label and its hover pill are present and styled, but the button has no click handler — it is a label, not a control, and is not keyboard-focusable in a meaningful way yet. |

`docs/known-issues.md` in this tree carries the full list with locations and suggested fixes.

**Accessibility:** German ARIA labels are intentional (`Minimieren`, `Stummschalten`,
`Hinweis schließen`). The greeting bubble is an `aria-live="polite"` status region. Space toggles
play/pause, guarded against firing while an input or textarea has focus — note that this listener is
on `window`, so it is active whenever the widget is on the page. Full detail in
`docs/accessibility.md`.

## 8. Staging test protocol

Test on `staging.karriere.hypoport.de` before production. Browser testing is the only meaningful
verification for this widget — there is no test suite.

1. **One offer page with the widget, one without.** Confirm the second page loads none of the four
   files. This proves the per-page activation path.
2. **Media resolves.** No 404s in the network tab for `widget.html`, the WebM, the MP4, the splash
   JPG or `viewport-bg.png`. This is the failure mode `baseUrl` exists to prevent.
3. **Per-offer content is correct.** The video and greeting text are the ones set for *that* offer,
   not the defaults.
4. **The host page is untouched.** Compare the offer page with and without the widget enqueued:
   paragraph sizes, page scroll behaviour, any sticky header or footer, and the layout at the
   bottom-right corner must be identical. Check that the widget's fixed position does not sit on top
   of a cookie banner or a floating apply button.
5. **Interactions.** Intro sequence plays; greeting bubble appears once and can be dismissed with its
   close button; clicking the avatar or the bubble expands the player; play/pause via the button, via
   a click on the video, and via Space; mute toggle; progress ring click-to-seek and drag-to-scrub;
   minimize returns to the avatar and pauses playback.
6. **Browsers.** Chrome, Firefox, Edge, Safari on desktop. Below 576 px confirm the widget is absent
   rather than broken.
7. **Reduced motion.** With `prefers-reduced-motion: reduce` set at OS level, the widget must appear
   in its resting state with no intro animation.
8. **Console is clean.** No errors, no CSP violations.

## 9. Provenance

- **Repository:** https://github.com/aberherrlich/video-avatar
- **Commit:** see `VERSION` in this tree
- **Source of truth:** `scss/base.scss` for styles — never edit `css/base.css` directly, it is
  generated. If you need styling changes, request them rather than patching the compiled file; it
  will be overwritten on the next handover.
- The SCSS source and `docs/` ship deliberately so that tooling on the host system retains the
  inline commentary. Please keep them together with the compiled assets.
