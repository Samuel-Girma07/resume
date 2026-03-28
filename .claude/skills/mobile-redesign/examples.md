# Mobile Redesign Skill - Example Workflows

## Example 1: Full Navigation Redesign

```
User: The mobile navigation feels cluttered. The "More" button is unnecessary.
      I want to redesign the mobile nav while keeping desktop untouched.

Claude: I'll use the mobile-redesign skill to analyze and propose solutions.

## Phase 1: Understanding

Let me first audit the current implementation...

[Reads style.css, script.js, index.html]

### Current Implementation Map

**Desktop Navigation:**
- Horizontal nav bar with 4 links
- Sliding gold indicator on hover
- Position: sticky, top of main content
- All links visible at all times

**Mobile Navigation (current):**
- Fixed top bar spanning full width
- 3 visible links: About, Projects, Contact
- Resume hidden behind "More" dropdown
- Dropdown requires extra tap to access

**Issues Identified:**
1. "More" dropdown adds visual clutter
2. Resume hidden requires 2 taps
3. Top bar takes permanent screen space
4. Dropdown feel like forced desktop pattern

**Desktop Dependencies:**
- .navbar structure is shared
- .nav-links is shared
- .nav-indicator is shared
- Desktop uses hover effects (not applicable to mobile)

---

## Phase 3: Approach Comparison

I'll propose 3 distinct approaches:

### Approach 1: Compact Visible Nav (Minimal)

All 4 links visible in compact horizontal bar.

**Changes:**
- CSS only (no HTML changes)
- Reduce padding and font-size
- Remove "More" dropdown entirely
- All links visible in flex row

**Pros:** Simple, fast, low risk
**Cons:** Still takes header space, may feel cramped on < 360px

**Desktop Safety:** All changes in @media (max-width: 768px)

---

### Approach 2: Hamburger with Full-Screen Overlay

Remove top nav, hamburger opens full-screen menu.

**Changes:**
- CSS: Hide .navbar on mobile
- CSS: New overlay component
- JS: Overlay toggle logic
- HTML: Minimal overlay structure

**Pros:** Maximum content space, familiar pattern, large touch targets
**Cons:** 2 taps to navigate, new overlay structure

**Desktop Safety:** Overlay hidden on desktop via display:none

---

### Approach 3: Bottom Navigation Bar

Fixed bottom nav with icons and labels.

**Changes:**
- HTML: New nav-bottom structure
- CSS: Bottom positioning with safe-area-inset
- CSS: Icon + label styling
- JS: Active state handling

**Pros:** Industry standard, thumb-friendly, all visible
**Cons:** Most disruptive, takes bottom space

**Desktop Safety:** Bottom nav hidden on desktop

---

## Comparison Matrix

| Criterion | Approach 1 | Approach 2 | Approach 3 |
|-----------|------------|------------|------------|
| Desktop Safety | High | High | High |
| Risk | Low | Medium | High |
| Mobile UX | 4/5 | 4/5 | 5/5 |
| Code Isolation | Breakpoint-only | Mobile HTML | Mobile HTML |

**Note:** Approach 1 recommended for this project due to minimal risk and CSS-only implementation.

---

## Recommendation

**Approach 1: Compact Visible Nav (Minimal)**

Rationale: Lowest implementation risk with excellent desktop safety.
CSS-only changes, all contained within mobile breakpoint.
Removes "More" dropdown without adding new components.

Would you like me to proceed with Phase 4 implementation?
```

---

## Example 2: Animation Performance Fix

```
User: The page transitions feel slow and jittery on mobile. Fix them.

Claude: I'll use the mobile-redesign skill to analyze and optimize animations.

## Phase 1: Understanding

[Reads style.css animation keyframes]

### Current Animation State

**Desktop Animations:**
- pageEnterUp: 720ms with blur(8px), rotateX(4deg), scale
- pageEnterDown: 720ms with similar effects
- Child staggers: 0.08s - 0.45s delays
- Edge glow effects: DOM manipulation

**Mobile Animations:**
- pageEnterUpMobile: 400ms, 30px translate, no blur
- Still uses child staggers
- Edge glow effects active

---

## Phase 2: Root-Cause Analysis

**Why Mobile Feels Slow:**

1. **Duration too long:** 400ms still feels laggy on touch
2. **Translate distance:** 30px is perceptible motion
3. **Child animations:** Add visual noise without purpose
4. **Edge glow:** DOM manipulation during scroll
5. **Animation accumulation:** Multiple concurrent animations

**Desktop Dependencies:**
- Keyframes defined outside breakpoints
- Child selectors shared
- Would need breakpoint-specific overrides

---

## Phase 3: Approach Comparison

### Approach 1: Fast Fade Only
Replace with 200ms opacity transition.

### Approach 2: Minimal Slide
300ms, 10px slide, no child animations.

### Approach 3: Instant Switch
No animation, instant page swap.

---

## Recommendation

**Approach 2: Minimal Slide**

Rationale: Touch users expect SOME motion feedback. 300ms is perceptible but not sluggish.

Changes:
- Duration: 400ms → 300ms
- Translate: 30px → 12px
- Remove child staggers on mobile
- Remove edge glow on mobile

All changes in @media (max-width: 768px).

Proceed to implementation?
```

---

## Example 3: Using Subagents

```
User: Run mobile-layout-audit on the navigation and animation systems.

Claude: I'll invoke the mobile-layout-audit agent for a detailed analysis.

[Agent reads and analyzes files]

## Mobile Layout Audit Report

### Files Analyzed
- style.css (lines 240-330, 735-1014, 1084-1403)
- script.js (lines 59-503)
- index.html (lines 715-731)

### Breakpoint Structure
- Main breakpoint: 768px
- Additional: prefers-reduced-motion

### Navigation Issues

| Issue | Location | Severity | Root Cause |
|-------|----------|----------|------------|
| More dropdown UX | style.css:840-915 | High | Desktop pattern forced on mobile |
| Touch target gap | style.css:811 | Medium | 8px gap too small |
| Fixed header space | style.css:789-805 | Medium | 56px permanent overlay |

### Animation Issues

| Animation | Properties | Duration | Performance |
|-----------|------------|----------|-------------|
| pageEnterUpMobile | translateY(30px) | 400ms | Moderate |
| Edge glow | gradient, opacity | 200ms | Poor (DOM) |
| Child staggers | translateY, opacity | Various | Poor (many concurrent) |

### Recommendations

1. **High Priority:** Replace "More" dropdown with all-visible nav or overlay
2. **Medium Priority:** Reduce mobile transition to 250-300ms
3. **Medium Priority:** Remove child animations on mobile
4. **Low Priority:** Increase touch target spacing

---

User: Run desktop-regression-review to verify my changes didn't break anything.

Claude: I'll invoke the desktop-regression-review agent.

[Agent reads modified files]

## Desktop Regression Review

### Changes Analyzed
- Files: style.css (lines 900-950)
- Stage: Navigation simplification

### Selector Audit
| Selector | Location | Breakpoint | Status |
|----------|----------|------------|--------|
| .navbar | style.css:792 | Mobile (@media) | ✅ Unchanged |
| .nav-links | style.css:268 | Desktop | ✅ Unchanged |
| .nav-indicator | style.css:294 | Desktop | ✅ Unchanged |

### Layout Verification
| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Sidebar width | 25% | 25% | ✅ |
| Main width | 75% | 75% | ✅ |

### Animation Verification
| Animation | Desktop Keyframes | Status |
|-----------|-------------------|--------|
| pageEnterUp | rotateX, blur, scale | ✅ Preserved |
| pageEnterDown | rotateX, blur, scale | ✅ Preserved |

### Verdict: ✅ PASS
Desktop layout and animations unchanged.
```

---

## Example 4: Final QA

```
User: Run final-qa-review on all changes.

Claude: I'll run comprehensive QA testing.

## Final QA Review Report

### Test Results

#### Viewport Testing
| Viewport | Mobile Tests | Status |
|----------|--------------|--------|
| 320px | 15/15 pass | ✅ |
| 375px | 15/15 pass | ✅ |
| 390px | 15/15 pass | ✅ |
| 414px | 15/15 pass | ✅ |
| 360px | 15/15 pass | ✅ |
| 412px | 15/15 pass | ✅ |

| Viewport | Desktop Tests | Status |
|----------|---------------|--------|
| 1024px | 20/20 pass | ✅ |
| 1440px | 20/20 pass | ✅ |
| 1920px | 20/20 pass | ✅ |

### Mobile Results
- Navigation: 5/5 pass ✅
- Layout: 5/5 pass ✅
- Animations: 5/5 pass ✅
- Performance: 5/5 pass ✅

### Desktop Results
- Layout: 5/5 pass ✅
- Navigation: 5/5 pass ✅
- Animations: 5/5 pass ✅
- Interactive Effects: 5/5 pass ✅

### Verdict: ✅ PASS - Ready for release

### Sign-off
- Mobile improvements verified: Yes
- Desktop preserved: Yes
- Accessibility compliant: Yes
- Cross-browser compatible: Yes
```
