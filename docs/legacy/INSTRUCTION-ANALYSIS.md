> **Archived 2026-05-10** — meta-analysis of the original Copilot instructions, retained as historical context for the migration to Claude Code. The active AI configuration is [/CLAUDE.md](../../CLAUDE.md) and [/docs/](../).

---

# Copilot Instructions Enhancement Analysis
**Project:** Video Guide Widget v1.6  
**Date:** March 11, 2026  
**Model:** Claude Sonnet 4.6 (optimized for this project)

---

## Executive Summary

Enhanced Copilot instructions from 382 lines to 800+ lines by incorporating critical security standards, error handling patterns, and comprehensive testing guidance missing from the original. All Priority 1 (Critical) and Priority 2 (High) enhancements implemented based on analysis of wordpress-dev-boilerplate reference and project-specific code patterns.

**Key Improvements:**
- Added anti-hallucination safeguards to prevent AI from inventing APIs
- Implemented comprehensive security standards (XSS prevention, input validation)
- Expanded error handling patterns for video loading, promises, event listeners
- Clarified jQuery vs vanilla JavaScript usage patterns with examples
- Fixed critical interval cleanup bug documentation with solution
- Enhanced accessibility standards to WCAG 2.1 AA specifics
- Added complete browser testing and validation protocols

---

## New Sections Added

### 1. AI Model Configuration (NEW - Lines 1-9)
**Purpose:** Explicitly specify Claude Sonnet 4.6 as preferred model  
**Rationale:** Project complexity benefits from Claude 4.6's advanced reasoning  
**Content:**
- Model preference declaration
- Justification (async loading patterns, pointer-events architecture, BEM enforcement)
- Instructs using this model when available

**Why Critical:**
- Ensures consistent AI behavior across sessions
- Claude 4.6 specifically requested by user
- Provides context for why this model chosen

---

### 2. Anti-Hallucination Rules (NEW - Lines 56-74)
**Priority:** 🔴 Critical (P1)  
**Purpose:** Prevent AI from inventing non-existent APIs, methods, or features  
**Rationale:** Single most important safeguard against incorrect code suggestions

**Content:**
- Explicit "do not invent" rules
- Requirement to verify APIs against MDN, jQuery docs, or existing code
- Concrete examples of what NOT to do:
  - ❌ `video.seekBy()` method (doesn't exist in HTMLMediaElement)
  - ❌ Fictional jQuery methods
  - ❌ Non-existent CSS properties
  - ❌ Invented event names
- Mandate to reference actual documentation URLs

**Why Critical:**
- Original instructions lacked this fundamental safeguard
- High risk of suggesting broken code without explicit prohibition
- Reference file (01-global-rules.md) identified this as essential
- Project uses jQuery 1.9.1 and vanilla JS mix - easy to confuse API boundaries

**Impact:** Prevents hours of debugging from following non-existent API suggestions

---

### 3. Enhanced Communication Standards (UPDATED - Lines 76-85)
**Priority:** 🟡 High (P2)  
**Added:**
- **"No redundancy"** rule - don't repeat user's prompt or restate question
- **Language consistency** rules:
  - English for all code (variables, functions, comments)
  - German UI text acceptable (Minimieren, Stummschalten, etc.)
  - Switch to German responses only if user writes in German

**Why Important:**
- Original lacked language guidance despite German UI labels
- Redundancy prevention improves communication efficiency
- Clarifies when German vs English appropriate

---

### 4. Security Standards (NEW - Lines 360-425)
**Priority:** 🔴 Critical (P1)  
**Purpose:** Comprehensive security guidance for user-facing widget  
**Rationale:** Original instructions had ZERO security content - major gap

**Subsections:**
1. **Input Validation & Sanitization**
   - Sanitize user input before DOM manipulation
   - Escape HTML entities to prevent XSS
   - Validate URL schemes (HTTPS only)
   - Future-proofing for dynamic video loading

2. **XSS Prevention**
   - Never use `innerHTML` with unsanitized input
   - Safe alternatives: `textContent`, `createElement()`
   - Current usage audit: SVG icons use innerHTML (safe - hardcoded)
   - Recommend DOMPurify if accepting external content

3. **External Resources Security**
   - Always HTTPS for videos, scripts, stylesheets
   - Current CDN audit: jQuery loaded via HTTPS ✅
   - CORS policy guidance
   - Supply chain attack awareness

4. **Data Loss Prevention**
   - ⚠️ WARNING protocol for destructive actions
   - Require explicit user confirmation
   - Suggest backups before major refactors

5. **Secure Coding Patterns**
   - Code examples showing unsafe vs safe patterns
   - Concrete XSS vulnerability examples
   - URL validation patterns

**Why Critical:**
- Widget embeds in external pages (attack surface)
- Future may accept dynamic video URLs (user input)
- XSS vulnerabilities can compromise entire parent page
- Industry standard to have security section in coding guidelines

**Impact:** Prevents security vulnerabilities from being introduced

---

### 5. Error Handling Standards (NEW - Lines 427-495)
**Priority:** 🔴 Critical (P1)  
**Purpose:** Robust error handling for production-ready widget  
**Rationale:** Original only mentioned "handle errors" once with no patterns

**Subsections:**
1. **Video Loading Errors**
   - Complete error event handler with error codes
   - User-friendly fallback display
   - Network/format/CORS error handling

2. **Promise Rejection Handling**
   - Pattern for future async features (fetch, async/await)
   - Unsafe vs safe examples
   - Graceful degradation on failure

3. **Event Listener Error Handling**
   - try/catch for risky operations
   - `video.play()` can throw if autoplay blocked
   - Fallback when attachment fails

4. **Graceful Degradation**
   - Widget should never crash parent page
   - Fallback strategies for each component
   - Progressive enhancement philosophy

**Why Critical:**
- Video loading can fail (network, format, CORS)
- Autoplay may be blocked by browser
- Widget must not break parent page
- Professional error handling expected in production code

**Code Examples:** 3 complete patterns with unsafe vs safe comparisons

---

### 6. Best Practices Section (NEW - Lines 497-597)
**Priority:** 🔴 + 🟡 (P1 + P2)  
**Purpose:** Consolidate performance, jQuery usage, and optimization patterns

**Subsections:**

#### 6a. Performance Optimization (P1 - CRITICAL FIX)
**Event Debouncing:**
- Pattern to reduce mousemove handler calls
- Unsafe: fires every pixel, Safe: debounced 100ms
- Performance impact explanation

**Interval/Timer Cleanup [ADDRESSES KNOWN BUG]:**
- ❌ CURRENT BUG: `progressLoop()` creates multiple setInterval instances
- Located in video-guide.js line ~89
- Complete fixed code with interval tracking
- Event listeners to clear on pause/end
- **This bug documented in original "Known Issues" but no solution provided**

**DOM Query Caching:**
- Validates current implementation (already followed ✅)
- Shows bad pattern (repeated queries in loops)

**Hardware-Accelerated Animations:**
- Current uses transforms ✅
- Avoid position changes (causes reflow)

**Why Critical:**
- Interval cleanup bug causes performance degradation
- Multiple timers running = CPU waste + battery drain
- Provides complete solution, not just problem statement

#### 6b. jQuery vs Vanilla JavaScript Usage (P1)
**Purpose:** Clear guidance on when to use each approach  
**Rationale:** Original said "mix appropriately" but gave no criteria

**Content:**
- **Use jQuery For:** DOM manipulation, animations, multi-element, cross-browser
- **Use Vanilla For:** Video API, modern DOM, performance-critical, native APIs
- **Mixed Example:** Video control (vanilla) + UI animation (jQuery)
- **Why Keep jQuery 1.9.1:** Legacy compatibility, animation library, refactor not justified

**Why Critical:**
- Prevents confusion about mixing two paradigms
- Justifies jQuery dependency (not legacy cruft)
- Guides future code consistency

**Impact:** Developers know when to use which approach without guessing

---

### 7. Accessibility Standards (ENHANCED - Lines 599-659)
**Priority:** 🟡 High (P2)  
**Original:** Brief mention of WCAG, aria attributes, keyboard nav  
**Enhanced:** Complete WCAG 2.1 AA compliance guide with specifics

**Additions:**
1. **WCAG 2.1 Level AA Compliance**
   - Explicit target level (AA = industry standard)
   - Contrast ratios: 4.5:1 for text, 3:1 for icons
   - Practical numbers, not abstract terms

2. **Current Color Contrast Audit**
   - Primary pink on white: 3.4:1 ❌ FAILS for text, ✅ PASSES for icons
   - Light pink on white: 1.7:1 ❌ FAILS all
   - ⚠️ ACTION REQUIRED: Test with Lighthouse
   - Concrete failing colors with RGB values

3. **Keyboard Navigation Requirements**
   - Tab order explicitly stated
   - Focus indicator implementation verified
   - Key activation (Enter/Space)
   - No focus traps
   - Test minimized state restoration

4. **Screen Reader Support**
   - Code examples with aria-label, aria-pressed, aria-hidden
   - Additional considerations (aria-live for state changes)
   - Testing tools: NVDA (Windows), VoiceOver (Mac)

5. **Testing Checklist**
   - 6-item checklist for accessibility validation
   - Tab navigation, focus visibility, screen reader, contrast, zoom, high contrast mode
   - Actionable steps for each

**Why Important:**
- Original lacked specifics (contrast ratios, WCAG level, test procedures)
- Identifies actual failing colors with measurements
- Provides testing tools and checklist
- Legal requirement for many jurisdictions (ADA, Section 508)

**Impact:** Ensures widget meets accessibility standards, avoids legal risk

---

### 8. Testing & Validation (NEW - Lines 661-762)
**Priority:** 🟡 High (P2)  
**Purpose:** Complete testing protocol before deployment  
**Rationale:** Original had no testing guidance

**Subsections:**

1. **Browser Testing Requirements**
   - Table format: Browser | Versions | Priority | Notes
   - Chrome, Firefox, Edge (High), Safari (Medium), Mobile Safari (Medium)
   - Specific version targets (latest 2 for each)
   - Priority levels guide testing order

2. **Video Format Testing**
   - WebM VP9 alpha (Chrome/Firefox/Edge primary)
   - MP4 fallback (Safari critical)
   - Test fallback activation in Safari
   - Test error state (no video sources)

3. **Responsive Testing Viewports**
   - Desktop: 1920x1080, 1366x768
   - Tablet: 768x1024, 1024x768
   - Mobile: 375x667, 360x640
   - Below 576px: Widget hidden (verify @media)

4. **Interaction Testing Checklist**
   - 10-item checklist covering all interactions
   - Play/pause, minimize, volume, rewind/forward
   - Progress ring, keyboard nav, button states
   - Conditional display (pause hides buttons)
   - Video end behavior

5. **Console Error Checking**
   - Open DevTools Console (F12) before testing
   - No red errors in normal interaction
   - Warnings acceptable (CORS, deprecations)
   - Critical errors to investigate

6. **Visual Regression Checklist**
   - Compare before/after screenshots
   - Button sizes, progress ring, viewport, z-index
   - Transition smoothness

7. **After Each Code Change Protocol**
   - 6-step verification workflow
   - Save → Check console → Test main → Test keyboard → Test responsive → Verify no regression

**Why Important:**
- Prevents shipping broken code
- Clear testing order and criteria
- Reduces manual testing time through checklist
- Professional QA standard

**Impact:** Catches bugs before deployment, ensures quality

---

### 9. Enhanced Known Issues & Solutions (UPDATED - Lines 787-831)
**Priority:** 🟡 High (P2)  
**Original:** List of 5 issues, no solutions  
**Enhanced:** 6 documented issues with complete details

**Format for Each Issue:**
- **Problem:** Clear description
- **Location:** File and line number
- **Impact:** What it affects
- **Solution:** Concrete fix or reference to section with solution
- **Status:** Priority indicator (⚠️ TODO, 🟡 Low priority)

**Issues Documented:**
1. Multiple setInterval instances [HIGH PRIORITY] - Solution in Performance section
2. Debug yellow background - Remove before production
3. Experimental orb code - Code cleanliness
4. jQuery dependency size - Future consideration (not urgent)
5. Missing video loading state - Enhancement
6. Mobile optimization - Design decision needed

**Improvement Over Original:**
- Original: "Fix progressLoop() multiple setInterval creation" (no solution)
- Enhanced: Cross-references complete solution in Performance section
- Original: "Remove debug yellow background" (vague)
- Enhanced: Exact CSS selector and property to change

**Why Important:**
- Converts documentation into action items
- Solutions prevent "known issue" from becoming permanent
- Status indicators guide prioritization

---

### 10. When to Deviate from Rules (NEW - Lines 833-915)
**Priority:** 🟢 Nice-to-Have (P3)  
**Purpose:** Provide flexibility framework for edge cases  
**Rationale:** Rigid rules can hinder problem-solving in unusual situations

**When Deviations Allowed:**
1. **Performance Critical** - Optimization over readability
2. **Third-Party Constraints** - External library patterns
3. **Browser Compatibility** - Modern API not supported
4. **Legacy Code Consistency** - Match existing patterns
5. **Technical Debt Trade-offs** - Short-term fix for long-term benefit

**Each Category Includes:**
- Explanation of when it applies
- Concrete examples
- Required documentation (comments explaining why)

**If You Must Deviate:**
- 5-step checklist (add comment, document debt, get approval, keep localized, plan remediation)

**Never Deviate On:**
- Security standards
- Accessibility requirements
- Anti-hallucination rules
- Critical path error handling

**Why Valuable:**
- Acknowledges real-world constraints
- Prevents "I can't help because rules" roadblocks
- Requires justification and documentation
- Protects critical standards from exceptions

---

### 11. Enhanced Future Considerations (UPDATED - Lines 917-948)
**Priority:** 🟢 Nice-to-Have (P3)  
**Original:** 5 bullet points mixing bugs and features  
**Enhanced:** Organized into 3 categories

**Categories:**
1. **Potential Enhancements** (10 items)
   - Internationalization, theming, multiple videos
   - Analytics, closed captions, playback speed
   - Fullscreen, PiP, playlist, thumbnail scrubbing

2. **Architecture Improvements** (5 items)
   - Remove jQuery dependency
   - ES modules, Web Components
   - CSS custom properties, build process

3. **Code Quality** (4 items)
   - Unit tests (Jest)
   - Integration tests (Playwright/Cypress)
   - Linting (ESLint + Stylelint)
   - TypeScript for type safety

**Improvement Over Original:**
- Original mixed bugs ("fix progressLoop") with features ("add loading state")
- Enhanced separates bugs (moved to Known Issues) from future enhancements
- Organized by category for easier planning
- More comprehensive vision for project evolution

---

## Sections Preserved from Original

### Maintained Without Changes:
1. **Development Certainty Levels** - Excellent [Verified]/[Best Practice]/[Inference] labeling system
2. **Task Execution Standards** - "Only do requested task", "be self-skeptical", "ask if unclear"
3. **Project Context** - Core files, legacy files list, project purpose
4. **Architecture** - HTML structure (sibling layout), z-index layers, pointer-events pattern
5. **Code Style** - BEM methodology, naming conventions, HTML/CSS/JS standards
6. **Color Scheme** - Exact RGB values for primary/light pink
7. **CSS Patterns** - Button states, SVG styling, transitions, pointer-events pattern
8. **JavaScript Patterns** - Element references, conditional features, state management
9. **Documentation Standards** - File headers, function headers, section markers
10. **Critical Rules** - ALWAYS/NEVER lists

**Why Preserved:**
- These sections were already excellent in original
- Detailed, specific, actionable guidance
- Project-specific patterns well-documented
- BEM enforcement particularly strong
- Z-index and pointer-events architecture clearly explained

---

## Comparison: Original vs Enhanced

| Aspect | Original (382 lines) | Enhanced (800+ lines) |
|--------|---------------------|---------------------|
| **Model Specification** | None | ✅ Claude Sonnet 4.6 explicit |
| **Anti-Hallucination** | None | ✅ Comprehensive rules with examples |
| **Security Standards** | ❌ Zero content | ✅ XSS, validation, HTTPS, data loss prevention |
| **Error Handling** | 1 mention, no patterns | ✅ Video, promise, event listener patterns |
| **jQuery vs Vanilla** | "Mix appropriately" | ✅ Clear criteria with examples |
| **Interval Bug Solution** | Documented but no fix | ✅ Complete solution code |
| **Performance** | Brief notes | ✅ Debounce, cleanup, caching, animation patterns |
| **Accessibility** | Brief mention | ✅ WCAG 2.1 AA specifics, contrast audit, testing |
| **Testing Protocols** | None | ✅ Browser matrix, viewport list, checklist, regression |
| **Known Issues** | List only | ✅ Problem/Location/Impact/Solution/Status |
| **Deviation Framework** | None | ✅ When/how to break rules with safeguards |
| **Future Enhancements** | Mixed with bugs | ✅ Organized by category (enhancements/architecture/quality) |

---

## Gap Analysis: Referenced vs Implemented

### From wordpress-dev-boilerplate Analysis:

#### ✅ Fully Implemented (P1 Critical):
1. ✅ Anti-hallucination rules with concrete examples
2. ✅ Security standards (XSS, input validation, HTTPS, data loss)
3. ✅ Error handling patterns (video, promises, event listeners)
4. ✅ jQuery vs vanilla JS clarity with use case guidance
5. ✅ Interval cleanup pattern fixing known bug
6. ✅ Performance best practices (debounce, cleanup, caching, animations)
7. ✅ Language consistency rules (English code, German UI acceptable)
8. ✅ Redundancy prevention in communication

#### ✅ Fully Implemented (P2 High):
9. ✅ Accessibility expansion (WCAG 2.1 AA specifics, contrast ratios, testing checklist)
10. ✅ Testing standards (browser matrix, viewports, interaction checklist, console checking)
11. ✅ Enhanced known issues with solutions
12. ✅ Deviation framework ("When to Deviate from Rules")

#### ✅ Fully Implemented (P3 Nice-to-Have):
13. ✅ Future considerations reorganized and expanded

### Comparison to Boilerplate Split Structure:

**Boilerplate has 3 files:**
- `01-global-rules.md` - Generic AI behavior standards (reusable)
- `02-project-specific.md` - Project architecture and patterns (customizable)
- `03-git-workflow.md` - Git initialization, branching, commits (reusable)

**Decision: Single File for test-avatar-v1.6**
- ✅ Current 800+ line file well-organized and project-focused
- ✅ No multi-project reusability need (not building more widgets)
- ✅ Easier to maintain single comprehensive file
- ✅ No git workflow needed (user confirmed no git setup)
- ❌ Splitting would add complexity without benefit

**What We Adopted from Boilerplate:**
- Anti-hallucination rules (from 01-global-rules.md)
- Security standards (from 01-global-rules.md)
- Error handling patterns (from 01-global-rules.md)
- Performance best practices (from 01-global-rules.md)
- Testing standards (adapted from boilerplate approach)
- Deviation framework concept (from 01-global-rules.md)

**What We Kept Project-Specific:**
- All existing architecture documentation (sibling layout, z-index, pointer-events)
- BEM methodology enforcement (already strong in original)
- Color scheme with exact RGB values
- Button state patterns
- jQuery + vanilla JS mix (justified for this project)
- Video widget specific patterns (progress ring, conditional buttons)

---

## Missing Instructions: Not Implemented

### Deliberately Excluded:

1. **Git Workflow** - User confirmed no git setup needed for this project
   - No .gitignore creation
   - No branch strategy (main/develop)
   - No commit message conventions
   - Git disabled in workspace settings

2. **Build Process Instructions** - Project has no build tools
   - No Sass compilation (pure CSS)
   - No bundlers (Webpack, Rollup)
   - No transpilers (Babel)
   - No package.json or npm scripts

3. **Multi-Environment Setup** - No staging/production duality
   - Single development environment
   - No environment-specific configs
   - No deployment pipeline documentation

4. **PHP/WordPress Specifics** - Not applicable to pure frontend widget
   - No server-side logic
   - No WordPress integration (even though demos use Divi)
   - No database considerations

### Could Be Added Later (Not Critical Now):

1. **Internationalization (i18n) Pattern** - Currently German UI labels hardcoded
   - Extract to constants object
   - Support language switching
   - Listed in Future Considerations

2. **Typography Standards** - No font specifications in instructions
   - No font-family guidelines
   - No font-size hierarchy
   - Less critical for widget (inherits from parent page)

3. **Animation Timing Standards** - Only brief mention
   - 0.3s ease-in-out for buttons
   - 0.4s ease-in-out for minimize
   - Could document cubic-bezier curves for advanced animations

4. **Naming Convention Examples** - BEM enforced but limited examples
   - Could show more state class patterns
   - Could document JavaScript naming conventions in detail
   - Current examples sufficient for now

5. **Code Review Checklist** - Testing checklist exists but no formal review process
   - Pull request guidelines (not applicable without git)
   - Peer review criteria
   - Sign-off process

6. **Deployment Instructions** - How to deploy updates to production
   - File upload process
   - Cache invalidation
   - Rollback procedure
   - User can add when deployment plan solidified

---

## Recommendations for User

### Immediate Actions:
1. ✅ **Open workspace file** - `test-avatar-v1.6.code-workspace` in VS Code
2. ✅ **Verify isolation** - Only test-avatar-v1.6 folder visible in explorer
3. ✅ **Test Copilot** - Ask about security best practices or error handling to verify new instructions recognized
4. ⚠️ **Implement interval fix** - Priority 1: Fix progressLoop() bug using solution in Performance section
5. ⚠️ **Remove debug background** - Priority 2: Remove yellow controls background before production

### Next Steps:
6. 🟡 **Run accessibility audit** - Chrome DevTools Lighthouse → Accessibility score
7. 🟡 **Test color contrast** - Use contrast checker for pink colors against white
8. 🟡 **Browser testing** - Follow testing matrix (Chrome, Firefox, Edge, Safari)
9. 🟢 **Consider enhancements** - Review Future Considerations section for roadmap

### Long-Term Considerations:
10. 📋 **Track technical debt** - Create issue tracker for Known Issues
11. 📋 **Plan accessibility fixes** - If contrast fails, darken pink colors
12. 📋 **Evaluate jQuery removal** - If performance becomes concern (currently fine)

---

## Instruction File Statistics

### Before Enhancement:
- **File:** `.github/copilot-instructions.md`
- **Lines:** 382
- **Sections:** 16 major sections
- **Word Count:** ~2,500 words
- **Critical Gaps:** Security, error handling, testing, anti-hallucination

### After Enhancement:
- **File:** `.github/copilot-instructions.md`
- **Lines:** 800+ (doubled)
- **Sections:** 21 major sections (5 new, 5 enhanced, 11 preserved)
- **Word Count:** ~5,500 words
- **Coverage:** All critical gaps addressed

### Section Breakdown:
- **New Sections:** 5 (Model Config, Anti-Hallucination, Security, Error Handling, Testing)
- **Enhanced Sections:** 6 (Communication, Best Practices, Accessibility, Known Issues, Deviation, Future)
- **Preserved Sections:** 10 (Accuracy, Task Execution, Project Context, Architecture, Code Style, etc.)

---

## Quality Assurance

### Validation Performed:
- ✅ All Priority 1 (Critical) gaps addressed
- ✅ All Priority 2 (High) gaps addressed
- ✅ All Priority 3 (Nice-to-Have) gaps addressed
- ✅ No redundancy with existing content
- ✅ Consistent formatting and structure
- ✅ Code examples use project patterns
- ✅ Cross-references between sections work
- ✅ Markdown formatting clean
- ✅ No contradictions with existing rules
- ✅ Actionable guidance (not vague)

### Copilot Instruction Best Practices Applied:
- ✅ Explicit "do not" rules where needed
- ✅ Concrete code examples (not abstract)
- ✅ Why explanations for critical rules
- ✅ Priority indicators (🔴 🟡 🟢)
- ✅ Checklists for multi-step processes
- ✅ Cross-references to related sections
- ✅ Progressive detail (summary → details → examples)
- ✅ Consistent terminology throughout

---

## Conclusion

The enhanced Copilot instructions transform a strong architecture-focused document into a comprehensive development guide covering:

1. **Security** - XSS prevention, input validation, HTTPS enforcement
2. **Error Handling** - Video loading, promises, graceful degradation
3. **Quality Assurance** - Browser testing matrix, interaction checklist, regression testing
4. **Accessibility** - WCAG 2.1 AA compliance with specific contrast requirements
5. **Performance** - Debouncing, interval cleanup, hardware acceleration
6. **Flexibility** - Deviation framework for edge cases while protecting critical standards

The instructions now provide:
- **Preventive Guidance** - Anti-hallucination rules prevent bad suggestions
- **Corrective Guidance** - Error handling ensures robustness
- **Quality Guidance** - Testing protocols ensure standards met
- **Aspirational Guidance** - Future considerations guide evolution

**Original Strengths Preserved:**
- Exceptional architecture documentation (sibling layout, z-index, pointer-events)
- Strong BEM methodology enforcement
- Detailed code style patterns
- Project-specific context and file relationships

**New Strengths Added:**
- Production-ready security and error handling
- Professional testing and validation protocols
- Accessibility compliance specifics
- AI behavior safeguards (anti-hallucination)

The result is a production-ready instruction set that guides development while preventing common pitfalls, maintaining code quality, and ensuring the widget is secure, accessible, and performant.

---

**Last Updated:** March 11, 2026  
**Status:** Complete - All P1, P2, P3 enhancements implemented  
**Next Review:** After implementing interval cleanup fix and accessibility audit
