/**
 * Front-to-Back (3D Depth) Jhula Physics Engine & Interactive Dori
 * - Front-to-back pendulum oscillation (towards and away from the devotee)
 * - True 3D perspective scale and vertical arc
 * - Ultra-smooth continuous inertia (never gets stuck)
 * - Detects "Happy Swinging" & "Idle: Bal Gopal reaches for the rope"
 */

class JhulaPhysics {
    constructor(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onSwingUpdate = callbacks.onSwingUpdate || (() => {});
        this.onHappyState = callbacks.onHappyState || (() => {});
        this.onReachRopeState = callbacks.onReachRopeState || (() => {});

        // Front-to-back swing physics
        this.phi = 0;              // Swing angle in radians (positive = forward towards viewer, negative = back)
        this.omega = 0;            // Angular velocity
        this.naturalFreq = 1.9;    // Majestic temple swing cadence (~3.3s period)
        this.damping = 0.0028;     // Natural pendulum damping for graceful persistent swings

        // Screen dimensions & anchor points
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.centerX = this.width / 2;
        this.baseY = this.calculateBaseY();

        // Dori (Pulling Rope) coordinates
        this.ropeHandleX = 0;
        this.ropeHandleY = 0;
        this.ropeAnchorX = 0;
        this.ropeAnchorY = 0;

        // Interaction state
        this.isDragging = false;
        this.dragStartY = 0;
        this.dragStartPhi = 0;
        this.lastDragY = 0;
        this.dragVelY = 0;

        // Idle & emotion tracking
        this.lastActiveTime = performance.now();
        this.isReachingForRope = false;
        this.isHappy = false;
        this.autoRock = false;

        this.initEvents();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    calculateBaseY() {
        // Lowered comfortably into the center-lower sanctum:
        // - Gives long, majestic suspension chains from the ceiling
        // - Leaves generous breathing room above and below
        // - Never touches the bottom panel (safe buffer of 140px+)
        return Math.max(340, Math.min(this.height * 0.52, this.height - 390));
    }

    calculateSwingPosition(phi = this.phi) {
        // Front-to-back 3D perspective swing physics
        // phi > 0: swinging forward towards the devotee (larger, descends in perspective)
        // phi < 0: swinging backward into the inner sanctum (smaller, ascends into depth)
        const depthScale = 1.0 + Math.sin(phi) * 0.22;
        const verticalTravel = Math.sin(phi) * 105 + (1 - Math.cos(phi)) * 32;
        const currentY = this.baseY + verticalTravel;
        const pitchTiltDeg = - Math.sin(phi) * 14;
        return { scale: depthScale, y: currentY, pitchTiltDeg };
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        this.centerX = this.width / 2;
        this.baseY = this.calculateBaseY();

        this.updateRopeAnchor();
        if (!this.isDragging) {
            this.resetRopeHandlePosition();
        }
    }

    updateRopeAnchor() {
        // Swing width is responsive: wider on larger screens, snug on mobile
        const swingHalfWidth = Math.min(160, this.width * 0.36);
        const { scale, y } = this.calculateSwingPosition();

        // Anchor on the right side of the swing seat
        this.ropeAnchorX = this.centerX + (swingHalfWidth * scale);
        this.ropeAnchorY = y + (15 * scale);
    }

    resetRopeHandlePosition() {
        // Position handle towards bottom-right: natural thumb zone, safely above bottom panel
        const handleTargetX = Math.min(this.width - 45, this.ropeAnchorX + 50);
        const maxHandleY = this.height - 150;
        const handleTargetY = Math.min(maxHandleY, this.ropeAnchorY + 145 + Math.sin(this.phi) * 45);

        if (!this.isDragging) {
            this.ropeHandleX += (handleTargetX - this.ropeHandleX) * 0.18;
            this.ropeHandleY += (handleTargetY - this.ropeHandleY) * 0.18;
        }
    }

    initEvents() {
        const getPos = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX, y: clientY };
        };

        const onStart = (e) => {
            const pos = getPos(e);
            this.lastDragY = pos.y;
            this.dragStartY = pos.y;
            this.dragStartPhi = this.phi;

            // Check if touch is near rope handle OR near jhula
            const distHandle = Math.hypot(pos.x - this.ropeHandleX, pos.y - this.ropeHandleY);
            const distJhula = Math.hypot(pos.x - this.centerX, pos.y - this.baseY);

            if (distHandle < 75 || distJhula < 190) {
                this.isDragging = true;
                this.lastActiveTime = performance.now();
                if (this.isReachingForRope) {
                    this.setReachingState(false);
                }
                if (window.templeAudio) {
                    window.templeAudio.playRopeTension();
                }
                if (e.cancelable) e.preventDefault();
            }
        };

        const onMove = (e) => {
            if (!this.isDragging) return;
            const pos = getPos(e);
            const deltaY = pos.y - this.dragStartY;
            this.dragVelY = pos.y - this.lastDragY;
            this.lastDragY = pos.y;

            // Follow hand with rope handle (capped so it never touches bottom dock)
            const maxDragY = this.height - 120;
            this.ropeHandleX = Math.max(this.width * 0.35, Math.min(this.width - 25, pos.x));
            this.ropeHandleY = Math.max(this.ropeAnchorY + 45, Math.min(maxDragY, pos.y));

            // Pulling downwards brings the jhula forward (positive phi)
            // Enhanced tactile sensitivity: tracks finger smoothly and generously
            const targetPhi = this.dragStartPhi + (deltaY / 170);
            this.phi = Math.max(-0.55, Math.min(0.62, targetPhi));
            this.omega = 0; // Hold steady while dragging
            this.lastActiveTime = performance.now();

            if (e.cancelable) e.preventDefault();
        };

        const onEnd = () => {
            if (this.isDragging) {
                this.isDragging = false;
                // Impart velocity from release fling
                const impulse = (this.dragVelY / 95);
                this.omega += impulse;

                // Natural gravitational pull sends it backward if released from forward position
                if (Math.abs(this.phi) > 0.05 && Math.abs(this.omega) < 0.3) {
                    this.omega -= Math.sign(this.phi) * 0.72;
                }

                if (window.templeAudio) {
                    window.templeAudio.playGhungroo();
                }
                this.lastActiveTime = performance.now();
            }
        };

        // Window-level events so dragging doesn't drop when finger moves fast
        this.canvas.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove, { passive: false });
        window.addEventListener('mouseup', onEnd);

        this.canvas.addEventListener('touchstart', onStart, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
    }

    nudge(amount = 0.55) {
        this.omega += amount;
        this.lastActiveTime = performance.now();
        if (this.isReachingForRope) {
            this.setReachingState(false);
        }
        if (window.templeAudio) {
            window.templeAudio.playRopeTension();
            window.templeAudio.playGhungroo();
        }
    }

    setReachingState(state) {
        if (this.isReachingForRope !== state) {
            this.isReachingForRope = state;
            this.onReachRopeState(state);
        }
    }

    setHappyState(state) {
        if (this.isHappy !== state) {
            this.isHappy = state;
            this.onHappyState(state);
            if (state && window.templeAudio) {
                window.templeAudio.playBalGopalGiggle();
            }
        }
    }

    toggleAutoRock() {
        this.autoRock = !this.autoRock;
        if (this.autoRock) {
            this.nudge(0.4);
        }
        return this.autoRock;
    }

    update(dt) {
        // Clamp dt to avoid tunneling
        const delta = Math.min(dt, 0.04);

        if (!this.isDragging) {
            // Front-to-back pendulum equation:
            // d²phi/dt² = - (omega_0²) * sin(phi) - damping * dphi/dt
            const acc = - Math.pow(this.naturalFreq, 2) * Math.sin(this.phi) - (this.damping * 48 * this.omega);
            this.omega += acc * delta;
            this.phi += this.omega * delta;

            // Auto-rock resonant pulse when requested
            if (this.autoRock) {
                if (Math.abs(this.phi) < 0.12 && Math.abs(this.omega) < 0.6) {
                    this.omega += (this.omega >= 0 ? 0.032 : -0.032);
                }
            }

            // Clean rest condition if motion is imperceptible
            if (Math.abs(this.phi) < 0.0025 && Math.abs(this.omega) < 0.0025 && !this.autoRock) {
                this.phi = 0;
                this.omega = 0;
            }
        }

        // Update anchor and smooth rope position
        this.updateRopeAnchor();
        this.resetRopeHandlePosition();

        // 3D Perspective Calculations
        const { scale, y, pitchTiltDeg } = this.calculateSwingPosition();

        // Emotional state checks
        const motionMagnitude = Math.abs(this.omega) + Math.abs(this.phi);
        if (motionMagnitude > 0.26) {
            this.setHappyState(true);
            this.setReachingState(false);
            this.lastActiveTime = performance.now();
        } else {
            this.setHappyState(false);

            // If idle for more than 3 seconds and swing is almost still, Bal Gopal reaches for the rope!
            const idleDuration = (performance.now() - this.lastActiveTime) / 1000;
            if (idleDuration > 3.0 && motionMagnitude < 0.06 && !this.isDragging) {
                this.setReachingState(true);
            }
        }

        // Broadcast to app
        this.onSwingUpdate({
            phi: this.phi,
            scale: scale,
            y: y,
            pitchTiltDeg: pitchTiltDeg,
            ropeHandleX: this.ropeHandleX,
            ropeHandleY: this.ropeHandleY,
            isHappy: this.isHappy,
            isReaching: this.isReachingForRope
        });
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Front-to-Back 3D Hanging Golden Chains
        this.draw3DSuspensionChains();

        // 2. Draw Interactive Ceremonial Silk Dori (Rope)
        this.drawCeremonialDori();
    }

    draw3DSuspensionChains() {
        // Ceiling anchor points in the arch
        const ceilingY = 48;
        const chainSpreadTop = Math.min(185, this.width * 0.44);
        const leftTopX = this.centerX - chainSpreadTop;
        const rightTopX = this.centerX + chainSpreadTop;

        // Bottom seat chain attachment points
        const swingHalfWidth = Math.min(160, this.width * 0.36);
        const { scale, y } = this.calculateSwingPosition();

        const leftSeatX = this.centerX - (swingHalfWidth * scale);
        const rightSeatX = this.centerX + (swingHalfWidth * scale);
        const seatChainY = y - (35 * scale);

        // Draw left and right floral-wrapped golden chains
        this.drawSingleChain(leftTopX, ceilingY, leftSeatX, seatChainY, scale);
        this.drawSingleChain(rightTopX, ceilingY, rightSeatX, seatChainY, scale);
    }

    drawSingleChain(x1, y1, x2, y2, scale) {
        const dist = Math.hypot(x2 - x1, y2 - y1);
        const links = Math.max(18, Math.round(dist / 19));
        const dx = (x2 - x1) / links;
        const dy = (y2 - y1) / links;

        // Top Brass Ceiling Bracket
        this.ctx.save();
        this.ctx.fillStyle = '#ffb300';
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.beginPath();
        this.ctx.arc(x1, y1, 6.5 * scale, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        for (let i = 0; i < links; i++) {
            const lx = x1 + dx * i;
            const ly = y1 + dy * i;
            const linkAngle = Math.atan2(dy, dx) + (i % 2 === 0 ? 0.32 : -0.32);

            this.ctx.save();
            this.ctx.translate(lx + dx * 0.5, ly + dy * 0.5);
            this.ctx.rotate(linkAngle);

            // Chain link shadow
            this.ctx.strokeStyle = 'rgba(40, 20, 5, 0.45)';
            this.ctx.lineWidth = 3.6 * scale;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 8.5 * scale, 4.2 * scale, 0, 0, Math.PI * 2);
            this.ctx.stroke();

            // Golden metallic sheen
            const grad = this.ctx.createLinearGradient(-6, -3, 6, 3);
            grad.addColorStop(0, '#fffde7');
            grad.addColorStop(0.35, '#ffd54f');
            grad.addColorStop(0.7, '#ffb300');
            grad.addColorStop(1, '#e65100');
            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = 3.0 * scale;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 7.5 * scale, 3.8 * scale, 0, 0, Math.PI * 2);
            this.ctx.stroke();

            // Marigold (Genda) & Jasmine (Mogra) flower garland wrapped around chain every 3 links
            if (i % 3 === 1) {
                this.ctx.fillStyle = (i % 2 === 0) ? '#ff6f00' : '#ffa000';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 6.8 * scale, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(3 * scale, -2 * scale, 3.0 * scale, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        }
    }

    drawCeremonialDori() {
        const startX = this.ropeAnchorX;
        const startY = this.ropeAnchorY;
        const endX = this.ropeHandleX;
        const endY = this.ropeHandleY;

        // Natural catenary curve: more curve when slack, straighter when pulled taut
        const dist = Math.hypot(endX - startX, endY - startY);
        const sag = Math.max(12, 65 - (dist * 0.18));
        const midX = (startX + endX) / 2 + 10;
        const midY = (startY + endY) / 2 + sag;

        // Soft drop shadow on temple background
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        this.ctx.lineWidth = 7;
        this.ctx.beginPath();
        this.ctx.moveTo(startX + 4, startY + 5);
        this.ctx.quadraticCurveTo(midX + 4, midY + 5, endX + 4, endY + 5);
        this.ctx.stroke();
        this.ctx.restore();

        // Thick Crimson & Golden Silk Twisted Ceremonial Dori
        this.ctx.save();
        this.ctx.lineCap = 'round';

        // Deep Maroon/Crimson Silk core
        this.ctx.strokeStyle = '#b71c1c';
        this.ctx.lineWidth = 6.5;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.quadraticCurveTo(midX, midY, endX, endY);
        this.ctx.stroke();

        // Golden thread spiral winding
        this.ctx.setLineDash([7, 7]);
        this.ctx.strokeStyle = '#ffe082';
        this.ctx.lineWidth = 4.0;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.quadraticCurveTo(midX, midY, endX, endY);
        this.ctx.stroke();
        this.ctx.restore();

        // Beautiful Golden Tassel & Pull Ring Handle
        this.drawTasselHandle(endX, endY);
    }

    drawTasselHandle(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);

        // Radiant pulsing glow when idle to invite user to pull
        if (!this.isDragging) {
            const pulse = 0.5 + Math.sin(performance.now() * 0.005) * 0.35;
            this.ctx.shadowColor = '#ffd700';
            this.ctx.shadowBlur = 16 * pulse;
        }

        // Golden Brass Grip Ring
        const ringGrad = this.ctx.createRadialGradient(0, 0, 9, 0, 0, 18);
        ringGrad.addColorStop(0, '#fffde7');
        ringGrad.addColorStop(0.4, '#ffd54f');
        ringGrad.addColorStop(0.85, '#ff8f00');
        ringGrad.addColorStop(1, '#b27b00');
        this.ctx.fillStyle = ringGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 16, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#21100b';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Velvet Bell Tassel Cap
        this.ctx.fillStyle = '#b71c1c';
        this.ctx.beginPath();
        this.ctx.moveTo(-11, 12);
        this.ctx.lineTo(11, 12);
        this.ctx.lineTo(8, 26);
        this.ctx.lineTo(-8, 26);
        this.ctx.closePath();
        this.ctx.fill();

        // Golden Tassel Collar
        this.ctx.fillStyle = '#ffd54f';
        this.ctx.fillRect(-10, 24, 20, 3.5);

        // Silk Tassel Fringe with natural sway
        const tasselCount = 11;
        this.ctx.lineWidth = 1.8;
        for (let i = 0; i < tasselCount; i++) {
            const tx = -8.5 + (i * 1.7);
            const sway = Math.sin(performance.now() * 0.006 + i * 0.7) * 3;
            this.ctx.strokeStyle = (i % 2 === 0) ? '#ffd54f' : '#d32f2f';
            this.ctx.beginPath();
            this.ctx.moveTo(tx, 28);
            this.ctx.lineTo(tx + sway, 52);
            this.ctx.stroke();
        }

        // Elegant Devotional Prompt
        if (!this.isDragging) {
            this.ctx.fillStyle = '#fff9c4';
            this.ctx.font = '700 12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0,0,0,0.95)';
            this.ctx.shadowBlur = 8;
            this.ctx.fillText('डोरी खींचें • PULL', 0, -22);
        }

        this.ctx.restore();
    }
}

window.JhulaPhysics = JhulaPhysics;
