# Mobile Redesign Skill Command

## Usage

This skill is invoked with:

```
/mobile-redesign [phase]
```

## Available Phases

### Phase 1: Understanding
```
/mobile-redesign phase1
/mobile-redesign --audit
```
Maps current implementation, identifies mobile-specific issues, documents desktop dependencies.

### Phase 2: Root-Cause Review
```
/mobile-redesign phase2
```
Analyzes why current approach fails, maps constraints, identifies desktop coupling.

### Phase 3: Approach Comparison
```
/mobile-redesign phase3
/mobile-redesign --compare
```
Generates 3+ distinct approaches, compares tradeoffs, recommends best option.

### Phase 4: Staged Implementation
```
/mobile-redesign phase4
```
Implements in atomic, reviewable stages with desktop regression checks after each.

### Phase 5: QA & Validation
```
/mobile-redesign phase5
/mobile-redesign --qa
```
Comprehensive testing, mobile validation, desktop verification, cross-browser checks.

## Full Workflow

To run the complete workflow:
```
/mobile-redesign
```

This executes all 5 phases sequentially with user approval between phases.

## With Subagents

You can also invoke specialized subagents:

```
Run mobile-layout-audit agent
Run desktop-regression-review agent
Run animation-performance-review agent
Run final-qa-review agent
```

## Example Session

```
User: /mobile-redesign --compare

Claude: I'll run the mobile redesign skill with focus on approach comparison.

First, let me audit the current implementation...

[Runs mobile-layout-audit agent]

Based on my analysis, I'll propose 3 approaches:

**Approach 1: Compact Visible Nav**
[Details...]

**Approach 2: Hamburger with Full-Screen Overlay**
[Details...]

**Approach 3: Bottom Navigation Bar**
[Details...]

Which approach would you like to proceed with?
```
