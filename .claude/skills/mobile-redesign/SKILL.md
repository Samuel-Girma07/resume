---
name: mobile-redesign
description: Guide safe, phased mobile UI/UX redesign that preserves desktop experience. Enforces compare-before-implement workflow with desktop regression checks at every stage.
invocable_by: slash_command
---

# Mobile-First Responsive Redesign Skill

## Purpose

Guide Claude Code through safe, phased mobile UI/UX redesign that preserves desktop experience. This skill enforces a compare-before-implement workflow and ensures desktop regression checks at every stage.

## Recommended Approach

Based on prior analysis, **Approach 1: Compact Visible Nav (Minimal)** is recommended for this project:

- Remove "More" dropdown entirely
- Show all 4 nav links visible in compact horizontal bar
- CSS-only changes (no HTML modifications)
- All changes isolated to `@media (max-width: 768px)`
- Lowest implementation risk with good desktop safety

## When to Use

Invoke this skill when:
- Redesigning mobile navigation patterns
- Optimizing mobile animations/performance
- Fixing mobile-specific layout issues
- Comparing mobile UX approaches
- Any change affecting responsive breakpoints

## Trigger Commands

```
/mobile-redesign [phase]
/mobile-redesign --compare
/mobile-redesign --audit
/mobile-redesign --qa
```

---

## Phase 1: Understanding

**Goal:** Map current implementation before any changes.

### 1.1 Codebase Audit

```
READ all relevant files:
- Primary CSS (style.css)
- JavaScript interaction logic (script.js)
- HTML structure (index.html, etc.)
- Any animation/motion files (orb_effect.js, etc.)
```

### 1.2 Document Current State

Create a structured summary:

```markdown
## Current Implementation Map

### Desktop Behavior
- Navigation: [describe]
- Layout: [describe]
- Animations: [list with CSS properties]
- Interactions: [list JS behaviors]

### Mobile Behavior (current breakpoint: Xpx)
- Navigation: [describe current issues]
- Layout: [describe current issues]
- Animations: [describe current issues]
- Interactions: [describe current issues]

### Shared Components (affects both)
- [List elements used on both desktop and mobile]
- [Note any tight coupling that requires care]
```

### 1.3 Identify Problem Scope

Classify each issue:
- **Mobile-only fix:** Can be isolated to `@media (max-width: 768px)`
- **Shared fix:** Requires changes outside breakpoints (justify clearly)
- **Architecture change:** Requires structural changes (flag for approval)

---

## Phase 2: Root-Cause Review

**Goal:** Understand why current implementation doesn't work.

### 2.1 Problem Analysis

For each issue identified:

```markdown
## Issue: [Name]

**Symptom:** [What user experiences]

**Root Cause:** [Why it happens - code location]

**Current Approach:** [How it's currently handled]

**Why It Fails:** [Why current approach doesn't work on mobile]

**Desktop Dependency:** [Does fixing this affect desktop? How?]
```

### 2.2 Constraint Mapping

List all constraints before proposing solutions:

```markdown
## Constraints

### Must Preserve
- [Desktop feature X]
- [Desktop animation Y]
- [Accessibility requirement Z]

### Must Improve
- [Mobile problem A]
- [Mobile problem B]

### Must Not Break
- [Existing functionality X]
- [Browser compatibility Y]
```

---

## Phase 3: Approach Comparison

**Goal:** Propose and compare multiple solutions before implementing.

### 3.1 Generate Approaches

**CRITICAL:** Always propose at least 3 meaningfully different approaches.

For each approach, document:

```markdown
## Approach N: [Name]

### Navigation Changes
- [How navigation works]
- [HTML changes needed: none / mobile-only / shared]
- [CSS changes: breakpoint-isolated / shared]

### Animation Changes
- [How animations change]
- [Performance impact]
- [Desktop preservation strategy]

### Pros
- [Benefit 1]
- [Benefit 2]

### Cons
- [Limitation 1]
- [Limitation 2]

### Implementation Risk
- [Risk level: Low / Medium / High]
- [What could go wrong]
- [Mitigation strategy]

### Desktop Safety
- [How desktop remains untouched]
- [Any shared changes and justification]

### Code Preview
[Pseudo-code or CSS snippet showing the approach]
```

### 3.2 Comparison Matrix

Create a decision matrix:

```markdown
## Approach Comparison

| Criterion | Approach 1 | Approach 2 | Approach 3 |
|-----------|------------|------------|------------|
| Desktop Safety | High/Med/Low | High/Med/Low | High/Med/Low |
| Implementation Risk | Low/Med/High | Low/Med/High | Low/Med/High |
| Mobile UX Improvement | 1-5 | 1-5 | 1-5 |
| Code Isolation | Breakpoint-only/Shared | Breakpoint-only/Shared | Breakpoint-only/Shared |
| Maintainability | High/Med/Low | High/Med/Low | High/Med/Low |
```

### 3.3 Recommendation

```markdown
## Recommended Approach

**Selected:** [Approach N]

**Rationale:**
- [Why this approach wins]
- [Tradeoffs accepted]
- [Why others were rejected]

**Desktop Safety Guarantee:**
- [Specific safeguards]
```

---

## Phase 4: Staged Implementation

**Goal:** Implement in safe, reviewable stages.

### 4.1 Stage Breakdown

Each stage must be atomic and reversible:

```markdown
## Implementation Stages

### Stage 1: [Name]
**Scope:** [What changes]
**Files:** [List files]
**Desktop Impact:** [None / Justification if shared]
**Rollback:** [How to revert]

### Stage 2: [Name]
**Scope:** [What changes]
**Files:** [List files]
**Desktop Impact:** [None / Justification if shared]
**Rollback:** [How to revert]

[Continue for all stages]
```

### 4.2 Stage Execution Protocol

For each stage:

1. **Pre-Implementation**
   - Read current file state
   - Confirm change scope
   - Identify desktop touchpoints

2. **Implementation**
   - Make targeted changes only
   - Use `@media (max-width: 768px)` for mobile-only
   - Comment shared changes with `/* SHARED: [justification] */`

3. **Immediate Verification**
   - Check file for syntax errors
   - Verify no desktop selectors modified unintentionally
   - Confirm breakpoints are properly closed

### 4.3 Desktop Regression Check

**After each stage:**

```markdown
## Desktop Regression Check - Stage N

### CSS Selectors Modified
- [ ] All modifications are inside mobile breakpoint
- [ ] If shared, justification documented

### Desktop Features Verified
- [ ] Navigation layout intact
- [ ] Desktop animations working
- [ ] Desktop interactions functional
- [ ] No desktop selectors orphaned

### Unexpected Changes
- [List any changes outside intended scope]
```

---

## Phase 5: QA & Validation

**Goal:** Comprehensive testing before considering complete.

### 5.1 Mobile Testing Checklist

```markdown
## Mobile QA Checklist

### Viewport Testing
- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone standard)
- [ ] 390px (iPhone modern)
- [ ] 414px (iPhone Plus)
- [ ] 360px (Android standard)
- [ ] 412px (Android large)

### Navigation
- [ ] All nav items accessible
- [ ] Touch targets >= 44px
- [ ] No horizontal overflow
- [ ] Menu opens/closes smoothly
- [ ] Active states clear

### Animations
- [ ] Transitions smooth (60fps target)
- [ ] No jank/stutter
- [ ] Reduced motion respected
- [ ] Duration feels appropriate

### Content
- [ ] Text readable at all sizes
- [ ] No content cut off
- [ ] Scrollable where expected
- [ ] Forms usable

### Performance
- [ ] No heavy effects on mobile
- [ ] Memory usage acceptable
- [ ] Battery impact minimal
```

### 5.2 Desktop Regression Testing

```markdown
## Desktop Regression Checklist

### Navigation
- [ ] Horizontal nav visible
- [ ] All links functional
- [ ] Hover effects working
- [ ] Active indicator animates
- [ ] Sliding indicator works

### Layout
- [ ] Sidebar visible and positioned
- [ ] Main content width correct
- [ ] No horizontal scrollbar
- [ ] Footer positioned correctly

### Animations
- [ ] Cinematic page transitions
- [ ] Child element staggers
- [ ] Hover effects on cards
- [ ] Fluid canvas background
- [ ] Custom cursor visible

### Interactions
- [ ] Scroll navigation works
- [ ] Keyboard navigation works
- [ ] Touchpad gestures work
- [ ] Mouse parallax on profile

### Performance
- [ ] Animations smooth
- [ ] No console errors
- [ ] Memory stable
```

### 5.3 Cross-Browser Check

```markdown
## Browser Compatibility

### Mobile
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Samsung Internet

### Desktop
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
```

---

## Best Practices

### CSS Isolation Strategy

```css
/* ✅ CORRECT: Mobile-only change */
@media (max-width: 768px) {
  .navbar {
    /* mobile styles */
  }
}

/* ❌ AVOID: Modifying shared selector */
.navbar {
  /* This affects desktop too! */
}

/* ✅ ACCEPTABLE: Shared change with justification */
/* SHARED: Reduce animation complexity for performance across all devices */
.page.active {
  animation: simpleFade 0.3s ease;
}

@media (min-width: 769px) {
  .page.active {
    animation: cinematicEnter 0.72s cubic-bezier(0.22, 1, 0.36, 1);
  }
}
```

### JavaScript Safety Pattern

```javascript
// ✅ CORRECT: Feature detection
const isMobile = window.matchMedia('(pointer: coarse)').matches;
if (isMobile) {
  // mobile-only code
}

// ✅ CORRECT: Check before modifying
function updateMobileNav() {
  if (window.innerWidth <= 768) {
    // mobile update
  }
}

// ❌ AVOID: Global modification without check
document.querySelector('.navbar').innerHTML = '...'; // affects desktop!
```

### HTML Structure Safety

```html
<!-- ✅ CORRECT: Mobile-only element, hidden on desktop -->
<nav class="mobile-nav" aria-label="Mobile navigation">
  <!-- styles: display: none; above 768px -->
</nav>

<!-- ✅ CORRECT: Conditional rendering approach -->
<div class="nav-container">
  <!-- Desktop nav hidden on mobile -->
  <!-- Mobile nav hidden on desktop -->
</div>

<!-- ❌ AVOID: Modifying shared structure without desktop consideration -->
```

---

## Common Pitfalls

1. **Cascade Override Errors**
   - Mobile styles overridden by later desktop selectors
   - Solution: Use higher specificity or `!important` only in mobile breakpoints

2. **Breakpoint Leakage**
   - Unclosed media queries affecting desktop
   - Solution: Always verify media query closure

3. **JS Event Handler Conflicts**
   - Mobile handlers firing on desktop
   - Solution: Guard with viewport/pointer checks

4. **Performance Assumptions**
   - Assuming mobile = slow (over-optimizing)
   - Solution: Profile first, optimize based on data

5. **Touch Target Oversights**
   - Making mobile elements too small
   - Solution: Minimum 44px touch targets

---

## Escalation Protocol

If implementation reveals desktop impact:

1. **STOP** immediately
2. **DOCUMENT** the conflict
3. **ESCALATE** with options:
   - Accept shared change (requires user approval)
   - Find alternative mobile-only approach
   - Implement desktop-equivalent fix
4. **WAIT** for user decision
5. **PROCEED** only after approval

---

## Output Templates

### Implementation Summary

```markdown
## Mobile Redesign Complete

### Changes Made
1. [Change 1 - file:line]
2. [Change 2 - file:line]

### Desktop Impact
- [None / List shared changes with justification]

### Mobile Improvements
- [Improvement 1]
- [Improvement 2]

### Files Modified
- style.css: [lines X-Y]
- script.js: [lines X-Y]

### Testing Performed
- [ ] Mobile viewport testing
- [ ] Desktop regression testing
- [ ] Cross-browser testing

### Recommendations for Future
- [Any technical debt or follow-up items]
```
