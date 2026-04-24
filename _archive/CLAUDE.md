# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static personal portfolio website for Samuel Girma. No build tools, no framework, no package manager — pure HTML, CSS, and vanilla JavaScript served as static files.

## Development

Open `index.html` in a browser or serve with any static file server (`npx serve .`, `python -m http.server`, VS Code Live Server). No install or build step.

## Architecture

### SPA Navigation (index.html)

`index.html` is the primary entry point and works as a single-page app. It contains four page sections (`#about`, `#resume`, `#projects`, `#contact`) that transition between each other via animated scroll/swipe/keyboard/click navigation. The page order is hardcoded in `script.js` as `PAGE_ORDER = ['about', 'resume', 'projects', 'contact']`.

Standalone HTML files (`resume.html`, `projects.html`, `contact.html`) exist as multi-page fallbacks — each duplicates the sidebar and navbar structure with traditional `<a href>` links instead of SPA transitions.

### Layout

- **Desktop**: Fixed left sidebar (25% width, glass morphism) + scrollable main content area (75%)
- **Mobile (<=768px)**: Sidebar hidden behind hamburger menu, simplified animations, WebGL effects disabled

### JavaScript Files

| File | Purpose |
|------|---------|
| `script.js` | SPA page transitions (scroll accumulator, touch gesture with commit threshold, keyboard), mobile menu, scroll reveal (IntersectionObserver), WebGL fluid cursor simulation (~1100 lines of WebGL shader code) |
| `orb_effect.js` | Profile picture orb glow effect using OGL library (WebGL shaders) |
| `interactive_dots.js` | Canvas-based animated dot grid behind profile picture |

The WebGL fluid cursor in `script.js` is the bulk of the file (lines ~592-1747). It initializes a full Navier-Stokes fluid simulation with GLSL shaders. It auto-disables on mobile via `pointer: coarse` / `hover: none` media queries — no WebGL context is created at all on mobile.

### Styling

All styling lives in `style.css` plus inline `<style>` blocks in `index.html` and `projects.html` (for project showcase cards `.sl-*` classes). The inline styles are duplicated between the two files.

**CSS custom properties** (defined in `:root`):
- `--bg-color: #121212`, `--card-bg: #1e1e1e` — dark theme
- `--accent-color: #FFD700` — gold accent used throughout
- `--sidebar-width: 25%`

**Fonts** (Google Fonts CDN):
- **Orbitron** — headings, badges, technical UI elements
- **Plus Jakarta Sans** — body text
- **Syne** — project card titles (only in index.html and projects.html)

**Icons**: Font Awesome 6.4.0 via CDN.

### Key UI Patterns

- **Page transitions**: CSS keyframe animations (`anim-enter-up/down`, `anim-exit-up/down`) with 720ms duration, managed by `transitionToPage()` in script.js
- **Scroll navigation**: Accumulator-based — requires `SCROLL_TRIGGER_THRESHOLD` (150px) of accumulated wheel delta at page edge before transitioning
- **Touch navigation**: Gesture commitment system — requires passing `COMMIT_THRESHOLD` (40px) before the swipe is considered intentional, with velocity-adjusted final thresholds
- **Project cards** (`.sl-*`): Image slider with prev/next arrows, dot indicators, tech stack marquee, two-column body layout with vertical divider
- **Skills marquee**: Infinite horizontal scroll animation, duplicates filtered out by `setupMobileProjectCards()`
- **Custom cursor**: CSS `cursor: none` on body, replaced by WebGL fluid effect on desktop

### Mobile-Specific Adaptations

Mobile styles use a `@media (max-width: 768px)` breakpoint. Key differences:
- WebGL fluid cursor and profile orb: completely skipped (no GL context created)
- 3D card tilt effects: disabled (`transform: none`)
- Sidebar: slides in as overlay with hamburger toggle
- Navigation: right-edge HUD dots replace horizontal navbar
- Project slider height: reduced to 200px
- Skills marquee: slowed to 40s cycle

### Assets

- `PHOTO.jpg` — profile photo
- `cv.pdf` — downloadable resume
- `*-slide*.jpg` — project screenshot images (prefixed by project: `pf-`, `sl-`, `ts-`)
- Favicon set: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-*.png`

## Editing Guidelines

When editing this project, keep in mind:

- Changes to the sidebar or navbar must be mirrored across `index.html`, `resume.html`, `projects.html`, and `contact.html` since each file has its own copy
- Project card styles (`.sl-*`) are duplicated as inline `<style>` blocks in both `index.html` and `projects.html` — changes must be synced
- The SPA transition system in `script.js` is tightly coupled to the DOM structure — page sections must have IDs matching `PAGE_ORDER` entries
- The fluid cursor WebGL code (script.js lines ~592+) is self-contained and should rarely need changes
- Test on both desktop and mobile viewports; the 768px breakpoint significantly changes layout and disables several effects
