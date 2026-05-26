
// Navigation & Mobile Sidebar Logic
function scheduleIdleTask(callback, timeout = 1200) {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(callback, { timeout });
    } else {
        window.setTimeout(callback, Math.min(timeout, 600));
    }
}

function shouldSkipHeavyEffects() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasNoHover = window.matchMedia('(hover: none)').matches;
    const isSmallScreen = window.innerWidth <= 768;
    const saveData = navigator.connection && navigator.connection.saveData;
    return prefersReducedMotion || saveData || (hasCoarsePointer && (hasNoHover || isSmallScreen));
}

function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            existing.addEventListener('load', resolve, { once: true });
            existing.addEventListener('error', reject, { once: true });
            if (existing.dataset.loaded === 'true') resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        script.onload = () => {
            script.dataset.loaded = 'true';
            resolve();
        };
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

function loadProfileOrbWhenUseful() {
    if (shouldSkipHeavyEffects() || !document.getElementById('profile-orb')) return;
    scheduleIdleTask(() => {
        loadScriptOnce('https://cdn.jsdelivr.net/npm/ogl/dist/ogl.umd.js')
            .then(() => loadScriptOnce('orb_effect.js'))
            .catch(() => {
                const orb = document.getElementById('profile-orb');
                if (orb) orb.style.display = 'none';
            });
    }, 1800);
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial Setup
    setupMobileMenu();
    setupSPANavigation();
    setupMobileProjectCards();
    handleInitialHash();
    setupScrollReveal();
    setupBackToTop();
    loadProfileOrbWhenUseful();
});

// Hide loading screen after page loads
window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 250);
    }
});

// Scroll Reveal Animation using Intersection Observer
function setupScrollReveal() {
    const revealElements = document.querySelectorAll('.card, .timeline-item');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, {
        root: document.querySelector('.main-content'),
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
}

// Back to Top Button
function setupBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    const mainContent = document.querySelector('.main-content');

    if (backToTopBtn && mainContent) {
        backToTopBtn.addEventListener('click', () => {
            mainContent.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// SPA Navigation - Scroll-based page switching with animated transitions
function setupSPANavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const pages = document.querySelectorAll('.page');
    const indicator = document.querySelector('.nav-indicator');
    const navContainer = document.querySelector('.nav-links');
    const mainContent = document.querySelector('.main-content');
    const footer = document.querySelector('.footer');
    const scrollDots = document.querySelectorAll('.scroll-progress-dot');
    const sidebar = document.querySelector('.sidebar');
    const hamburger = document.querySelector('.hamburger');

    const PAGE_ORDER = ['about', 'resume', 'projects', 'contact'];
    // Derive currentIndex from the URL hash (or active page in DOM) so a hard
    // reload onto e.g. #contact doesn't leave the SPA cursor stuck on About.
    const initialHash = (window.location.hash.slice(1) || '').toLowerCase();
    const initialFromHash = PAGE_ORDER.indexOf(initialHash);
    const initialFromDom = PAGE_ORDER.findIndex(id => {
        const el = document.getElementById(id);
        return el && el.classList.contains('active');
    });
    let currentIndex = initialFromHash >= 0 ? initialFromHash :
                       initialFromDom >= 0 ? initialFromDom : 0;
    let isTransitioning = false;
    const TRANSITION_DURATION = 720; // ms, matches CSS animation
    const SCROLL_COOLDOWN = 900; // ms between scroll events
    let lastScrollTime = 0;

    function getScrollState() {
        const scrollTop = mainContent.scrollTop;
        const scrollHeight = mainContent.scrollHeight;
        const clientHeight = mainContent.clientHeight;
        const isScrollable = scrollHeight > clientHeight + 10;
        const atBottom = scrollTop + clientHeight >= scrollHeight - EDGE_TOLERANCE;
        const atTop = scrollTop <= EDGE_TOLERANCE;
        return { scrollTop, scrollHeight, clientHeight, isScrollable, atBottom, atTop };
    }

    function tryEdgeTransition(deltaY, source = 'scroll') {
        if (isTransitioning || deltaY === 0) return false;

        const now = Date.now();
        if (source !== 'touch' && now - lastScrollTime < SCROLL_COOLDOWN * 0.55) {
            return false;
        }

        const { isScrollable, atBottom, atTop } = getScrollState();
        if (isScrollable) {
            if (deltaY > 0 && !atBottom) return false;
            if (deltaY < 0 && !atTop) return false;
        }

        lastScrollTime = now;
        if (deltaY > 0 && currentIndex < PAGE_ORDER.length - 1) {
            transitionToPage(currentIndex + 1, 'down');
            return true;
        }
        if (deltaY < 0 && currentIndex > 0) {
            transitionToPage(currentIndex - 1, 'up');
            return true;
        }
        return false;
    }

    // Add page-loaded class immediately for smooth initial display
    const transitionTargets = document.querySelectorAll('.main-content, .sidebar, .hamburger');
    requestAnimationFrame(() => {
        transitionTargets.forEach(target => target.classList.add('page-loaded'));
    });

    // Helper to move nav indicator
    function moveIndicator(targetLink) {
        if (!targetLink || !indicator || !navContainer || !targetLink.classList.contains('nav-link')) return;

        const linkRect = targetLink.getBoundingClientRect();
        const containerRect = navContainer.getBoundingClientRect();
        const offsetLeft = linkRect.left - containerRect.left;

        indicator.style.width = `${linkRect.width}px`;
        indicator.style.transform = `translateX(${offsetLeft}px)`;
        indicator.style.opacity = '1';
    }

    // Update footer visibility
    function updateFooter(pageId) {
        if (!footer) return;
        if (pageId === 'contact') {
            footer.classList.add('footer-visible');
        } else {
            footer.classList.remove('footer-visible');
        }
    }

    // Update scroll progress dots
    function updateScrollDots(pageId) {
        scrollDots.forEach(dot => {
            dot.classList.toggle('active', dot.dataset.page === pageId);
        });
    }

    function closeMobileMenu() {
        if (!sidebar || !hamburger || window.innerWidth > 768) return;
        if (!sidebar.classList.contains('active')) return;
        sidebar.classList.remove('active');
        const icon = hamburger.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
        hamburger.setAttribute('aria-expanded', 'false');
        // Restore body scroll that setupMobileMenu locked on open.
        const prev = document.body.dataset.prevOverflow;
        if (prev !== undefined) {
            document.body.style.overflow = prev || '';
            delete document.body.dataset.prevOverflow;
        }
    }

    // Core animated transition function
    function transitionToPage(targetIndex, direction) {
        if (isTransitioning) return;
        if (targetIndex < 0 || targetIndex >= PAGE_ORDER.length) return;
        if (targetIndex === currentIndex) return;

        isTransitioning = true;

        const currentPageId = PAGE_ORDER[currentIndex];
        const targetPageId = PAGE_ORDER[targetIndex];
        const currentPage = document.getElementById(currentPageId);
        const targetPage = document.getElementById(targetPageId);

        // Determine direction: 'down' = scrolling down (next), 'up' = scrolling up (prev)
        const dir = direction || (targetIndex > currentIndex ? 'down' : 'up');

        // Remove all animation classes first
        pages.forEach(p => {
            p.classList.remove('anim-enter-up', 'anim-enter-down', 'anim-exit-up', 'anim-exit-down');
        });

        // Animate out the current page
        if (dir === 'down') {
            currentPage.classList.add('anim-exit-up');
        } else {
            currentPage.classList.add('anim-exit-down');
        }

        // After exit animation, swap pages
        setTimeout(() => {
            // Hide old page
            currentPage.classList.remove('active', 'anim-exit-up', 'anim-exit-down');

            // Show new page with entrance animation
            targetPage.classList.add('active');
            if (dir === 'down') {
                targetPage.classList.add('anim-enter-up');
            } else {
                targetPage.classList.add('anim-enter-down');
            }

            // Update nav links
            navLinks.forEach(l => l.classList.remove('active'));
            const activeLink = document.querySelector(`.nav-link[data-page="${targetPageId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
                moveIndicator(activeLink);
            }

            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('data-page') === targetPageId);
            });

            // Update URL hash
            history.pushState(null, '', `#${targetPageId}`);

            // Update footer and dots
            updateFooter(targetPageId);
            updateScrollDots(targetPageId);

            // Scroll main content to top
            mainContent.scrollTop = 0;

            currentIndex = targetIndex;
            closeMobileMenu();

            // Clean up animation classes after animation completes
            setTimeout(() => {
                targetPage.classList.remove('anim-enter-up', 'anim-enter-down');
                isTransitioning = false;
            }, TRANSITION_DURATION);

        }, 500); // wait for exit animation (500ms matches pageExitUp/Down duration)
    }

    // ── Wheel / Scroll Navigation with Accumulator Buffer ──
    let scrollAccumulator = 0;
    const SCROLL_TRIGGER_THRESHOLD = 150; // accumulated delta needed to trigger transition
    let accumulatorResetTimer = null;
    const EDGE_TOLERANCE = 30; // px from edge before we start accumulating

    function handleWheel(e) {
        if (isTransitioning) return;

        const now = Date.now();
        if (now - lastScrollTime < 100) {
            // Still accumulate but don't trigger too fast
        }

        // Check if the active page content is scrollable
        const { isScrollable, atBottom, atTop } = getScrollState();

        if (isScrollable) {
            if (e.deltaY > 0 && !atBottom) {
                // Still has room to scroll down naturally
                scrollAccumulator = 0;
                return;
            }
            if (e.deltaY < 0 && !atTop) {
                // Still has room to scroll up naturally
                scrollAccumulator = 0;
                return;
            }
        }

        // At the edge (or page doesn't scroll) — accumulate
        e.preventDefault();
        scrollAccumulator += e.deltaY;

        // Reset accumulator if user stops scrolling for 600ms
        clearTimeout(accumulatorResetTimer);
        accumulatorResetTimer = setTimeout(() => {
            scrollAccumulator = 0;
        }, 600);

        // Only trigger when enough scroll momentum has built up
        if (scrollAccumulator > SCROLL_TRIGGER_THRESHOLD) {
            scrollAccumulator = 0;
            tryEdgeTransition(1, 'wheel');
        } else if (scrollAccumulator < -SCROLL_TRIGGER_THRESHOLD) {
            scrollAccumulator = 0;
            tryEdgeTransition(-1, 'wheel');
        }
    }

    mainContent.addEventListener('wheel', handleWheel, { passive: false });

 // ── Touch / Swipe Navigation with Confirmation Zone ──
 // For non-scrollable pages, require deliberate gesture commitment
 // to prevent accidental navigation from small swipes.
 let touchStartY = 0;
 let touchStartTime = 0;
 let gestureCommitted = false;
 let decisionBuffer = 0;
 const COMMIT_THRESHOLD = 40; // px into gesture before we consider it committed
 const EDGE_GLOW_DISTANCE = 30; // px before showing visual feedback

 mainContent.addEventListener('touchstart', (e) => {
 touchStartY = e.touches[0].clientY;
 touchStartTime = Date.now();
 gestureCommitted = false;
 decisionBuffer = 0;
 }, { passive: true });

 mainContent.addEventListener('touchmove', (e) => {
 if (isTransitioning) return;

 const currentY = e.touches[0].clientY;
 const deltaY = touchStartY - currentY;
 const direction = deltaY > 0 ? 'down' : 'up';

 // Check scrollability
 const { isScrollable, atBottom, atTop } = getScrollState();

 if (!isScrollable) {
 // Non-scrollable page: track gesture commitment
 decisionBuffer = Math.abs(deltaY);

 // Show visual hint when approaching commit threshold
 if (decisionBuffer > EDGE_GLOW_DISTANCE && !gestureCommitted) {
 mainContent.classList.add(`edge-hint-${direction}`);
 }

 // Mark as committed when past threshold
 if (decisionBuffer > COMMIT_THRESHOLD) {
 gestureCommitted = true;
 }
 } else {
 // Scrollable page: show hint when at boundary
 mainContent.classList.remove('edge-hint-up', 'edge-hint-down');
 if (atBottom && deltaY > 0) {
 mainContent.classList.add('edge-hint-down');
 } else if (atTop && deltaY < 0) {
 mainContent.classList.add('edge-hint-up');
 }
 }
 }, { passive: true });

 mainContent.addEventListener('touchend', (e) => {
 // Clear visual hints
 mainContent.classList.remove('edge-hint-up', 'edge-hint-down');

 const touchEndY = e.changedTouches[0].clientY;
 const deltaY = touchStartY - touchEndY;
 const elapsed = Date.now() - touchStartTime;
 const velocity = Math.abs(deltaY) / elapsed; // px per ms

 if (isTransitioning) return;

 // Check scrollability and edge position
 const { isScrollable, atBottom, atTop } = getScrollState();

 // Dynamic threshold based on context
 let threshold;

 if (isScrollable) {
 // Scrollable pages: user may scroll for a while before hitting edge
 if (elapsed > 1500) return;
 if (deltaY > 0 && !atBottom) return;
 if (deltaY < 0 && !atTop) return;

 threshold = 52;
 } else {
 // Non-scrollable: short gesture window
 if (elapsed > 600) return;

 if (!gestureCommitted) {
 return;
 }

 if (velocity > 0.35) {
 threshold = 60;
 } else if (velocity > 0.2) {
 threshold = 82;
 } else {
 threshold = 104;
 }
 }

 if (Math.abs(deltaY) < threshold) return;

 tryEdgeTransition(deltaY, 'touch');
 }, { passive: true });

    // ── Keyboard Navigation ──
    document.addEventListener('keydown', (e) => {
        if (isTransitioning) return;
        if (e.key === 'ArrowDown' || e.key === 'PageDown') {
            if (currentIndex < PAGE_ORDER.length - 1) {
                e.preventDefault();
                transitionToPage(currentIndex + 1, 'down');
            }
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            if (currentIndex > 0) {
                e.preventDefault();
                transitionToPage(currentIndex - 1, 'up');
            }
        }
    });

    // ── Nav Link Click (existing behavior, enhanced with animations) ──
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            const targetIndex = PAGE_ORDER.indexOf(targetPage);
            if (targetIndex === -1) return;
            if (targetIndex === currentIndex) {
                // Tapping the current page on mobile should still dismiss
                // the sidebar — route through closeMobileMenu so body scroll
                // and aria state are restored consistently.
                if (window.innerWidth <= 768 && link.classList.contains('mobile-nav-link')) {
                    closeMobileMenu();
                }
                return;
            }

            transitionToPage(targetIndex);
        });

        // Hover Effect
        link.addEventListener('mouseenter', () => {
            if (link.classList.contains('nav-link')) {
                moveIndicator(link);
            }
        });
    });

    // ── Scroll Progress Dot Click ──
    scrollDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const targetPage = dot.dataset.page;
            const targetIndex = PAGE_ORDER.indexOf(targetPage);
            if (targetIndex === -1 || targetIndex === currentIndex) return;
            transitionToPage(targetIndex);
        });
    });

    // Mouse Leave Nav Container -> Return to Active
    if (navContainer) {
        navContainer.addEventListener('mouseleave', () => {
            const activeLink = document.querySelector('.nav-link.active');
            if (activeLink) {
                moveIndicator(activeLink);
            } else if (indicator) {
                indicator.style.opacity = '0';
            }
        });
    }

    // Handle Window Resize
    window.addEventListener('resize', () => {
        const activeLink = document.querySelector('.nav-link.active');
        if (activeLink) moveIndicator(activeLink);
        closeMobileMenu();
    });

    // Initialize indicator position on load
    setTimeout(() => {
        handleInitialHash(); // Find active link
        const initialActive = document.querySelector('.nav-link.active');
        if (initialActive) moveIndicator(initialActive);
    }, 100);

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.slice(1) || 'about';
        const targetIndex = PAGE_ORDER.indexOf(hash);
        if (targetIndex !== -1 && targetIndex !== currentIndex) {
            // Use transition for browser navigation too
            transitionToPage(targetIndex);
        }
    });
}

// Handle initial page load based on URL hash
function handleInitialHash() {
    const hash = window.location.hash.slice(1) || 'about';
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const pages = document.querySelectorAll('.page');
    const footer = document.querySelector('.footer');
    const scrollDots = document.querySelectorAll('.scroll-progress-dot');

    navLinks.forEach(link => {
        if (link.getAttribute('data-page') === hash) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    pages.forEach(page => {
        if (page.id === hash) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });

    // Update footer visibility on initial load
    if (footer) {
        if (hash === 'contact') {
            footer.classList.add('footer-visible');
        } else {
            footer.classList.remove('footer-visible');
        }
    }

    // Update scroll dots on initial load
    scrollDots.forEach(dot => {
        dot.classList.toggle('active', dot.dataset.page === hash);
    });
}

function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');

    if (hamburger && sidebar) {
        // Remove old listeners to prevent duplicates if re-running
        const newHamburger = hamburger.cloneNode(true);
        hamburger.parentNode.replaceChild(newHamburger, hamburger);

        // Helpers: single source of truth for open/close logic so every
        // trigger (hamburger, outside click, Escape, resize) stays in sync.
        function setHamburgerIcon(open) {
            const icon = newHamburger.querySelector('i');
            if (!icon) return;
            if (open) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }

        function openSidebar() {
            sidebar.classList.add('active');
            setHamburgerIcon(true);
            newHamburger.setAttribute('aria-expanded', 'true');
            // Lock background scroll while the overlay is open. Preserve
            // the existing overflow value so we can restore it on close.
            if (document.body.dataset.prevOverflow === undefined) {
                document.body.dataset.prevOverflow = document.body.style.overflow || '';
            }
            document.body.style.overflow = 'hidden';
            // Move focus into the sidebar for keyboard/screen-reader users.
            // Defer slightly so the slide-in transition doesn't fight focus.
            setTimeout(() => {
                const firstLink = sidebar.querySelector('.mobile-nav-links a');
                if (firstLink) firstLink.focus();
            }, 120);
        }

        function closeSidebar({ returnFocus = false } = {}) {
            if (!sidebar.classList.contains('active')) return;
            sidebar.classList.remove('active');
            setHamburgerIcon(false);
            newHamburger.setAttribute('aria-expanded', 'false');
            // Restore body scroll to whatever it was before we locked it.
            const prev = document.body.dataset.prevOverflow;
            document.body.style.overflow = prev || '';
            delete document.body.dataset.prevOverflow;
            if (returnFocus) newHamburger.focus();
        }

        newHamburger.setAttribute('aria-expanded', 'false');
        newHamburger.setAttribute('aria-controls', 'sidebar');

        newHamburger.addEventListener('click', () => {
            if (sidebar.classList.contains('active')) {
                closeSidebar({ returnFocus: true });
            } else {
                openSidebar();
            }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 &&
                !sidebar.contains(e.target) &&
                !newHamburger.contains(e.target) &&
                sidebar.classList.contains('active')) {
                closeSidebar();
            }
        });

        // Escape key closes the mobile sidebar and returns focus to hamburger
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' &&
                window.innerWidth <= 768 &&
                sidebar.classList.contains('active')) {
                closeSidebar({ returnFocus: true });
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeSidebar();
            }
        });
    }
}

function setupMobileProjectCards() {
    const tracks = document.querySelectorAll('.sl-tech-track');
    const skills = document.querySelectorAll('.skills-marquee-content .skill-item');

    tracks.forEach(track => {
        const seen = new Set();
        track.querySelectorAll('.sl-tech-item').forEach(item => {
            const label = item.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
            if (seen.has(label)) {
                item.classList.add('mobile-tech-duplicate');
            } else {
                seen.add(label);
            }
        });
    });

    const seenSkills = new Set();
    skills.forEach((item, index) => {
        const label = item.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
        if (seenSkills.has(label)) {
            item.classList.add('mobile-tech-duplicate');
            return;
        }

        seenSkills.add(label);
        item.style.setProperty('--skill-order', index + 1);
        if (label.includes('javascript') || label.includes('typescript') || label.includes('tailwind')) {
            item.classList.add('skill-item-accent');
        }
    });
}


// Fluid Cursor Animation (Vanilla JS Adaptation)
window.addEventListener('load', function () {
    const canvas = document.getElementById('fluid');
    if (!canvas) return;


 // GUARD: Skip WebGL initialization on mobile or reduced motion
 // This prevents the entire WebGL pipeline from initializing,
 // not just hiding the canvas. Mobile devices will save significant
 // CPU/GPU resources.
 const shouldDisableHeavyEffects = () => {
 const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if (prefersReducedMotion) return true;

 const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
 const hasNoHover = window.matchMedia('(hover: none)').matches;
 const isSmallScreen = window.innerWidth <= 768;

 // Mobile device: coarse pointer + (no hover OR small screen)
 if (hasCoarsePointer && (hasNoHover || isSmallScreen)) return true;

 return false;
 };

  if (shouldDisableHeavyEffects()) {
  // Canvas already hidden via CSS. WebGL initialization skipped entirely.
  // No WebGL context created, no shaders compiled, no animation loop started.
  return;
  }
    scheduleIdleTask(() => {
    resizeCanvas();

    let config = {
        SIM_RESOLUTION: 96,
        DYE_RESOLUTION: 768,
        CAPTURE_RESOLUTION: 512,
        DENSITY_DISSIPATION: 3.5,
        VELOCITY_DISSIPATION: 2,
        PRESSURE: 0.1,
        PRESSURE_ITERATIONS: 12,
        CURL: 3,
        SPLAT_RADIUS: 0.2,
        SPLAT_FORCE: 6000,
        SHADING: true,
        COLOR_UPDATE_SPEED: 10,
        PAUSED: false,
        BACK_COLOR: { r: 0.5, g: 0, b: 0 },
        TRANSPARENT: true,
    };

    function pointerPrototype() {
        this.id = -1;
        this.texcoordX = 0;
        this.texcoordY = 0;
        this.prevTexcoordX = 0;
        this.prevTexcoordY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.down = false;
        this.moved = false;
        this.color = [0, 0, 0];
    }

    const pointers = [];
    pointers.push(new pointerPrototype());

    const { gl, ext } = getWebGLContext(canvas);

    if (!ext.supportLinearFiltering) {
        config.DYE_RESOLUTION = 256;
        config.SHADING = false;
    }

    function getWebGLContext(canvas) {
        const params = {
            alpha: true,
            depth: false,
            stencil: false,
            antialias: false,
            preserveDrawingBuffer: false,
        };

        let gl = canvas.getContext('webgl2', params);
        const isWebGL2 = !!gl;
        if (!isWebGL2)
            gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);

        let halfFloat;
        let supportLinearFiltering;
        if (isWebGL2) {
            gl.getExtension('EXT_color_buffer_float');
            supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
        } else {
            halfFloat = gl.getExtension('OES_texture_half_float');
            supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
        let formatRGBA;
        let formatRG;
        let formatR;

        if (isWebGL2) {
            formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
        } else {
            formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        }

        return {
            gl,
            ext: {
                formatRGBA,
                formatRG,
                formatR,
                halfFloatTexType,
                supportLinearFiltering,
            },
        };
    }

    function getSupportedFormat(gl, internalFormat, format, type) {
        if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
            switch (internalFormat) {
                case gl.R16F:
                    return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
                case gl.RG16F:
                    return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
                default:
                    return null;
            }
        }

        return {
            internalFormat,
            format,
        };
    }

    function supportRenderTextureFormat(gl, internalFormat, format, type) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        return status == gl.FRAMEBUFFER_COMPLETE;
    }

    class Material {
        constructor(vertexShader, fragmentShaderSource) {
            this.vertexShader = vertexShader;
            this.fragmentShaderSource = fragmentShaderSource;
            this.programs = [];
            this.activeProgram = null;
            this.uniforms = [];
        }

        setKeywords(keywords) {
            let hash = 0;
            for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);

            let program = this.programs[hash];
            if (program == null) {
                let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
                program = createProgram(this.vertexShader, fragmentShader);
                this.programs[hash] = program;
            }

            if (program == this.activeProgram) return;

            this.uniforms = getUniforms(program);
            this.activeProgram = program;
        }

        bind() {
            gl.useProgram(this.activeProgram);
        }
    }

    class Program {
        constructor(vertexShader, fragmentShader) {
            this.uniforms = {};
            this.program = createProgram(vertexShader, fragmentShader);
            this.uniforms = getUniforms(this.program);
        }

        bind() {
            gl.useProgram(this.program);
        }
    }

    function createProgram(vertexShader, fragmentShader) {
        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.trace(gl.getProgramInfoLog(program));

        return program;
    }

    function getUniforms(program) {
        let uniforms = [];
        let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            let uniformName = gl.getActiveUniform(program, i).name;
            uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
        }
        return uniforms;
    }

    function compileShader(type, source, keywords) {
        source = addKeywords(source, keywords);

        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.trace(gl.getShaderInfoLog(shader));

        return shader;
    }

    function addKeywords(source, keywords) {
        if (keywords == null) return source;
        let keywordsString = '';
        keywords.forEach((keyword) => {
            keywordsString += '#define ' + keyword + '\n';
        });

        return keywordsString + source;
    }

    const baseVertexShader = compileShader(
        gl.VERTEX_SHADER,
        `
        precision highp float;
    
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform vec2 texelSize;
    
        void main () {
            vUv = aPosition * 0.5 + 0.5;
            vL = vUv - vec2(texelSize.x, 0.0);
            vR = vUv + vec2(texelSize.x, 0.0);
            vT = vUv + vec2(0.0, texelSize.y);
            vB = vUv - vec2(0.0, texelSize.y);
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `
    );

    const blurVertexShader = compileShader(
        gl.VERTEX_SHADER,
        `
        precision highp float;
    
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        uniform vec2 texelSize;
    
        void main () {
            vUv = aPosition * 0.5 + 0.5;
            float offset = 1.33333333;
            vL = vUv - texelSize * offset;
            vR = vUv + texelSize * offset;
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `
    );

    const blurShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
        precision mediump float;
        precision mediump sampler2D;
    
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        uniform sampler2D uTexture;
    
        void main () {
            vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
            sum += texture2D(uTexture, vL) * 0.35294117;
            sum += texture2D(uTexture, vR) * 0.35294117;
            gl_FragColor = sum;
        }
    `
    );

    const copyShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
        precision mediump float;
        precision mediump sampler2D;
    
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
    
        void main () {
            gl_FragColor = texture2D(uTexture, vUv);
        }
    `
    );

    const clearShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
        precision mediump float;
        precision mediump sampler2D;
    
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        uniform float value;
    
        void main () {
            gl_FragColor = value * texture2D(uTexture, vUv);
        }
    `
    );

    const colorShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
        precision mediump float;
    
        uniform vec4 color;
    
        void main () {
            gl_FragColor = color;
        }
    `
    );

    const displayShaderSource = `
        precision highp float;
        precision highp sampler2D;
    
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uTexture;
        uniform sampler2D uDithering;
        uniform vec2 ditherScale;
        uniform vec2 texelSize;
    
        vec3 linearToGamma (vec3 color) {
            color = max(color, vec3(0));
            return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
        }
    
        void main () {
            vec3 c = texture2D(uTexture, vUv).rgb;
    
        #ifdef SHADING
            vec3 lc = texture2D(uTexture, vL).rgb;
            vec3 rc = texture2D(uTexture, vR).rgb;
            vec3 tc = texture2D(uTexture, vT).rgb;
            vec3 bc = texture2D(uTexture, vB).rgb;
    
            float dx = length(rc) - length(lc);
            float dy = length(tc) - length(bc);
    
            vec3 n = normalize(vec3(dx, dy, length(texelSize)));
            vec3 l = vec3(0.0, 0.0, 1.0);
    
            float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
            c *= diffuse;
        #endif
    
            float a = max(c.r, max(c.g, c.b));
            gl_FragColor = vec4(c, a);
        }
    `;

    const splatShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
        precision highp float;
        precision highp sampler2D;
    
        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;
    
        void main () {
            vec2 p = vUv - point.xy;
            p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            vec3 base = texture2D(uTarget, vUv).xyz;
            gl_FragColor = vec4(base + splat, 1.0);
        }
    `
    );

    const advectionShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
        precision highp float;
        precision highp sampler2D;
    
        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform vec2 dyeTexelSize;
        uniform float dt;
        uniform float dissipation;
    
        vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
            vec2 st = uv / tsize - 0.5;
    
            vec2 iuv = floor(st);
            vec2 fuv = fract(st);
    
            vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
            vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
            vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
            vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    
            return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
        }
    
        void main () {
        #ifdef MANUAL_FILTERING
            vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
            vec4 result = bilerp(uSource, coord, dyeTexelSize);
        #else
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            vec4 result = texture2D(uSource, coord);
        #endif
            float decay = 1.0 + dissipation * dt;
            gl_FragColor = result / decay;
        }
    `,
        ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']
    );

    const divergenceShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
        precision mediump float;
        precision mediump sampler2D;
    
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
    
        void main () {
            float L = texture2D(uVelocity, vL).x;
            float R = texture2D(uVelocity, vR).x;
            float T = texture2D(uVelocity, vT).y;
            float B = texture2D(uVelocity, vB).y;
    
            vec2 C = texture2D(uVelocity, vUv).xy;
            if (vL.x < 0.0) { L = -C.x; }
            if (vR.x > 1.0) { R = -C.x; }
            if (vT.y > 1.0) { T = -C.y; }
            if (vB.y < 0.0) { B = -C.y; }
    
            float div = 0.5 * (R - L + T - B);
            gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
    `
    );

    const curlShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
        precision mediump float;
        precision mediump sampler2D;
    
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
    
        void main () {
            float L = texture2D(uVelocity, vL).y;
            float R = texture2D(uVelocity, vR).y;
            float T = texture2D(uVelocity, vT).x;
            float B = texture2D(uVelocity, vB).x;
            float vorticity = R - L - T + B;
            gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
        }
    `
    );

    const vorticityShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
        precision highp float;
        precision highp sampler2D;
    
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;
    
        void main () {
            float L = texture2D(uCurl, vL).x;
            float R = texture2D(uCurl, vR).x;
            float T = texture2D(uCurl, vT).x;
            float B = texture2D(uCurl, vB).x;
            float C = texture2D(uCurl, vUv).x;
    
            vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
            force /= length(force) + 0.0001;
            force *= curl * C;
            force.y *= -1.0;
    
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity += force * dt;
            velocity = min(max(velocity, -1000.0), 1000.0);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
    `
    );

    const pressureShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
        precision mediump float;
        precision mediump sampler2D;
    
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;
    
        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            float C = texture2D(uPressure, vUv).x;
            float divergence = texture2D(uDivergence, vUv).x;
            float pressure = (L + R + B + T - divergence) * 0.25;
            gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
    `
    );

    const gradientSubtractShader = compileShader(
        gl.FRAGMENT_SHADER,
        `
        precision mediump float;
        precision mediump sampler2D;
    
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;
    
        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity.xy -= vec2(R - L, T - B);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
    `
    );

    const blit = (() => {
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        return (target, clear = false) => {
            if (target == null) {
                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            } else {
                gl.viewport(0, 0, target.width, target.height);
                gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
            }
            if (clear) {
                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        };
    })();

    let dye;
    let velocity;
    let divergence;
    let curl;
    let pressure;

    const copyProgram = new Program(baseVertexShader, copyShader);
    const clearProgram = new Program(baseVertexShader, clearShader);
    const splatProgram = new Program(baseVertexShader, splatShader);
    const advectionProgram = new Program(baseVertexShader, advectionShader);
    const divergenceProgram = new Program(baseVertexShader, divergenceShader);
    const curlProgram = new Program(baseVertexShader, curlShader);
    const vorticityProgram = new Program(baseVertexShader, vorticityShader);
    const pressureProgram = new Program(baseVertexShader, pressureShader);
    const gradienSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);

    const displayMaterial = new Material(baseVertexShader, displayShaderSource);

    function initFramebuffers() {
        let simRes = getResolution(config.SIM_RESOLUTION);
        let dyeRes = getResolution(config.DYE_RESOLUTION);

        const texType = ext.halfFloatTexType;
        const rgba = ext.formatRGBA;
        const rg = ext.formatRG;
        const r = ext.formatR;
        const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

        gl.disable(gl.BLEND);

        if (dye == null) dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        else dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);

        if (velocity == null) velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        else velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);

        divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    }

    function createFBO(w, h, internalFormat, format, type, param) {
        gl.activeTexture(gl.TEXTURE0);
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

        let fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);

        let texelSizeX = 1.0 / w;
        let texelSizeY = 1.0 / h;

        return {
            texture,
            fbo,
            width: w,
            height: h,
            texelSizeX,
            texelSizeY,
            attach(id) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return id;
            },
        };
    }

    function createDoubleFBO(w, h, internalFormat, format, type, param) {
        let fbo1 = createFBO(w, h, internalFormat, format, type, param);
        let fbo2 = createFBO(w, h, internalFormat, format, type, param);

        return {
            width: w,
            height: h,
            texelSizeX: fbo1.texelSizeX,
            texelSizeY: fbo1.texelSizeY,
            get read() {
                return fbo1;
            },
            set read(value) {
                fbo1 = value;
            },
            get write() {
                return fbo2;
            },
            set write(value) {
                fbo2 = value;
            },
            swap() {
                let temp = fbo1;
                fbo1 = fbo2;
                fbo2 = temp;
            },
        };
    }

    function resizeFBO(target, w, h, internalFormat, format, type, param) {
        let newFBO = createFBO(w, h, internalFormat, format, type, param);
        copyProgram.bind();
        gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
        blit(newFBO);
        return newFBO;
    }

    function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
        if (target.width == w && target.height == h) return target;
        target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
        target.write = createFBO(w, h, internalFormat, format, type, param);
        target.width = w;
        target.height = h;
        target.texelSizeX = 1.0 / w;
        target.texelSizeY = 1.0 / h;
        return target;
    }

    function createTextureAsync(url) {
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]));

        let obj = {
            texture,
            width: 1,
            height: 1,
            attach(id) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return id;
            },
        };

        let image = new Image();
        image.onload = () => {
            obj.width = image.width;
            obj.height = image.height;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        };
        image.src = url;

        return obj;
    }

    function updateKeywords() {
        let displayKeywords = [];
        if (config.SHADING) displayKeywords.push('SHADING');
        displayMaterial.setKeywords(displayKeywords);
    }

    updateKeywords();
    initFramebuffers();

    let lastUpdateTime = Date.now();
    let colorUpdateTimer = 0.0;

    function update() {
        if (document.hidden) return;
        const dt = calcDeltaTime();
        if (resizeCanvas()) initFramebuffers();
        updateColors(dt);
        applyInputs();
        step(dt);
        render(null);
        requestAnimationFrame(update);
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            lastUpdateTime = Date.now();
            requestAnimationFrame(update);
        }
    });

    function calcDeltaTime() {
        let now = Date.now();
        let dt = (now - lastUpdateTime) / 1000;
        dt = Math.min(dt, 0.016666);
        lastUpdateTime = now;
        return dt;
    }

    function resizeCanvas() {
        let width = scaleByPixelRatio(canvas.clientWidth);
        let height = scaleByPixelRatio(canvas.clientHeight);
        if (canvas.width != width || canvas.height != height) {
            canvas.width = width;
            canvas.height = height;
            return true;
        }
        return false;
    }

    function updateColors(dt) {
        colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
        if (colorUpdateTimer >= 1) {
            colorUpdateTimer = wrap(colorUpdateTimer, 0, 1);
            pointers.forEach((p) => {
                p.color = generateColor();
            });
        }
    }

    function applyInputs() {
        pointers.forEach((p) => {
            if (p.moved) {
                p.moved = false;
                splatPointer(p);
            }
        });
    }

    function step(dt) {
        gl.disable(gl.BLEND);

        curlProgram.bind();
        gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(curl);

        vorticityProgram.bind();
        gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
        gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
        gl.uniform1f(vorticityProgram.uniforms.dt, dt);
        blit(velocity.write);
        velocity.swap();

        divergenceProgram.bind();
        gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(divergence);

        clearProgram.bind();
        gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
        gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
        blit(pressure.write);
        pressure.swap();

        pressureProgram.bind();
        gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
        for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
            gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
            blit(pressure.write);
            pressure.swap();
        }

        gradienSubtractProgram.bind();
        gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
        gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
        blit(velocity.write);
        velocity.swap();

        advectionProgram.bind();
        gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        if (!ext.supportLinearFiltering) gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
        let velocityId = velocity.read.attach(0);
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
        gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
        gl.uniform1f(advectionProgram.uniforms.dt, dt);
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
        blit(velocity.write);
        velocity.swap();

        if (!ext.supportLinearFiltering) gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
        blit(dye.write);
        dye.swap();
    }

    function render(target) {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
        drawDisplay(target);
    }

    function drawDisplay(target) {
        let width = target == null ? gl.drawingBufferWidth : target.width;
        let height = target == null ? gl.drawingBufferHeight : target.height;

        displayMaterial.bind();
        if (config.SHADING) gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height);
        gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
        blit(target);
    }

    function splatPointer(pointer) {
        let dx = pointer.deltaX * config.SPLAT_FORCE;
        let dy = pointer.deltaY * config.SPLAT_FORCE;
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    }

    function clickSplat(pointer) {
        const color = generateColor();
        color.r *= 10.0;
        color.g *= 10.0;
        color.b *= 10.0;
        let dx = 10 * (Math.random() - 0.5);
        let dy = 30 * (Math.random() - 0.5);
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, color);
    }

    function splat(x, y, dx, dy, color) {
        splatProgram.bind();
        gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
        gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
        gl.uniform2f(splatProgram.uniforms.point, x, y);
        gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
        gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
        blit(velocity.write);
        velocity.swap();

        gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
        gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
        blit(dye.write);
        dye.swap();
    }

    function correctRadius(radius) {
        let aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1) radius *= aspectRatio;
        return radius;
    }

    window.addEventListener('mousedown', (e) => {
        let pointer = pointers[0];
        let posX = scaleByPixelRatio(e.clientX);
        let posY = scaleByPixelRatio(e.clientY);
        updatePointerDownData(pointer, -1, posX, posY);
        clickSplat(pointer);
    });

    document.body.addEventListener('mousemove', function handleFirstMouseMove(e) {
        let pointer = pointers[0];
        let posX = scaleByPixelRatio(e.clientX);
        let posY = scaleByPixelRatio(e.clientY);
        let color = generateColor();

        update();
        updatePointerMoveData(pointer, posX, posY, color);
        document.body.removeEventListener('mousemove', handleFirstMouseMove);
    });

    window.addEventListener('mousemove', (e) => {
        let pointer = pointers[0];
        let posX = scaleByPixelRatio(e.clientX);
        let posY = scaleByPixelRatio(e.clientY);
        let color = pointer.color;

        updatePointerMoveData(pointer, posX, posY, color);
    });

    document.body.addEventListener('touchstart', function handleFirstTouchStart(e) {
        const touches = e.targetTouches;
        let pointer = pointers[0];

        for (let i = 0; i < touches.length; i++) {
            let posX = scaleByPixelRatio(touches[i].clientX);
            let posY = scaleByPixelRatio(touches[i].clientY);

            update();
            updatePointerDownData(pointer, touches[i].identifier, posX, posY);
        }
        document.body.removeEventListener('touchstart', handleFirstTouchStart);
    });

    window.addEventListener('touchstart', (e) => {
        const touches = e.targetTouches;
        let pointer = pointers[0];
        for (let i = 0; i < touches.length; i++) {
            let posX = scaleByPixelRatio(touches[i].clientX);
            let posY = scaleByPixelRatio(touches[i].clientY);
            updatePointerDownData(pointer, touches[i].identifier, posX, posY);
        }
    });

    window.addEventListener(
        'touchmove',
        (e) => {
            const touches = e.targetTouches;
            let pointer = pointers[0];
            for (let i = 0; i < touches.length; i++) {
                let posX = scaleByPixelRatio(touches[i].clientX);
                let posY = scaleByPixelRatio(touches[i].clientY);
                updatePointerMoveData(pointer, posX, posY, pointer.color);
            }
        },
        false
    );

    window.addEventListener('touchend', (e) => {
        const touches = e.changedTouches;
        let pointer = pointers[0];

        for (let i = 0; i < touches.length; i++) {
            updatePointerUpData(pointer);
        }
    });

    function updatePointerDownData(pointer, id, posX, posY) {
        pointer.id = id;
        pointer.down = true;
        pointer.moved = false;
        pointer.texcoordX = posX / canvas.width;
        pointer.texcoordY = 1.0 - posY / canvas.height;
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.deltaX = 0;
        pointer.deltaY = 0;
        pointer.color = generateColor();
    }

    function updatePointerMoveData(pointer, posX, posY, color) {
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.texcoordX = posX / canvas.width;
        pointer.texcoordY = 1.0 - posY / canvas.height;
        pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
        pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
        pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
        pointer.color = color;
    }

    function updatePointerUpData(pointer) {
        pointer.down = false;
    }

    function correctDeltaX(delta) {
        let aspectRatio = canvas.width / canvas.height;
        if (aspectRatio < 1) delta *= aspectRatio;
        return delta;
    }

    function correctDeltaY(delta) {
        let aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1) delta /= aspectRatio;
        return delta;
    }

    function generateColor() {
        let c = HSVtoRGB(Math.random(), 1.0, 1.0);
        c.r *= 0.15;
        c.g *= 0.15;
        c.b *= 0.15;
        return c;
    }

    function HSVtoRGB(h, s, v) {
        let r, g, b, i, f, p, q, t;
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0:
                (r = v), (g = t), (b = p);
                break;
            case 1:
                (r = q), (g = v), (b = p);
                break;
            case 2:
                (r = p), (g = v), (b = t);
                break;
            case 3:
                (r = p), (g = q), (b = v);
                break;
            case 4:
                (r = t), (g = p), (b = v);
                break;
            case 5:
                (r = v), (g = p), (b = q);
                break;
        }

        return {
            r,
            g,
            b,
        };
    }

    function wrap(value, min, max) {
        const range = max - min;
        if (range == 0) return min;
        return ((value - min) % range) + min;
    }

    function getResolution(resolution) {
        let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
        if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

        const min = Math.round(resolution);
        const max = Math.round(resolution * aspectRatio);

        if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: max, height: min };
        else return { width: min, height: max };
    }

    function scaleByPixelRatio(input) {
        const pixelRatio = window.devicePixelRatio || 1;
        return Math.floor(input * pixelRatio);
    }

    function hashCode(s) {
        if (s.length == 0) return 0;
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
            hash = (hash << 5) - hash + s.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    update();
    }, 1600);
});

/* -----------------------------------------------------------
   GOOGLE APPS SCRIPT CONTACT FORM INTEGRATION
----------------------------------------------------------- */
window.handleContactForm = async function(e) {
    e.preventDefault();
    
    const contactForm = e.target;
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbykFOAY4PCsM7HwIn219UJv3GM46JmrZW_SpVx-igiym3xmQqPitlvMVh7DGBnEkYAS/exec';

    const submitBtn = contactForm.querySelector('.form-submit');
    const submitLabel = submitBtn.querySelector('.form-submit-label');
    const submitIcon = submitBtn.querySelector('i');
    const originalText = submitLabel ? submitLabel.textContent : 'Send Message';
    const originalIcon = submitIcon ? submitIcon.className : 'fas fa-paper-plane';

    // Show loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        if (submitLabel) submitLabel.textContent = 'Sending...';
        if (submitIcon) submitIcon.className = 'fas fa-spinner fa-spin';
    }

    // Gather data
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.ok) {
            // Success state
            if (submitLabel) submitLabel.textContent = 'Message Sent!';
            if (submitIcon) submitIcon.className = 'fas fa-check';
            if (submitBtn) submitBtn.style.background = '#28a745';
            contactForm.reset();

            setTimeout(() => {
                if (submitLabel) submitLabel.textContent = originalText;
                if (submitIcon) submitIcon.className = originalIcon;
                if (submitBtn) {
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                }
            }, 3000);
        } else {
            throw new Error('Network response was not ok.');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        if (submitLabel) submitLabel.textContent = 'Error! Try Again';
        if (submitIcon) submitIcon.className = 'fas fa-exclamation-triangle';
        if (submitBtn) submitBtn.style.background = '#dc3545';

        setTimeout(() => {
            if (submitLabel) submitLabel.textContent = originalText;
            if (submitIcon) submitIcon.className = originalIcon;
            if (submitBtn) {
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }
        }, 3000);
    }
};
