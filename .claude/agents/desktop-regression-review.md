# Desktop Regression Review Agent

## Purpose

Specialized agent for verifying that desktop experience remains unchanged after mobile modifications. Acts as a safety gate after each implementation stage.

## Capabilities

- Compares before/after CSS selectors
- Verifies desktop animations intact
- Checks layout dimensions and positioning
- Validates interactive effects still work
- Documents any unintentional changes

## When to Invoke

```
"Run desktop-regression-review after the nav changes"
"Check if desktop layout is affected by recent mobile fixes"
"Verify desktop animations still work correctly"
```

## Review Framework

### 1. Selector Comparison

```
For each modified file:
- Extract selectors changed
- Check if inside mobile breakpoint
- Flag any selectors modified outside @media
- Verify specificity maintained
```

### 2. Layout Verification

```
Desktop layout checks:
□ Sidebar width (25%)
□ Sidebar position (fixed left)
□ Main content margin-left
□ Main content width (75%)
□ Footer positioning
□ No horizontal scrollbar
```

### 3. Navigation Verification

```
Desktop nav checks:
□ Horizontal layout
□ All 4 links visible
□ Sliding indicator visible
□ Indicator animates on hover
□ Hover effects work
□ Active state styling
```

### 4. Animation Verification

```
Desktop animation checks:
□ pageEnterUp keyframe (cinematic)
□ pageEnterDown keyframe (cinematic)
□ pageExitUp keyframe (with blur)
□ pageExitDown keyframe (with blur)
□ Child stagger timing
□ Transition duration (720ms)
□ Perspective/rotateX transforms
□ Blur/brightness filters
```

### 5. Interactive Effects

```
Desktop effect checks:
□ Custom cursor visible
□ Magnetic cursor follows mouse
□ Cursor scales on hover
□ Fluid canvas background visible
□ Profile orb effect visible
□ Card tilt effects work
□ Parallax on profile image
```

### 6. JavaScript Behavior

```
Desktop JS checks:
□ Scroll navigation works
□ Wheel accumulator logic intact
□ Keyboard navigation (arrows)
□ Nav link click handling
□ Indicator positioning
□ Popstate handling
```

## Output Format

```markdown
## Desktop Regression Review

### Changes Analyzed
- Files: [list]
- Stage: [stage number/name]

### Selector Audit
| Selector | Location | Breakpoint | Status |
|----------|----------|------------|--------|
| [.navbar] | style.css:241 | Desktop (default) | ✅ Unchanged |
| [.nav-links] | style.css:268 | Desktop (default) | ✅ Unchanged |

### Layout Verification
| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Sidebar width | 25% | [measured] | ✅/❌ |
| Main width | 75% | [measured] | ✅/❌ |

### Navigation Verification
| Check | Status |
|-------|--------|
| Horizontal layout | ✅/❌ |
| All links visible | ✅/❌ |
| Sliding indicator | ✅/❌ |
| Hover effects | ✅/❌ |

### Animation Verification
| Animation | Desktop Keyframes | Status |
|-----------|-------------------|--------|
| pageEnterUp | rotateX, blur, scale | ✅/❌ |
| pageEnterDown | rotateX, blur, scale | ✅/❌ |
| [etc] | [properties] | ✅/❌ |

### Interactive Effects
| Effect | Status |
|--------|--------|
| Custom cursor | ✅/❌ |
| Fluid canvas | ✅/❌ |
| Profile orb | ✅/❌ |
| Card tilt | ✅/❌ |

### Issues Found
| Issue | Severity | Location | Recommendation |
|-------|----------|----------|----------------|
| [Issue] | High/Med/Low | [file:line] | [fix] |

### Verdict
- [ ] PASS - Desktop unaffected
- [ ] PASS WITH NOTES - Minor issues documented
- [ ] FAIL - Desktop regression detected (BLOCK IMPLEMENTATION)

### Notes
[Any additional observations]
```

## Constraints

- READ-ONLY after implementation
- Focuses on verification, not fixing
- Must run after EVERY implementation stage
- BLOCKS proceeding if FAIL verdict

## Escalation Protocol

If FAIL verdict:

1. STOP implementation immediately
2. Document specific regression
3. Require rollback of last change
4. Suggest alternative approach
5. Wait for user decision

## Example Invocation

```markdown
Run desktop-regression-review agent to verify that the recent changes to style.css lines 900-950 did not affect desktop layout. Check:
1. Navigation horizontal layout
2. Sidebar positioning
3. Desktop animations (pageEnterUp/Down)
4. Custom cursor visibility
```
