
// Interactive Dots Animation (Profile Picture)
class ProfileDots {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        // Transparent background so sidebar shows through
        this.backgroundColor = options.backgroundColor || 'transparent'; 
        this.dotColor = options.dotColor || '#FFD700'; // Gold dots
        this.gridSpacing = options.gridSpacing || 20; // Tighter grid for small area
        this.animationSpeed = options.animationSpeed || 0.05;
        this.removeWaveLine = options.removeWaveLine !== undefined ? options.removeWaveLine : false;

        this.time = 0;
        this.mouse = { x: 0, y: 0, isDown: false };
        this.ripples = [];
        this.dots = [];
        this.dpr = window.devicePixelRatio || 1;
        this.animationFrameId = null;

        this.init();
    }

    init() {
        this.resize();
        this.initEvents();
        this.animate();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;

        this.canvas.width = displayWidth * this.dpr;
        this.canvas.height = displayHeight * this.dpr;
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;

        this.ctx.scale(this.dpr, this.dpr);
        this.initDots(displayWidth, displayHeight);
    }

    initDots(width, height) {
        this.dots = [];
        for (let x = this.gridSpacing / 2; x < width; x += this.gridSpacing) {
            for (let y = this.gridSpacing / 2; y < height; y += this.gridSpacing) {
                this.dots.push({
                    x,
                    y,
                    originalX: x,
                    originalY: y,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
    }

    initEvents() {
        window.addEventListener('resize', () => this.resize());
        
        // Use document for mouse move to catch movement outside small canvas
        // But calculations need to be relative to canvas
        document.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.isDown = true;
            const rect = this.canvas.getBoundingClientRect();
            this.ripples.push({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                time: Date.now(),
                intensity: 2
            });
            const now = Date.now();
            this.ripples = this.ripples.filter(r => now - r.time < 3000);
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouse.isDown = false;
        });
        
        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
             const rect = this.canvas.getBoundingClientRect();
             const touch = e.touches[0];
             this.ripples.push({
                 x: touch.clientX - rect.left,
                 y: touch.clientY - rect.top,
                 time: Date.now(),
                 intensity: 2
             });
        }, {passive: true});
    }

    getMouseInfluence(x, y) {
        const dx = x - this.mouse.x;
        const dy = y - this.mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 100; // Smaller influence radius for profile
        return Math.max(0, 1 - distance / maxDistance);
    }

    getRippleInfluence(x, y, currentTime) {
        let totalInfluence = 0;
        this.ripples.forEach(ripple => {
            const age = currentTime - ripple.time;
            const maxAge = 2000;
            if (age < maxAge) {
                const dx = x - ripple.x;
                const dy = y - ripple.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const progress = age / maxAge;
                const rippleRadius = progress * 150; // Smaller ripples
                const rippleWidth = 40;

                if (Math.abs(distance - rippleRadius) < rippleWidth) {
                    const rippleStrength = (1 - progress) * ripple.intensity;
                    const proximity = 1 - Math.abs(distance - rippleRadius) / rippleWidth;
                    totalInfluence += rippleStrength * proximity;
                }
            }
        });
        return Math.min(totalInfluence, 2);
    }

    animate() {
        if (!this.canvas) return;

        this.time += this.animationSpeed;
        const currentTime = Date.now();
        const width = this.canvas.width / this.dpr;
        const height = this.canvas.height / this.dpr;

        this.ctx.clearRect(0, 0, width, height);

        // Draw Dots
        this.dots.forEach(dot => {
            const mouseInf = this.getMouseInfluence(dot.originalX, dot.originalY);
            const rippleInf = this.getRippleInfluence(dot.originalX, dot.originalY, currentTime);
            const totalInf = mouseInf + rippleInf;

            dot.x = dot.originalX;
            dot.y = dot.originalY;

            // Dot Properties
            const baseSize = 1.5;
            const size = baseSize + totalInf * 3 + Math.sin(this.time + dot.phase) * 0.5;
            const opacity = Math.max(0.3, 0.6 + totalInf * 0.4 + Math.abs(Math.sin(this.time * 0.5 + dot.phase)) * 0.1);

            this.ctx.beginPath();
            this.ctx.arc(dot.x, dot.y, Math.max(0, size), 0, Math.PI * 2);
            
            const r = parseInt(this.dotColor.slice(1, 3), 16);
            const g = parseInt(this.dotColor.slice(3, 5), 16);
            const b = parseInt(this.dotColor.slice(5, 7), 16);
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            this.ctx.fill();
        });

        // Draw Waves
        if (!this.removeWaveLine) {
            this.ripples.forEach(ripple => {
                const age = currentTime - ripple.time;
                const maxAge = 2000;
                if (age < maxAge) {
                    const progress = age / maxAge;
                    const radius = progress * 150;
                    const alpha = (1 - progress) * 0.3 * ripple.intensity;

                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(100, 100, 100, ${alpha})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            });
        }

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
}

// Initialize Profile Dots
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('profile-canvas')) {
        new ProfileDots('profile-canvas', {
            dotColor: '#FFD700',       // Gold dots
            gridSpacing: 15,           // Tight grid
            removeWaveLine: false
        });
    }
});
