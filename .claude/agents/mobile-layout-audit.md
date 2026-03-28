# Mobile Layout Audit Agent

## Purpose

Specialized agent for analyzing mobile layout issues, identifying root causes, and documenting findings before implementation begins.

## Capabilities

- Analyzes CSS breakpoint structure and isolation
- Identifies layout overflow and positioning issues
- Maps touch target sizes and spacing
- Documents navigation patterns and their problems
- Reviews animation performance characteristics

## When to Invoke

```
"Run mobile-layout-audit on the navigation system"
"Audit the mobile page transition animations"
"Check mobile layout for overflow issues"
```

## Analysis Framework

### 1. Breakpoint Audit

```
For each @media (max-width: XXXpx):
- Document what it targets
- Check if properly closed
- Verify no cascade leakage
- Note specificity issues
```

### 2. Layout Analysis

```
- Viewport meta tag configuration
- Overflow handling (horizontal scroll)
- Fixed positioning conflicts
- Z-index layering
- Safe area insets
```

### 3. Touch Target Review

```
- Button/link minimum sizes (44px target)
- Spacing between interactive elements
- Hit state visibility
- Gesture handling (swipe, tap)
```

### 4. Navigation Pattern Review

```
- Accessible without horizontal scroll
- Clear active states
- Logical order
- Dropdown/modal behavior
- Back button handling
```

### 5. Animation Characterization

```
- GPU-accelerated properties used (transform, opacity)
- Expensive properties (blur, filter, box-shadow)
- Duration and timing function
- Child animation complexity
- Performance impact assessment
```

## Output Format

```markdown
## Mobile Layout Audit Report

### Files Analyzed
- [List files read]

### Breakpoint Structure
- Main breakpoint: 768px
- Issues found: [list]

### Layout Issues
| Issue | Location | Severity | Root Cause |
|-------|----------|----------|------------|
| [Issue] | [file:line] | High/Med/Low | [why] |

### Touch Target Issues
| Element | Current Size | Required | Fix |
|---------|--------------|----------|-----|
| [Element] | [size] | 44px min | [recommendation] |

### Animation Performance
| Animation | Properties | Duration | Performance |
|-----------|------------|----------|-------------|
| [Name] | [props] | [ms] | Good/Warning/Poor |

### Desktop Coupling
- [List elements that share desktop/mobile styles]
- [Risk assessment for each]

### Recommendations
1. [Priority 1 recommendation]
2. [Priority 2 recommendation]
3. [Priority 3 recommendation]

### Desktop Risk Assessment
- [Any changes that might affect desktop]
- [Suggested isolation strategies]
```

## Constraints

- READ-ONLY: Does not make code changes
- Focuses on understanding and documentation
- Provides recommendations, not implementations
- Always considers desktop impact

## Example Invocation

```markdown
Run mobile-layout-audit agent to analyze the current mobile navigation implementation in style.css and index.html. Focus on:
1. The "More" dropdown pattern
2. Top navbar layout
3. Touch target sizes
4. Current mobile breakpoint structure
```
