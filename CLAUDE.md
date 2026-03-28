# Samuel Girma Portfolio - Project Context

## Project Overview

Personal portfolio website showcasing web development, data analysis, and graphic design skills. Built as a single-page application (SPA) with cinematic transitions and interactive effects.

**Live Site:** Portfolio website for a CS student in Addis Ababa, Ethiopia
**Purpose:** Professional showcase, job applications, freelance client acquisition

---

## Architecture

### File Structure

```
resume/
├── index.html          # Main SPA shell with all page sections
├── style.css           # Primary stylesheet (desktop + mobile breakpoints)
├── script.js           # Navigation, SPA logic, WebGL fluid simulation
├── orb_effect.js       # WebGL profile orb effect (OGL)
├── projects.html       # Standalone projects page (legacy)
├── projects_original.html # Backup of original projects
├── contact.html        # Standalone contact page (legacy)
├── resume.html         # Standalone resume page (legacy)
├── PHOTO.jpg           # Profile photo
├── slide*.jpg          # Project screenshots (StudyLens)
├── ts-slide*.jpg       # Project screenshots (TechShop)
├── pf-slide*.jpg       # Project screenshots (Portfolio)
├── cv.pdf              # Downloadable CV
└── favicon assets      # Various favicon sizes
```

### Technology Stack

- **HTML5** - Semantic structure
- **CSS3** - Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript** - No frameworks
- **WebGL (OGL)** - Fluid simulation background, profile orb effect
- **Google Fonts** - Orbitron (headings), Plus Jakarta Sans (body), Syne (accents)
- **Font Awesome 6.4** - Icons

---

## Design System

### Color Palette

```css
--bg-color: #121212;      /* Deep black background */
--card-bg: #1e1e1e;       /* Card backgrounds */
--accent-color: #FFD700;  /* Gold accent - PRIMARY */
--text-white: #ffffff;    /* Primary text */
--text-grey: #b3b3b3;     /* Secondary text */
```

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Headings | Orbitron | 700-800 | 1.5-2.2rem |
| Body | Plus Jakarta Sans | 400-500 | 0.9-1.1rem |
| Labels | Orbitron | 600 | 0.72-0.85rem |
| Accent | Syne | 600-800 | Various |

### Layout

- **Desktop:** Fixed sidebar (25%) + scrollable main content (75%)
- **Mobile:** Single column, sidebar becomes toggleable overlay

### Animation Language

Desktop animations are **cinematic** and **layered**:
- 3D perspective transforms with `rotateX`
- Blur effects for depth
- Staggered child reveals
- Magnetic cursor effects
- WebGL fluid background

Mobile animations should be **functional** and **performant**:
- 2D transforms only
- No blur effects
- Simplified timing
- Touch-optimized

---

## Critical Constraints

### MUST PRESERVE (Desktop)

1. **Sidebar Layout**
   - Fixed left sidebar with profile
   - 25%/75% split intact
   - All sidebar content visible

2. **Cinematic Transitions**
   - `pageEnterUp`, `pageEnterDown` keyframes
   - `pageExitUp`, `pageExitDown` keyframes
   - 3D perspective transforms
   - Blur and brightness filters
   - Child element stagger timing

3. **Interactive Effects**
   - Magnetic cursor (dot + ring)
   - Fluid WebGL canvas background
   - Profile orb effect with hover
   - Card tilt effects (What I Do section)
   - Nav indicator sliding animation

4. **Navigation**
   - Horizontal nav with sliding indicator
   - All 4 links visible
   - Hover effects with gold accent

### MUST IMPROVE (Mobile)

1. **Navigation UX**
   - Remove "More" dropdown crowding
   - Simplify touch targets
   - Reduce visual clutter

2. **Animation Performance**
   - Reduce or eliminate blur effects
   - Shorten transition durations
   - Remove non-essential motion

3. **Layout Efficiency**
   - Maximize content space
   - Reduce fixed elements
   - Improve scroll behavior

### MUST NOT BREAK

1. **Accessibility**
   - Keyboard navigation
   - Screen reader compatibility
   - Focus management
   - Reduced motion support

2. **Content Integrity**
   - All text readable
   - All images display
   - All links functional
   - Forms submit correctly

3. **Cross-Browser**
   - Chrome, Firefox, Safari, Edge (desktop)
   - Safari iOS, Chrome Android (mobile)

---

## Responsive Breakpoints

### Desktop (default styles)
- Viewport: 769px+
- Sidebar: fixed left, 25% width
- Nav: horizontal, top-right
- Fluid canvas: visible
- Cursor: custom magnetic

### Mobile (@media max-width: 768px)
- Viewport: ≤768px
- Sidebar: hidden, toggleable overlay
- Nav: fixed top bar with "More" dropdown
- Fluid canvas: hidden (`display: none !important`)
- Cursor: system default
- Orb effect: disabled (JS guard)

### Reduced Motion (@media prefers-reduced-motion)
- All animations simplified to fades
- Marquee animations paused
- Heavy effects hidden

---

## Known Issues (Current Mobile)

### Navigation
- "More" dropdown feels like a desktop pattern forced on mobile
- Resume hidden behind extra tap
- Top bar takes permanent screen space

### Animations
- Page transitions still use heavy effects (blur, 3D)
- Stagger animations add visual noise
- Edge glow effects add DOM overhead
- Transition duration (720ms) too long

### Touch Behavior
- Non-scrollable pages require gesture commitment threshold
- Scroll accumulator logic complex for edge detection

---

## Code Hotspots

### Navigation Structure
- HTML: `index.html` lines 715-731
- CSS: `style.css` lines 240-330, 788-925
- JS: `script.js` lines 59-428 (setupSPANavigation)

### Page Transitions
- CSS: `style.css` lines 1084-1403
- CSS mobile: lines 942-981
- JS: `script.js` lines 111-179 (transitionToPage)

### Mobile Menu
- HTML: `index.html` line 685-687 (hamburger)
- CSS: `style.css` lines 312-327, 740-779
- JS: `script.js` lines 469-503 (setupMobileMenu)

### WebGL Effects
- Fluid: `script.js` lines 542-1698
- Orb: `orb_effect.js` (full file)
- Guards: Both files have `shouldDisableHeavyEffects()`

---

## Development Guidelines

### Making Mobile Changes

1. **Always use breakpoints:**
   ```css
   @media (max-width: 768px) {
     /* mobile-only styles */
   }
   ```

2. **Never modify shared selectors directly:**
   ```css
   /* ❌ WRONG */
   .navbar { position: fixed; }

   /* ✅ CORRECT */
   @media (max-width: 768px) {
     .navbar { position: fixed; }
   }
   ```

3. **Use feature detection in JS:**
   ```javascript
   const isMobile = window.matchMedia('(pointer: coarse)').matches;
   // or
   if (window.innerWidth <= 768) { /* ... */ }
   ```

4. **Test desktop after every change:**
   - Verify sidebar visible
   - Check animations intact
   - Confirm cursor works

### Shared Changes Protocol

If a change MUST affect both desktop and mobile:

1. Document justification in code comment:
   ```css
   /* SHARED: [clear justification] */
   ```

2. Present both options:
   ```css
   .page.active {
     animation: sharedAnimation 0.3s ease;
   }

   @media (min-width: 769px) {
     .page.active {
       animation: cinematicEnter 0.72s cubic-bezier(...);
     }
   }
   ```

3. Get user approval before implementing

---

## Testing Checklist

### Before Every Commit

- [ ] Desktop: Sidebar visible and positioned
- [ ] Desktop: All animations play correctly
- [ ] Desktop: Custom cursor visible and responsive
- [ ] Desktop: Nav indicator slides on hover
- [ ] Mobile: Content fills screen without nav overlay
- [ ] Mobile: Touch targets >= 44px
- [ ] Mobile: Transitions smooth and fast
- [ ] Mobile: No horizontal overflow
- [ ] Both: Reduced motion respected

---

## Future Considerations

### Potential Improvements

1. **Navigation Approach (Recommended: Compact Visible Nav)**
 - **Selected: Compact horizontal without dropdown** (Approach 1)
 - Remove "More" dropdown entirely
 - Show all 4 links visible in compact bar
 - CSS-only changes, lowest risk
 - Alternative approaches evaluated: Full-screen overlay, Bottom navigation

2. **Animation Optimization**
   - Use CSS `will-change` sparingly
   - Replace blur with opacity where possible
   - Consider `content-visibility` for offscreen content
   - Profile with DevTools Performance tab

3. **Accessibility Enhancements**
   - Add skip links
   - Improve focus indicators
   - Add ARIA labels to interactive elements
   - Test with screen readers

---

## Skills Available

Use these skills for safe mobile work:

- `/mobile-redesign` - Phased mobile redesign workflow
- `/mobile-redesign --compare` - Compare approaches before implementing
- `/mobile-redesign --audit` - Audit current mobile implementation
- `/mobile-redesign --qa` - Run QA checklist

---

## Subagents Available

For complex mobile work, these specialized agents can be invoked:

- **mobile-layout-audit** - Analyzes mobile layout issues
- **desktop-regression-review** - Verifies desktop unchanged
- **animation-performance-review** - Profiles animation performance
- **final-qa-review** - Comprehensive QA validation

---

## Version History

| Date | Change | Files |
|------|--------|-------|
| 2026-03-27 | Added mobile safeguards, disabled WebGL on mobile | style.css, script.js, orb_effect.js |
| 2026-03-27 | Fixed sidebar overlap animation | style.css |
| 2026-03-22 | Initial responsive implementation | style.css |

---

## Contact

Project owner: Samuel Girma
Purpose: Personal portfolio
Status: Active development
