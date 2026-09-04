/**
 * Temple Particle System:
 * - Pushpa Varsha (Marigold & Rose flower petals with 3D rotation)
 * - Dhoop (Incense smoke curls)
 * - Diya flicker sparks & divine aura sparkles
 */

class TempleParticles {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.petals = [];
        this.smoke = [];
        this.sparkles = [];
        this.resize();

        window.addEventListener('resize', () => this.resize());
        this.lastTime = performance.now();
        this.activeFlowerRain = false;
        this.flowerTimer = null;
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    /**
     * Trigger a shower of sacred flowers (Pushpa Varsha)
     */
    triggerPushpaVarsha(count = 70) {
        const types = ['marigold_orange', 'marigold_yellow', 'rose_red', 'rose_pink', 'tulsi_leaf'];
        for (let i = 0; i < count; i++) {
            this.petals.push({
                x: Math.random() * this.width,
                y: -20 - Math.random() * 250,
                size: 10 + Math.random() * 14,
                speedY: 1.8 + Math.random() * 2.2,
                speedX: (Math.random() - 0.5) * 1.5,
                angle: Math.random() * Math.PI * 2,
                angularSpeed: (Math.random() - 0.5) * 0.06,
                flip: Math.random() * Math.PI,
                flipSpeed: 0.03 + Math.random() * 0.05,
                type: types[Math.floor(Math.random() * types.length)],
                opacity: 0.95
            });
        }
    }

    /**
     * Add incense smoke particle
     */
    addSmoke(x, y) {
        if (this.smoke.length > 80) return;
        this.smoke.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y,
            radius: 4 + Math.random() * 4,
            maxRadius: 28 + Math.random() * 20,
            speedY: -0.8 - Math.random() * 0.7,
            speedX: (Math.random() - 0.5) * 0.4,
            opacity: 0.35,
            decay: 0.0025 + Math.random() * 0.002
        });
    }

    /**
     * Divine aura golden sparkles around Bal Gopal
     */
    addDivineSparkle(centerX, centerY, radius = 90) {
        if (this.sparkles.length > 50) return;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;
        this.sparkles.push({
            x: centerX + Math.cos(angle) * dist,
            y: centerY + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -0.5 - Math.random() * 0.5,
            size: 2 + Math.random() * 3.5,
            maxSize: 4 + Math.random() * 4,
            alpha: 0.1,
            phase: 'growing',
            color: Math.random() > 0.3 ? '#ffe066' : '#fff9db'
        });
    }

    updateAndRender(dt, swingCenterX, swingCenterY) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Divine Aura Sparkles
        if (swingCenterX && swingCenterY) {
            if (Math.random() < 0.4) {
                this.addDivineSparkle(swingCenterX, swingCenterY - 20, 80);
            }
        }

        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const s = this.sparkles[i];
            s.x += s.vx;
            s.y += s.vy;

            if (s.phase === 'growing') {
                s.alpha += 0.04;
                if (s.alpha >= 0.85) s.phase = 'fading';
            } else {
                s.alpha -= 0.02;
            }

            if (s.alpha <= 0) {
                this.sparkles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = s.alpha;
            this.ctx.fillStyle = s.color;
            this.ctx.shadowColor = '#ffd700';
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            // Star shape sparkle
            const r = s.size;
            this.ctx.moveTo(s.x, s.y - r);
            this.ctx.quadraticCurveTo(s.x, s.y, s.x + r, s.y);
            this.ctx.quadraticCurveTo(s.x, s.y, s.x, s.y + r);
            this.ctx.quadraticCurveTo(s.x, s.y, s.x - r, s.y);
            this.ctx.quadraticCurveTo(s.x, s.y, s.x, s.y - r);
            this.ctx.fill();
            this.ctx.restore();
        }

        // 2. Incense Smoke (Dhoop)
        for (let i = this.smoke.length - 1; i >= 0; i--) {
            const sm = this.smoke[i];
            sm.y += sm.speedY;
            sm.x += sm.speedX + Math.sin(sm.y * 0.04) * 0.35;
            sm.radius += 0.18;
            sm.opacity -= sm.decay;

            if (sm.opacity <= 0 || sm.y < 0) {
                this.smoke.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, sm.opacity);
            const grad = this.ctx.createRadialGradient(sm.x, sm.y, 0, sm.x, sm.y, sm.radius);
            grad.addColorStop(0, 'rgba(235, 230, 210, 0.4)');
            grad.addColorStop(0.6, 'rgba(210, 200, 180, 0.15)');
            grad.addColorStop(1, 'rgba(180, 170, 150, 0)');
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // 3. Flower Petals (Pushpa Varsha)
        for (let i = this.petals.length - 1; i >= 0; i--) {
            const p = this.petals[i];
            p.y += p.speedY;
            p.x += p.speedX + Math.sin(p.angle) * 1.2;
            p.angle += p.angularSpeed;
            p.flip += p.flipSpeed;

            if (p.y > this.height + 40) {
                this.petals.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.angle);
            const scaleY = Math.sin(p.flip);
            this.ctx.scale(1, scaleY);
            this.ctx.globalAlpha = p.opacity;

            if (p.type === 'marigold_orange') {
                this.drawMarigold(0, 0, p.size, '#ff6f00', '#ffa000');
            } else if (p.type === 'marigold_yellow') {
                this.drawMarigold(0, 0, p.size, '#f57f17', '#ffee58');
            } else if (p.type === 'rose_red') {
                this.drawRosePetal(0, 0, p.size, '#c62828', '#e53935');
            } else if (p.type === 'rose_pink') {
                this.drawRosePetal(0, 0, p.size, '#ad1457', '#ec407a');
            } else if (p.type === 'tulsi_leaf') {
                this.drawTulsiLeaf(0, 0, p.size);
            }

            this.ctx.restore();
        }
    }

    drawMarigold(x, y, size, darkCol, lightCol) {
        const petals = 6;
        for (let i = 0; i < petals; i++) {
            const ang = (i * Math.PI * 2) / petals;
            this.ctx.save();
            this.ctx.rotate(ang);
            this.ctx.fillStyle = (i % 2 === 0) ? darkCol : lightCol;
            this.ctx.beginPath();
            this.ctx.ellipse(size * 0.4, 0, size * 0.4, size * 0.25, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        this.ctx.fillStyle = '#e65100';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawRosePetal(x, y, size, darkCol, lightCol) {
        const grad = this.ctx.createRadialGradient(-size * 0.2, -size * 0.2, 1, 0, 0, size);
        grad.addColorStop(0, lightCol);
        grad.addColorStop(1, darkCol);
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.moveTo(0, size * 0.6);
        this.ctx.bezierCurveTo(-size * 0.7, 0, -size * 0.6, -size * 0.6, 0, -size * 0.7);
        this.ctx.bezierCurveTo(size * 0.6, -size * 0.6, size * 0.7, 0, 0, size * 0.6);
        this.ctx.fill();
    }

    drawTulsiLeaf(x, y, size) {
        this.ctx.fillStyle = '#2e7d32';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, size * 0.6, size * 0.28, 0, 0, Math.PI * 2);
        this.ctx.fill();
        // Central vein
        this.ctx.strokeStyle = '#81c784';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 0.5, 0);
        this.ctx.lineTo(size * 0.5, 0);
        this.ctx.stroke();
    }
}

window.TempleParticles = TempleParticles;
