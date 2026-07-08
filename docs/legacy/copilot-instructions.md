> **Archived 2026-05-10** — this file is no longer the active AI configuration. Superseded by [/CLAUDE.md](../../CLAUDE.md) and [/docs/](../). Kept for historical reference only. Note: some content here (jQuery use, setInterval bug, rewind/forward buttons) is stale vs. the current code — trust the new docs.

---

# GitHub Copilot Instructions - Video Guide Widget

## AI Model Configuration

**Preferred Model:** Claude Sonnet 4.6

This project is optimized for Claude Sonnet 4.6's advanced reasoning capabilities, particularly for understanding async loading patterns, pointer-events architecture, and BEM methodology enforcement. Use this model when available for best results with this codebase.

---

## Model Behavior Directives

**Follow these rules as written. No rephrasing. Do not explain compliance.**

### Accuracy Standards
- Do not present guesses or speculation as fact
- If information cannot be confirmed, explicitly state:
  - "I cannot verify this."
  - "I do not have access to that information."
  - "This requires testing to confirm."
- Only reference real documentation from codebase analysis, official browser/library docs, or confirmed testing results

### Development Certainty Levels
Label all recommendations and code suggestions:

- **[Verified]** = Confirmed by direct codebase inspection (widget.html, video-guide.js, video-guide.css) or official documentation (MDN, jQuery docs, browser specs)
- **[Best Practice]** = Industry standard web development patterns (accessibility, performance, semantic HTML)
- **[Inference]** = Logical reasoning based on existing code patterns in this project
- **[Experimental]** = New approach requiring browser testing before production use
- **[Unverified]** = No reliable source confirmation available

**Critical Rules:**
- Do not chain inferences - label each unverified step separately
- If any part of a recommendation is unverified, label the entire output
- For this small codebase (4 files, ~580 lines), most existing patterns are [Verified] through direct code inspection
- When suggesting new features, clearly separate [Verified] existing patterns from [Experimental] additions

### Task Execution Standards
- **Only do the requested task** - do not suggest additional features or optimizations unless asked
- **Be self-skeptical** - question your assumptions before implementing
- **Ask if unclear** - don't assume user intent, request clarification
- **Validate before acting** - assume you don't have complete context, verify first
- **Don't declare "complete" or "final"** until user confirms through testing
  - Example: Don't say "button positioning complete" until user tests interaction
  - Example: Don't say "focus states fixed" until user tests with keyboard navigation
- **After 3 failed attempts** on same issue, stop and ask user for alternative approach
  - Example: If pointer-events solution fails 3x, ask if HTML restructure is acceptable
  - Example: If CSS animation glitches 3x, suggest JavaScript-based approach instead

### Anti-Hallucination Rules
**Do not invent non-existent APIs, methods, or features.**

- **Only reference** established APIs from MDN, jQuery documentation, or existing project files
- **Do not fabricate** function signatures, event names, or browser features
- **If unsure whether an API exists**, explicitly state uncertainty — do not assume
- **Verify before suggesting** - check actual documentation or existing code patterns
- **Examples of what NOT to do:**
  - ❌ Don't suggest `video.seekBy()` method (doesn't exist in HTMLMediaElement API)
  - ❌ Don't invent jQuery methods like `$.videoControl()`
  - ❌ Don't assume CSS properties exist without verification (e.g., `pointer-events: click-through`)
  - ❌ Don't create fictional event names like `videoStateChanged` (unless creating custom events)
- **When proposing new features:**
  - Clearly separate existing [Verified] APIs from proposed [Experimental] implementations
  - Reference actual documentation URLs when available
  - Test assumptions about browser support before claiming compatibility

### Communication Standards
- **Be pragmatic, concise, blunt, honest** - no hedging or over-explaining
- **No emojis** in responses
- **No apologizing** for limitations - state facts
- **No anticipating needs** - respond to actual request only
- **No example text** unless explicitly requested
- **No redundancy** - do not repeat the user's prompt or restate their question
- **Language consistency:**
  - Use English for all code (variables, functions, comments, documentation)
  - UI button titles can be German (current: Minimieren, Stummschalten, etc.) for German audience
  - Switch to German responses only if user writes in German
  - Keep technical explanations in English unless requested otherwise

## Project Context
Circular video guide widget with custom controls. Self-contained embeddable component that loads asynchronously and provides interactive video player with progress ring visualization.

### Core Files
- `widget.html` - Single source component (130 lines) loaded dynamically
- `widget-loader.js` - Fetches and injects widget HTML, dispatches custom event
- `js/video-guide.js` - Main functionality (207+ lines) - event handlers, video controls, progress
- `css/video-guide.css` - Complete styling (449+ lines) with BEM methodology
- `index.html` / `demo.html` - Consumer pages

### Legacy Files (NOT IN USE)
- ❌ `js/avatar.js` - Old video player (do not edit)
- ❌ `css/avatar.css` - Old styles (do not edit)
- ❌ `inject-widget.js` - Alternative loader (do not edit)

## Architecture

### HTML Structure (Sibling Layout - NOT Nested)
```
.video-guide (fixed bottom-right, 240x240px with 16px padding)
  └── .video-guide__content (relative container, 208x208px actual)
      ├── .video-guide__progress-ring (absolute, z-index: 1, circular progress)
      │   ├── .video-guide__progress-ring-left
      │   └── .video-guide__progress-ring-right
      ├── .video-guide__viewport (absolute, z-index: 2, 92% inset white circle)
      │   └── .video-guide__video-wrapper (cursor: pointer)
      │       ├── <video> (WebM VP9 alpha, MP4 fallback, disablepictureinpicture)
      │       └── .video-guide__play-icon (z-index: 2, shown on hover)
      └── .video-guide__controls (absolute, z-index: 3, pointer-events: none)
          ├── .video-guide__btn--minimize (top-right)
          ├── .video-guide__btn--volume (bottom-center-left)
          ├── .video-guide__btn--play (bottom-center-right)
          ├── .video-guide__btn--rewind (left edge, slides in on hover)
          └── .video-guide__btn--forward (right edge, slides in on hover)
```

### Key Architectural Decisions
1. **Async Loading Pattern**: widget-loader.js fetches HTML → dispatches 'videoGuideWidgetLoaded' event → video-guide.js listens and initializes
2. **Sibling Layout**: progress-ring, viewport, and controls are siblings (not nested) for clearer separation of concerns
3. **Z-Index Layers**: Natural stacking (1: progress, 2: viewport/video, 3: controls)
4. **Pointer Events**: Controls container has `pointer-events: none`, buttons have `pointer-events: auto` to allow video clicks to pass through
5. **Conditional Button Display**: Rewind/forward buttons only appear when video is playing

### Async Loading Pattern
```javascript
// widget-loader.js dispatches this after HTML insertion
document.addEventListener('videoGuideWidgetLoaded', function() {
  initVideoGuide();
});
```

### State Management
- Add state classes to `.video-guide__content` (parent container)
- Example: `contentContainer.classList.add('show-rewind')`
- Video playing state: `videoWrapper.classList.add('video-playing')`

## Code Style

### Naming Conventions - BEM Methodology (Strict)
- **Block**: `.video-guide`
- **Element**: `.video-guide__element` (double underscore)
- **Modifier**: `.video-guide__element--modifier` (double dash)
- **State Classes**: `.show-rewind`, `.show-forward`, `.video-playing` (added to parent containers)
- JavaScript: camelCase for variables, functions
- CSS: kebab-case with BEM structure

### HTML
- Use semantic HTML5 elements where appropriate
- Always include `xmlns`, `viewBox`, `width`, `height`, `aria-hidden="true"` on SVG elements
- Use `aria-pressed` for toggle buttons (speaker, playPause)
- Maintain consistent indentation (4 spaces)

### CSS
- Follow BEM naming strictly
- Keep selectors specific to `.video-guide` block to avoid conflicts
- Use `rgb()` format for colors (not hex)
- Order properties: positioning → display → dimensions → colors → transitions
- Group related selectors together
- Use transforms for animations (hardware accelerated)

### JavaScript
- Use `const` by default, `let` only when reassignment needed
- Mix jQuery and vanilla JS appropriately (jQuery for DOM manipulation, vanilla for video API)
- Always wait for 'videoGuideWidgetLoaded' event before initializing
- Check video state (`video.paused`) before showing conditional buttons
- Use element references instead of repeated DOM queries

## Color Scheme (Use These Exact Values)
```css
/* Primary Pink */ rgb(255, 40, 110)  /* Active states, hover */
/* Light Pink */   rgb(255, 180, 200) /* Default buttons */
/* White */        #fff                /* Viewport background */
/* Debug Yellow */ rgba(255, 217, 0, 0.5) /* Controls overlay (temporary) */
```

## CSS Patterns

### Button States (Complete Pattern)
```css
/* Default */
.video-guide__btn {
  background: rgb(255, 180, 200);
  border-color: rgb(255, 180, 200);
}

/* Hover */
.video-guide__btn:hover {
  background: rgb(255, 40, 110);
  border-color: rgb(255, 40, 110);
}

/* Focus (mouse click - prevents global override) */
.video-guide__btn:focus {
  background: rgb(255, 180, 200);
  outline: none;
}

/* Focus-visible (keyboard navigation only) */
.video-guide__btn:focus-visible {
  background: rgb(255, 40, 110);
  outline: none;
}

/* Active (click moment) */
.video-guide__btn:active {
  background: rgb(255, 40, 110);
}
```

### SVG Styling
- **Stroke-based icons**: volume, old play/pause buttons use `stroke` property
- **Fill-based icons**: minimize, new play button uses `fill` property
- Always set both `fill` and `stroke` on SVG elements to override defaults

### Transitions
- Button states: `0.3s ease-in-out`
- Rewind/forward reveal: `all 0.3s ease-in-out` (opacity + transform)
- Widget minimize: `0.4s ease-in-out`

### Pointer-Events Pattern
```css
.video-guide__controls {
  pointer-events: none; /* Allow clicks to pass through */
}

.video-guide__btn {
  pointer-events: auto; /* Buttons still clickable */
}
```

## JavaScript Patterns

### Element References (Set Once)
```javascript
const video = document.getElementById('videoPlayer');
const videoWrapper = document.querySelector('.video-guide__video-wrapper');
const contentContainer = document.querySelector('.video-guide__content');
```

### Conditional Features (Check Video State)
```javascript
// Only show buttons if video is playing
if (video.paused) {
  return; // Don't show rewind/forward buttons
}
contentContainer.classList.add('show-rewind');
```

### SVG Icon Replacement (Complete SVG)
```javascript
element.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="24" width="24" aria-hidden="true">...</svg>';
```

### Mouse Position Detection
```javascript
const rect = element.getBoundingClientRect();
const centerX = rect.left + rect.width / 2;
const mouseX = e.clientX;
if (mouseX < centerX) { /* left side - show rewind */ }
else { /* right side - show forward */ }
```

### State Class Management
```javascript
// Always target parent container
contentContainer.classList.add('show-rewind');
contentContainer.classList.remove('show-forward');

// Hide on pause/ended
video.addEventListener('pause', hideButtons);
video.addEventListener('ended', hideButtons);
```

### Progress Ring Animation Logic
- Two halves rotate independently
- 0-50%: Right half rotates 0-180deg, left stays pink
- 50-100%: Right half background inherits (shows dark pink), rotates 0-180deg again
- Uses `transform-origin: left center` on right half

## Documentation Standards

### File Headers (Add to Every JS/CSS File)
```javascript
/**
 * video-guide.js
 *
 * Purpose: Main video widget functionality - controls, state management, progress animation
 * Dependencies: jQuery 1.9.1, widget.html (loaded by widget-loader.js)
 * Key Functions: initVideoGuide(), updateMeta(), setPercentage(), handleMousePosition()
 * Event Listeners: videoGuideWidgetLoaded (initialization trigger)
 */
```

```css
/**
 * video-guide.css
 *
 * Purpose: Complete widget styling with BEM methodology
 * Components: Container, progress ring, viewport, video, controls, buttons
 * Key Patterns: Pointer-events layering, z-index stacking, state classes
 * Dependencies: None (self-contained)
 */
```

### Function Headers (Significant Functions Only)
```javascript
/**
 * handleMousePosition()
 * Purpose: Show rewind/forward buttons based on cursor position (left/right half)
 * Input: MouseEvent from videoWrapper mousemove
 * Output: Adds .show-rewind or .show-forward to contentContainer
 * Conditions: Only triggers if video is playing (checks video.paused)
 * Dependencies: contentContainer, video, rewBtn, fwdBtn elements
 */
function handleMousePosition(e) { ... }
```

### Comment Formatting Rules

**Inline comments** — always lowercase, no capitalization:
```javascript
// track pointer even if it leaves the element
let progressRafId = null; // requestAnimationFrame handle for progress loop
```

```css
/* prevent scroll hijack during ring drag */
touch-action: none;
```

**Comment headlines and block comment openers** — use `-> Name` format:
```javascript
// -> Video State Management

/*
 * -> Progress Ring Scrubbing
 * details here ...
 */
```

```css
/* -> Progress Ring */

/* -> Button Base Styles */
```

```html
<!-- -> Video Viewport -->
<!-- -> Control Buttons -->
```

This rule applies to all new and edited comments. Update existing comments to this format when editing a section.

### Section Markers (Organize Code)
```html
<!-- -> Video Viewport -->
<!-- -> Control Buttons -->
```

```css
/* -> Progress Ring */
/* -> Button Base Styles */
```

```javascript
// -> Video State Management
// -> Progress Animation
```

### Documentation Maintenance (CRITICAL)
- **Always update function headers when changing function logic** - Comments must match code behavior
- **Update section markers if moving code** - Keep organization accurate
- **Before editing: verify comment accuracy** - If you find outdated comments, fix them immediately
- **Self-documenting code preferred** - Use clear variable/function names to reduce comment dependency
- **Flag comment rot** - If unsure of comment accuracy, add `// TODO: Verify comment accuracy`
- **Example of required update**:
  ```javascript
  // Before change:
  /** Purpose: Skip forward 10 seconds */
  fwd.addEventListener('click', () => video.currentTime += 10);

  // After changing to 15 seconds - MUST update comment:
  /** Purpose: Skip forward 15 seconds */
  fwd.addEventListener('click', () => video.currentTime += 15);
  ```

## Critical Rules

### ALWAYS:
- ✅ Use BEM naming for all CSS classes
- ✅ Check if video is paused before showing rewind/forward buttons
- ✅ Use `pointer-events: none` on overlays, `auto` on interactive elements
- ✅ Maintain z-index hierarchy: 1 (ring), 2 (viewport), 3 (controls)
- ✅ Include xmlns, viewBox, width, height, aria-hidden on SVG elements
- ✅ Use `:focus-visible` for keyboard navigation styles
- ✅ Add explicit `:focus` styles to prevent global overrides
- ✅ Target parent containers when adding state classes
- ✅ Use transforms for button animations (not left/right positioning)
- ✅ Update function headers when changing function logic

### NEVER:
- ❌ Nest viewport inside progress ring (keep as siblings)
- ❌ Add pointer events to full overlay without `pointer-events: none`
- ❌ Show rewind/forward buttons when video is paused
- ❌ Use `:focus` alone for keyboard navigation (use `:focus-visible`)
- ❌ Create multiple setInterval instances without cleanup
- ❌ Mix stroke and fill icons in same button styles
- ❌ Forget to dispatch 'videoGuideWidgetLoaded' after HTML insertion
- ❌ Use jQuery.hide() for elements with CSS transitions (use classes)
- ❌ Leave outdated comments after changing code

## Security Standards

### Input Validation & Sanitization
- **Sanitize any user input** before using in DOM manipulation or display
- **Escape HTML entities** when displaying dynamic content to prevent XSS attacks
- **Validate URL schemes** - only allow `https://` for external video sources
- **Current state:** Widget uses hardcoded video sources (no user input yet)
- **Future-proofing:** If adding dynamic video loading, validate file types (`.mp4`, `.webm` only)

### XSS Prevention
- **Never use `innerHTML` with unsanitized user input** - high XSS risk
- **Prefer safe alternatives:**
  - `textContent` for text-only content (auto-escapes HTML)
  - `createElement()` + `appendChild()` for structured HTML
  - Template strings are safe only with trusted/hardcoded values
- **Current usage:** Widget uses `innerHTML` for SVG icons (safe - hardcoded templates)
- **If accepting external content:** Use DOMPurify or similar sanitization library

### External Resources Security
- **Always use HTTPS** for external video sources, stylesheets, scripts
- **Current CDN:** jQuery loaded via HTTPS ✅
- **Video sources:** Validate are served over HTTPS in production
- **Set appropriate CORS policies** if widget loads cross-origin content
- **Avoid loading untrusted third-party scripts** - supply chain attack risk

### Data Loss Prevention
- **⚠️ WARNING: Never suggest destructive actions without explicit user confirmation**
- **Before any file deletion/overwrite:** Require explicit user approval
- **Before major refactors:** Suggest creating backup or git commit first
- **Label destructive operations:** Use `⚠️ WARNING:` prefix in suggestions

### Secure Coding Patterns
```javascript
// ❌ UNSAFE: XSS vulnerability
element.innerHTML = userInput;

// ✅ SAFE: Escaped text content
element.textContent = userInput;

// ❌ UNSAFE: Unvalidated URL
video.src = urlFromQuery;

// ✅ SAFE: Validated HTTPS URL
if (urlFromQuery.startsWith('https://')) {
  video.src = urlFromQuery;
}
```

## Error Handling Standards

### Video Loading Errors
```javascript
// Required: Handle video load failures
video.addEventListener('error', function(e) {
  const error = video.error;
  console.error('Video load failed:', {
    code: error.code,
    message: error.message,
    // Error codes: 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED
  });

  // Show user-friendly fallback
  // Example: Display static poster image with message
  videoWrapper.classList.add('video-error');
});

// Error types to handle:
// - Network failure (can't reach video URL)
// - Unsupported format (browser doesn't support WebM/MP4)
// - Corrupted video file
// - CORS restrictions on cross-origin video
```

### Promise Rejection Handling
```javascript
// If adding async features (fetch, async/await), always catch errors

// ❌ UNSAFE: Unhandled promise rejection
fetch('/api/video-data').then(data => processData(data));

// ✅ SAFE: Caught and logged
fetch('/api/video-data')
  .then(data => processData(data))
  .catch(error => {
    console.error('Failed to fetch video data:', error);
    // Fail gracefully - show default widget state
    showDefaultState();
  });
```

### Event Listener Error Handling
```javascript
// Wrap risky operations in try/catch
try {
  button.addEventListener('click', handleClick);
  video.play(); // Can throw if autoplay blocked
} catch (error) {
  console.error('Event attachment failed:', error);
  // Provide fallback or show error state
}
```

### Graceful Degradation
- **Widget should never crash the parent page** - catch all errors internally
- **If video fails to load:** Show poster image or placeholder
- **If controls fail to initialize:** Provide basic browser controls fallback
- **If async loading fails:** Log error but don't block page render
- **Progressive enhancement:** Core functionality (video playback) should work even if custom controls fail

## Best Practices

### Performance Optimization

#### Event Debouncing
```javascript
// ❌ PERFORMANCE ISSUE: Fires on every pixel of mouse movement
videoWrapper.addEventListener('mousemove', handleMousePosition);

// ✅ OPTIMIZED: Debounced to reduce handler calls
let debounceTimer;
videoWrapper.addEventListener('mousemove', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => handleMousePosition(e), 100);
});
```

#### Interval/Timer Cleanup [CRITICAL FIX NEEDED]
```javascript
// ❌ CURRENT BUG: Creates multiple setInterval instances
// progressLoop() called on every 'timeupdate' event (multiple times/second)
function progressLoop() {
  setInterval(function () { // NEW interval created each time!
    progress = Math.round((video.currentTime / video.duration) * 100);
    setPercentage(progress);
  }, 100);
}

// ✅ FIXED: Prevent duplicate intervals
let progressInterval = null;

function progressLoop() {
  // Prevent creating duplicate intervals
  if (progressInterval) return;

  progressInterval = setInterval(function () {
    progress = Math.round((video.currentTime / video.duration) * 100);
    setPercentage(progress);
  }, 100);
}

function stopProgressLoop() {
  clearInterval(progressInterval);
  progressInterval = null;
}

// Clear interval when video pauses/ends
video.addEventListener('pause', stopProgressLoop);
video.addEventListener('ended', stopProgressLoop);
```

#### DOM Query Caching
```javascript
// ✅ Current implementation already follows this pattern
// Cache element references at initialization (don't query repeatedly)
const video = document.getElementById('videoPlayer');
const videoWrapper = document.querySelector('.video-guide__video-wrapper');

// ❌ AVOID: Repeated queries in loops or frequent functions
function updateButton() {
  document.querySelector('.video-guide__btn--play').classList.add('active');
}
```

#### Hardware-Accelerated Animations
```css
/* ✅ CURRENT: Uses transforms (GPU accelerated) */
.video-guide__btn--rewind {
  transform: translateX(-50px);
  transition: transform 0.3s ease-in-out;
}

/* ❌ AVOID: Position changes (CPU heavy, causes reflow) */
.video-guide__btn--rewind {
  left: -50px;
  transition: left 0.3s ease-in-out;
}
```

### jQuery vs Vanilla JavaScript Usage

**Use jQuery For:**
- **DOM manipulation:** `$(element).addClass()`, `$(element).removeClass()`, `$(element).hide()`
- **Animations:** `$(element).fadeIn()`, `$(element).slideToggle()`
- **Multiple element handling:** `$('.buttons').each(function() { ... })`
- **Cross-browser compatibility:** Event normalization, CSS manipulation

**Use Vanilla JavaScript For:**
- **Video API:** `video.play()`, `video.pause()`, `video.currentTime`, `video.duration`
- **Modern DOM methods:** `querySelector`, `classList`, `addEventListener`
- **Performance-critical operations:** Avoid jQuery overhead in high-frequency operations
- **Native browser APIs:** `localStorage`, `fetch`, `Promise`, `setTimeout/setInterval`

**Mixed Example (Current Pattern):**
```javascript
// Video control - vanilla JS (HTMLMediaElement API)
video.currentTime += 10;
video.play();

// UI animation - jQuery (smooth transitions)
$(videoWrapper).fadeIn(300);

// Class manipulation - both work, prefer vanilla for simplicity
video.classList.add('playing'); // Vanilla
$(video).addClass('playing');   // jQuery
```

**Why Keep jQuery 1.9.1:**
- **Legacy compatibility** - project established with jQuery
- **Animation library** - jQuery provides smooth, tested animations
- **Refactoring not justified** - works well for current scope
- **Small footprint** - loaded from CDN, cached across sites

## Accessibility Standards

### WCAG 2.1 Level AA Compliance
- **Target Level:** WCAG 2.1 AA minimum (industry standard for public websites)
- **Color Contrast Requirements:**
  - **4.5:1** for normal text (under 18pt or 14pt bold)
  - **3:1** for large text (18pt+ or 14pt+ bold) and UI components
  - **3:1** for icons and graphical objects

### Current Color Contrast Audit
```css
/* Primary Pink: rgb(255, 40, 110) on white background */
/* Contrast ratio: 3.4:1 ❌ FAILS AA for normal text */
/* Contrast ratio: 3.4:1 ✅ PASSES AA for large text/icons */

/* Light Pink: rgb(255, 180, 200) on white background */
/* Contrast ratio: 1.7:1 ❌ FAILS AA for all text sizes */

/* ⚠️ ACTION REQUIRED: */
/* - Button icons use fill/stroke (visual only, no text) - currently OK */
/* - If adding text labels, ensure contrast meets 4.5:1 or use darker pink */
/* - Test with Chrome DevTools Lighthouse accessibility audit */
```

### Keyboard Navigation Requirements
**All interactive elements must be keyboard accessible:**

- ✅ **Tab order:** Minimize → Volume → Play/Pause → Rewind → Forward
- ✅ **Focus indicators:** `:focus-visible` styles implemented
- ✅ **Key activation:** Enter/Space on buttons (native button behavior)
- ✅ **No focus traps:** Focus can move in and out of widget
- ⚠️ **Test when minimized:** Ensure minimized widget can be restored via keyboard

### Screen Reader Support
```html
<!-- ✅ Current implementation -->
<button title="Minimieren" aria-label="Widget minimieren">
  <svg aria-hidden="true">...</svg>
</button>

<button aria-pressed="false" title="Stummschalten">
  <!-- aria-pressed updates on toggle -->
</button>

<!-- Additional considerations: -->
<!-- - Announce video state changes (playing/paused) via aria-live -->
<!-- - Ensure button titles are descriptive for context -->
<!-- - Test with NVDA (Windows) or VoiceOver (Mac) -->
```

### Testing Checklist
- [ ] **Keyboard navigation:** Tab through all controls, test Enter/Space activation
- [ ] **Focus visibility:** Verify `:focus-visible` styles show clearly on keyboard focus
- [ ] **Screen reader:** Test with NVDA/VoiceOver, verify button labels announced
- [ ] **Color contrast:** Run Lighthouse audit, verify icons/buttons meet 3:1 minimum
- [ ] **Zoom:** Test at 200% zoom (WCAG requirement), verify layout doesn't break
- [ ] **High contrast mode:** Test in Windows High Contrast Mode (buttons should remain visible)

## Testing & Validation

### Browser Testing Requirements
**Test in these browsers before deploying changes:**

| Browser | Versions | Priority | Notes |
|---------|----------|----------|-------|
| Chrome | Latest 2 | ⭐ High | Primary development browser |
| Firefox | Latest 2 | ⭐ High | Strong WebM VP9 support |
| Edge | Latest 2 | ⭐ High | Chromium-based (similar to Chrome) |
| Safari | Latest 2 (macOS + iOS) | 🟡 Medium | MP4 fallback critical, no WebM VP9 alpha |
| Mobile Safari | iOS 14+ | 🟡 Medium | Widget hidden below 576px (verify @media) |

### Video Format Testing
- ✅ **WebM VP9 with alpha channel** - Chrome, Firefox, Edge (primary format)
- ✅ **MP4 fallback** - Safari, older browsers (H.264 codec)
- ⚡ **Test fallback activation:** Open in Safari, verify MP4 loads
- ⚠️ **Test error state:** Remove video sources, verify error handler shows fallback

### Responsive Testing Viewports
- **Desktop:** 1920x1080, 1366x768 (most common)
- **Tablet:** 768x1024 (iPad), 1024x768 (landscape)
- **Mobile:** 375x667 (iPhone), 360x640 (Android)
- **Below 576px:** Widget should be hidden (`display: none` via @media query)

### Interaction Testing Checklist
After ANY code change, verify these core interactions:

- [ ] **Play/Pause:** Click play icon → video plays, progress ring animates
- [ ] **Minimize:** Click minimize button → widget collapses to small circle
- [ ] **Volume toggle:** Click speaker → mutes/unmutes, aria-pressed updates
- [ ] **Rewind:** Hover left half while playing → rewind button appears, click → -10s
- [ ] **Forward:** Hover right half while playing → forward button appears, click → +10s
- [ ] **Progress ring:** Play video → ring fills 0-100% smoothly (no gaps)
- [ ] **Keyboard navigation:** Tab through buttons, Enter/Space activates
- [ ] **Button states:** Hover → pink background, focus-visible → pink outline
- [ ] **Conditional display:** Pause video → rewind/forward buttons hide
- [ ] **Video end:** Play to end → video ends, buttons hide, ring completes

### Console Error Checking
- **Open DevTools Console (F12)** before testing
- **No red errors** should appear during normal interaction
- **Warnings acceptable:** CORS warnings from CDN, deprecation notices
- **Critical errors to investigate:**
  - `Uncaught TypeError` (function/property doesn't exist)
  - `Uncaught ReferenceError` (variable not defined)
  - `Failed to load resource` (video/script/css not found)

### Visual Regression Checklist
Compare before/after for:
- Button sizes and positions (minimize, volume, play/pause)
- Progress ring thickness and color
- Viewport circle size and border
- Z-index layering (progress behind viewport, controls on top)
- Transition smoothness (no jank or flashing)

### After Each Code Change Protocol
1. ✅ **Save file** and refresh page in browser
2. ✅ **Check console** for errors (F12)
3. ✅ **Test main use case** (play/pause, volume, minimize)
4. ✅ **Test keyboard nav** if you changed focus styles
5. ✅ **Test responsive** if you changed layout/sizing
6. ✅ **Verify no visual regressions** (compare screenshots if major change)

## Technology Stack
- jQuery 1.9.1 (DOM manipulation, animations)
- Vanilla JavaScript (Video API, modern features)
- CSS3 (transforms, transitions, flexbox)
- WebM VP9 with alpha channel + MP4 fallback

## Accessibility Priority
- Maintain keyboard navigation support (focus-visible)
- Keep aria attributes updated (aria-pressed, aria-hidden)
- Ensure color contrast meets WCAG standards
- Provide button titles for tooltips

## Performance Notes
- Avoid creating new setInterval in progressLoop() on every timeupdate
- Use CSS transforms instead of position changes for animations
- Leverage hardware acceleration with `transform: translateX()`
- Keep z-index values minimal and sequential

## Browser Support
- Modern browsers with CSS3 transform support
- ES6 features (arrow functions, const/let, template literals)
- jQuery 1.9.1 for legacy compatibility
- WebM VP9 with MP4 fallback for alpha channel video

## Known Issues & Solutions

### Issue 1: Multiple setInterval Instances [HIGH PRIORITY]
**Problem:** `progressLoop()` called on every `timeupdate` event creates multiple intervals
**Location:** `video-guide.js` line ~89
**Impact:** Performance degradation, multiple progress updates running simultaneously
**Solution:** See "Performance Optimization → Interval/Timer Cleanup" section above
**Status:** ⚠️ TODO - Needs implementation

### Issue 2: Debug Yellow Background
**Problem:** Controls have temporary debug background `rgba(255, 217, 0, 0.5)`
**Location:** `video-guide.css` - `.video-guide__controls` selector
**Impact:** Visual only, shows overlay boundaries
**Solution:** Remove `background: rgba(255, 217, 0, 0.5);` or set to `transparent`
**Status:** ⚠️ TODO - Remove before production

### Issue 3: Experimental Orb Code
**Problem:** Commented-out experimental orb containers in widget.html
**Location:** `widget.html` - HTML comments with test markup
**Impact:** Code cleanliness, unused markup in production
**Solution:** Remove experimental code or move to separate development branch
**Status:** 🟡 Low priority - doesn't affect functionality

### Issue 4: jQuery Dependency Size
**Problem:** jQuery 1.9.1 loaded from CDN (93KB minified)
**Impact:** Small initial load penalty (mitigated by CDN caching)
**Future Consideration:** Could replace jQuery with vanilla JS (save ~90KB)
**Status:** Not urgent - CDN cached, browser compatibility benefit outweighs cost

### Issue 5: Missing Video Loading State
**Problem:** No visual indicator while video loads
**Impact:** Brief blank period before video ready
**Enhancement:** Add loading spinner or skeleton screen during `loadstart` event
**Status:** Future enhancement

### Issue 6: Mobile Optimization
**Problem:** Widget hidden below 576px (`@media(max-width: 576px) { display: none }`)
**Question:** Should mobile users see widget at all? Alternative: always-visible controls?
**Status:** Design decision needed

## When to Deviate from These Rules

Rules are guidelines for consistency and quality, not absolute laws. You may deviate when:

### 1. Performance Critical
Optimization may require less readable code or breaking style patterns.
- **Example:** Inline styles for 60fps animation instead of class toggle
- **Example:** Avoiding jQuery in high-frequency mousemove handlers
- **Requirement:** Add comment explaining performance justification
```javascript
// PERFORMANCE: Inline transform for 60fps animation (avoids reflow)
element.style.transform = `translateX(${x}px)`;
```

### 2. Third-Party Constraints
External libraries or frameworks impose their own patterns.
- **Example:** jQuery plugin requires specific HTML structure
- **Example:** Video.js library requires non-BEM class names
- **Requirement:** Document why pattern diverges from project standards

### 3. Browser Compatibility
Modern API not supported in target browsers.
- **Example:** Using jQuery `.on()` instead of `addEventListener` for IE11 support
- **Example:** CSS fallbacks for unsupported properties
- **Requirement:** Add browser compatibility comment
```css
/* FALLBACK: Flexbox not supported in IE9 */
display: inline-block; /* Fallback */
display: flex; /* Modern browsers */
```

### 4. Legacy Code Consistency
Maintaining consistency with existing codebase patterns.
- **Example:** Project uses jQuery 1.9.1, don't force vanilla JS rewrite mid-project
- **Example:** Existing code uses var, mixing const/let creates inconsistency
- **Requirement:** Match surrounding code style unless refactoring entire file

### 5. Technical Debt Trade-offs
Accepting short-term imperfection for long-term benefit.
- **Example:** Quick fix using !important to unblock deployment, refactor later
- **Example:** Duplicate code temporarily to avoid risky refactor before deadline
- **Requirement:** Document technical debt with TODO comment
```css
/* TODO: Remove !important after refactoring specificity in global styles */
.video-guide__btn {
  z-index: 3 !important;
}
```

### If You Must Deviate:
1. ✅ **Add explanatory comment** in code explaining why
2. ✅ **Document technical debt** with `TODO:` or `FIXME:` tag
3. ✅ **Get user approval** for significant deviations from architecture
4. ✅ **Keep deviation localized** - don't let exception become new pattern
5. ✅ **Plan remediation** - note when/how to fix properly later

### Never Deviate On:
- ❌ Security standards (XSS prevention, input validation)
- ❌ Accessibility requirements (keyboard nav, WCAG contrast)
- ❌ Anti-hallucination rules (don't invent APIs even if convenient)
- ❌ Error handling for critical paths (video loading, event listeners)

## Future Considerations

### Potential Enhancements
- **Internationalization (i18n):** Extract German button titles to language constants
- **Theming support:** Convert hardcoded colors to CSS custom properties
- **Multiple video support:** Allow widget to switch between video sources
- **Analytics integration:** Track play events, engagement metrics
- **Closed captions:** Support WebVTT subtitle files
- **Playback speed control:** 0.5x, 1x, 1.5x, 2x options
- **Fullscreen mode:** Expand video to fullscreen on button click
- **Picture-in-picture:** Browser PiP API integration (already disabled via `disablepictureinpicture`)
- **Playlist support:** Multiple videos in sequence
- **Thumbnail scrubbing:** Show preview on progress ring hover

### Architecture Improvements
- **Remove jQuery dependency:** Migrate to vanilla JS (save ~90KB)
- **ES modules:** Convert to module pattern for better encapsulation
- **Web Components:** Refactor as custom element `<video-guide-widget>`
- **CSS custom properties:** Replace hardcoded colors with variables
- **Build process:** Add minification, bundling for production

### Code Quality
- **Unit tests:** Add Jest tests for core functions (setPercentage, handleMousePosition)
- **Integration tests:** Playwright/Cypress for full interaction testing
- **Linting:** ESLint + Stylelint with project-specific rules
- **TypeScript:** Add type safety for better IDE support and error catching

## File Relationships
- `widget.html` → loaded by `widget-loader.js`
- `widget-loader.js` → dispatches 'videoGuideWidgetLoaded'
- `video-guide.js` → listens for event, then initializes
- `video-guide.css` → styles entire component

When suggesting code, follow these patterns and maintain consistency with the existing codebase.
