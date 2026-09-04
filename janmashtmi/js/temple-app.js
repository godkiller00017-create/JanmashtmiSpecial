/**
 * Temple App Coordinator (Mobile-First 3D Experience)
 * - Landing screen countdown and transition into Jhula sanctum
 * - YouTube Devotional Music Engine integration with auto-title fetching
 * - Realistic Bal Krishna model rigging with 3D front-to-back pendulum dynamics
 * - Temple rituals: Pushpa Varsha, Aarti, Makhan Bhog, Shankh, Bells
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const landingScreen = document.getElementById('landing-screen');
    const btnEnter = document.getElementById('btn-enter');
    const landingCountEl = document.getElementById('landing-count');
    const physicsCanvas = document.getElementById('physics-canvas');
    const particlesCanvas = document.getElementById('particles-canvas');
    const jhulaSeat = document.getElementById('jhula-seat-container');
    const balGopal = document.getElementById('bal-gopal');
    const floorShadow = document.getElementById('floor-shadow');
    const toast = document.getElementById('temple-toast');
    const aartiThali = document.getElementById('aarti-thali');

    // YouTube Music Elements
    const trackTitleEl = document.getElementById('current-track-title');
    const btnMusicToggle = document.getElementById('music-toggle');
    const btnMusicNext = document.getElementById('music-next');
    const btnMusicPrev = document.getElementById('music-prev');
    const btnOpenModal = document.getElementById('btn-open-bhajan-modal');
    const bhajanModal = document.getElementById('bhajan-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const bhajanUrlInput = document.getElementById('bhajan-url-input');
    const bhajanTitleInput = document.getElementById('bhajan-title-input');
    const btnSaveBhajan = document.getElementById('btn-save-bhajan');
    const ytPreviewBox = document.getElementById('yt-preview-box');
    const ytPreviewThumb = document.getElementById('yt-preview-thumb');
    const ytPreviewTitle = document.getElementById('yt-preview-title');
    const ytPreviewAuthor = document.getElementById('yt-preview-author');

    // Systems
    const audio = window.templeAudio;
    const ytMusic = window.krishnaYouTube;
    const particles = new window.TempleParticles(particlesCanvas);

    let currentSwingState = { phi: 0, scale: 1, y: 350, pitchTiltDeg: 0 };
    let hasShownReachingToast = false;
    let hasEnteredTemple = false;

    // Toast Notification Helper
    function showToast(message, duration = 3000) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }

    // ==========================================================================
    // 1. LANDING SCREEN AUTO-REDIRECTION & YOUTUBE MUSIC AUTO-PLAY
    // ==========================================================================
    let countdown = 4;
    let countdownInterval = setInterval(() => {
        countdown--;
        if (landingCountEl) {
            landingCountEl.textContent = countdown;
        }
        if (countdown <= 0) {
            enterTemple();
        }
    }, 1000);

    function enterTemple() {
        if (hasEnteredTemple) return;
        hasEnteredTemple = true;
        clearInterval(countdownInterval);

        // Safe user gesture to unlock audio
        audio.init();

        // Smooth curtain fade out of landing screen
        if (landingScreen) {
            landingScreen.classList.add('fade-out');
            setTimeout(() => {
                landingScreen.style.display = 'none';
            }, 1250);
        }

        // Start YouTube devotional music
        setTimeout(() => {
            ytMusic.startMusicOnEnter();
            particles.triggerPushpaVarsha(45);
            showToast('॥ जय श्री कृष्णा • दिव्य दर्शन का आनंद लें ॥', 3500);
        }, 500);
    }

    if (btnEnter) {
        btnEnter.addEventListener('click', enterTemple);
    }
    if (landingScreen) {
        landingScreen.addEventListener('click', (e) => {
            enterTemple();
        });
    }

    // ==========================================================================
    // 2. YOUTUBE DEVOTIONAL MUSIC PLAYER
    // ==========================================================================
    ytMusic.onStateChange = (state) => {
        if (trackTitleEl && state.track) {
            trackTitleEl.textContent = state.track.title;
            trackTitleEl.title = state.track.title;
        }
        if (btnMusicToggle) {
            btnMusicToggle.textContent = state.isPlaying ? '⏸' : '▶';
        }
        const dockMusicBtn = document.getElementById('btn-music');
        if (dockMusicBtn) {
            dockMusicBtn.classList.toggle('active', state.isPlaying);
        }
        const disc = document.getElementById('np-disc');
        if (disc) {
            disc.classList.toggle('spinning', !!state.isPlaying);
        }
    };

    if (btnMusicToggle) {
        btnMusicToggle.addEventListener('click', () => {
            audio.init();
            ytMusic.togglePlay();
        });
    }
    if (btnMusicNext) {
        btnMusicNext.addEventListener('click', () => {
            audio.init();
            ytMusic.next();
        });
    }
    if (btnMusicPrev) {
        btnMusicPrev.addEventListener('click', () => {
            audio.init();
            ytMusic.prev();
        });
    }

    // Modal: Open & Close
    if (btnOpenModal) {
        btnOpenModal.addEventListener('click', (e) => {
            e.stopPropagation();
            bhajanModal.classList.add('show');
            if (bhajanUrlInput) bhajanUrlInput.focus();
        });
    }
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            bhajanModal.classList.remove('show');
        });
    }
    if (bhajanModal) {
        bhajanModal.addEventListener('click', (e) => {
            if (e.target === bhajanModal) {
                bhajanModal.classList.remove('show');
            }
        });
    }

    // Live Auto Title Fetching on URL Input
    let previewDebounce = null;
    if (bhajanUrlInput) {
        bhajanUrlInput.addEventListener('input', () => {
            clearTimeout(previewDebounce);
            const url = bhajanUrlInput.value.trim();
            const videoId = ytMusic.extractVideoId(url);

            if (videoId) {
                if (ytPreviewBox) ytPreviewBox.style.display = 'flex';
                if (ytPreviewThumb) ytPreviewThumb.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                if (ytPreviewTitle) ytPreviewTitle.textContent = 'शीर्षक प्राप्त किया जा रहा है...';

                previewDebounce = setTimeout(async () => {
                    try {
                        const details = await ytMusic.fetchYouTubeDetails(url);
                        if (ytPreviewTitle) ytPreviewTitle.textContent = details.title;
                        if (ytPreviewAuthor) ytPreviewAuthor.textContent = details.author;
                        // Auto-populate title input if empty
                        if (bhajanTitleInput && !bhajanTitleInput.value.trim()) {
                            bhajanTitleInput.value = details.title;
                        }
                    } catch (err) {
                        if (ytPreviewTitle) ytPreviewTitle.textContent = 'YouTube Bhajan (' + videoId + ')';
                    }
                }, 300);
            } else {
                if (ytPreviewBox) ytPreviewBox.style.display = 'none';
            }
        });
    }

    // Preset chips in modal
    document.querySelectorAll('.preset-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const url = chip.getAttribute('data-url');
            if (bhajanUrlInput) {
                bhajanUrlInput.value = url;
                if (bhajanTitleInput) bhajanTitleInput.value = '';
                bhajanUrlInput.dispatchEvent(new Event('input'));
            }
        });
    });

    // Save & Play YouTube Bhajan (100% Client-side, Zero-PHP)
    if (btnSaveBhajan) {
        btnSaveBhajan.addEventListener('click', async () => {
            const url = bhajanUrlInput.value.trim();
            if (!url) {
                alert('कृपया YouTube लिंक दर्ज करें (Please enter a YouTube link)');
                return;
            }

            btnSaveBhajan.textContent = '⏳ भजन लोड हो रहा है...';
            btnSaveBhajan.disabled = true;

            try {
                const customTitle = bhajanTitleInput ? bhajanTitleInput.value.trim() : '';
                const details = await ytMusic.addYouTubeBhajan(url, customTitle);
                bhajanModal.classList.remove('show');
                bhajanUrlInput.value = '';
                if (bhajanTitleInput) bhajanTitleInput.value = '';
                if (ytPreviewBox) ytPreviewBox.style.display = 'none';

                showToast(`🎶 "${details.title}" प्ले हो रहा है! 🎶`, 4500);
            } catch (err) {
                alert('त्रुटि: ' + (err.message || 'YouTube लिंक लोड नहीं हो सका'));
            } finally {
                btnSaveBhajan.textContent = '💾 सहेजें और चलाएं (Save & Play)';
                btnSaveBhajan.disabled = false;
            }
        });
    }

    // ==========================================================================
    // 3. 3D JHULA PHYSICS & REALISTIC BAL KRISHNA RIG
    // ==========================================================================
    const physics = new window.JhulaPhysics(physicsCanvas, {
        onSwingUpdate: (state) => {
            currentSwingState = state;

            // Update DOM Jhula Seat 3D transform
            const containerTop = state.y - 265;
            jhulaSeat.style.transform = `translate3d(0, ${containerTop}px, 0) scale(${state.scale}) rotateX(${state.pitchTiltDeg}deg)`;

            // Update 3D Perspective Floor Shadow
            if (floorShadow) {
                const shadowScale = state.scale * (1.0 + Math.sin(state.phi) * 0.3);
                const shadowOpacity = Math.max(0.2, Math.min(0.85, 0.45 + Math.sin(state.phi) * 0.35));
                floorShadow.style.transform = `scale(${shadowScale})`;
                floorShadow.style.opacity = shadowOpacity;
            }
        },

        onHappyState: (isHappy) => {
            if (balGopal) {
                balGopal.classList.toggle('is-happy', isHappy);
            }
        },

        onReachRopeState: (isReaching) => {
            if (balGopal) {
                balGopal.classList.toggle('is-reaching', isReaching);
                if (isReaching && !hasShownReachingToast && hasEnteredTemple) {
                    hasShownReachingToast = true;
                    showToast('🦚 कन्हैया डोरी पकड़ रहे हैं! कृपया झूला झुलाएं 🦚', 4000);
                }
            }
        }
    });

    // Main Animation Loop
    let lastTime = performance.now();
    function animate(currentTime) {
        const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
        lastTime = currentTime;

        // Physics step & render 3D chains + ceremonial dori
        physics.update(dt);
        physics.render();

        // Soft incense smoke curls from temple sanctum burners
        if (Math.random() < 0.22) {
            particles.addSmoke(40, window.innerHeight - 80);
            particles.addSmoke(window.innerWidth - 40, window.innerHeight - 80);
        }

        // Particle update & render
        particles.updateAndRender(dt, window.innerWidth / 2, currentSwingState.y);

        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    // ==========================================================================
    // 4. TEMPLE RITUALS (SEVA)
    // ==========================================================================
    // Hanging Brass Bells
    const bellPitches = [523.25, 587.33, 659.25, 783.99];
    document.querySelectorAll('.bell-group').forEach((bell, idx) => {
        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            bell.classList.remove('bell-ringing');
            void bell.offsetWidth;
            bell.classList.add('bell-ringing');
            const pitch = bellPitches[idx % bellPitches.length];
            audio.playBell(pitch, 1.25);
            particles.triggerPushpaVarsha(14);
        });
    });

    // Flower Shower (Pushpa Varsha)
    const flowerBtn = document.getElementById('btn-flower');
    flowerBtn.addEventListener('click', () => {
        audio.playFlowerChime();
        particles.triggerPushpaVarsha(75);
        showToast('🌸 ॥ श्री कृष्णाय नमः • पुष्प वर्षा ॥ 🌸');
    });

    // Makhan Bhog Offering
    const bhogBtn = document.getElementById('btn-bhog');
    bhogBtn.addEventListener('click', () => {
        audio.playGhungroo();
        audio.playBell(659.25, 1.0);
        particles.triggerPushpaVarsha(35);
        showToast('🍯 ॥ माखन-मिश्री भोग अर्पणम् • जय कन्हैया लाल की ॥ 🍯', 3500);

        const aura = document.querySelector('.divine-aura');
        if (aura) {
            aura.style.transform = 'scale(1.4)';
            aura.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 215, 0, 0.65) 45%, rgba(255, 111, 0, 0) 80%)';
            setTimeout(() => {
                aura.style.transform = '';
                aura.style.background = '';
            }, 1200);
        }
    });

    // Sacred Shankh Naad
    const shankhBtn = document.getElementById('btn-shankh');
    shankhBtn.addEventListener('click', () => {
        audio.playShankh();
        showToast('🐚 ॥ ॐ शंखनाद • मङ्गल ध्वनि ॥ 🐚', 4000);
        document.body.style.transform = 'scale(1.005)';
        setTimeout(() => { document.body.style.transform = ''; }, 300);
    });

    // Interactive Aarti Mode
    const aartiBtn = document.getElementById('btn-aarti');
    let isAartiActive = false;
    let isDraggingThali = false;
    let aartiAngleAccumulator = 0;
    let lastThaliAngle = null;

    aartiBtn.addEventListener('click', () => {
        isAartiActive = !isAartiActive;
        aartiBtn.classList.toggle('active', isAartiActive);
        if (isAartiActive) {
            aartiThali.style.display = 'block';
            aartiThali.style.left = `${window.innerWidth / 2}px`;
            aartiThali.style.top = `${window.innerHeight * 0.7}px`;
            showToast('🪔 थाली को कन्हैया के चारों ओर घुमाकर आरती करें 🪔', 4000);
            audio.playBell(587.33, 0.9);
        } else {
            aartiThali.style.display = 'none';
        }
    });

    const startThaliDrag = (e) => {
        if (!isAartiActive) return;
        isDraggingThali = true;
        if (e.cancelable) e.preventDefault();
    };

    const moveThaliDrag = (e) => {
        if (!isDraggingThali || !isAartiActive) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        aartiThali.style.left = `${clientX}px`;
        aartiThali.style.top = `${clientY}px`;

        const dx = clientX - (window.innerWidth / 2);
        const dy = clientY - (currentSwingState.y - 80);
        const currentAngle = Math.atan2(dy, dx);

        if (lastThaliAngle !== null) {
            let diff = currentAngle - lastThaliAngle;
            if (diff > Math.PI) diff -= Math.PI * 2;
            if (diff < -Math.PI) diff += Math.PI * 2;
            aartiAngleAccumulator += Math.abs(diff);

            if (aartiAngleAccumulator > Math.PI * 1.5) {
                aartiAngleAccumulator = 0;
                audio.playBell(783.99, 0.8);
                particles.triggerPushpaVarsha(16);
            }
        }
        lastThaliAngle = currentAngle;

        if (Math.random() < 0.6) {
            particles.addDivineSparkle(clientX, clientY, 20);
        }
    };

    const endThaliDrag = () => {
        isDraggingThali = false;
        lastThaliAngle = null;
    };

    aartiThali.addEventListener('mousedown', startThaliDrag);
    window.addEventListener('mousemove', moveThaliDrag);
    window.addEventListener('mouseup', endThaliDrag);

    aartiThali.addEventListener('touchstart', startThaliDrag, { passive: false });
    window.addEventListener('touchmove', moveThaliDrag, { passive: false });
    window.addEventListener('touchend', endThaliDrag);

    // Auto-Swing Toggle
    const autoBtn = document.getElementById('btn-auto-swing');
    autoBtn.addEventListener('click', () => {
        const isAuto = physics.toggleAutoRock();
        autoBtn.classList.toggle('active', isAuto);
        if (isAuto) {
            showToast('🌿 मंद-मंद झूलना सक्रिय (Continuous Gentle Swing) 🌿');
        } else {
            showToast('हस्त-चालित झूला (Pull Rope Mode)');
        }
    });

    // Day / Midnight Janmashtami Darshan Toggle
    const darshanBtn = document.getElementById('btn-darshan');
    let isNightMode = false;
    darshanBtn.addEventListener('click', () => {
        isNightMode = !isNightMode;
        document.body.classList.toggle('night-mode', isNightMode);
        darshanBtn.classList.toggle('active', isNightMode);
        if (isNightMode) {
            showToast('✨ भाद्रपद अष्टमी • मध्यरात्रि जन्मोत्सव दर्शन ✨', 4000);
            darshanBtn.innerHTML = '<span class="btn-icon">☀️</span><span>दिन दर्शन</span>';
        } else {
            showToast('🌅 प्रातः काल मंगला दर्शन 🌅', 3000);
            darshanBtn.innerHTML = '<span class="btn-icon">🌙</span><span>जन्माष्टमी</span>';
        }
    });

    // Music Toggle Button in Bottom Dock
    const dockMusicBtn = document.getElementById('btn-music');
    if (dockMusicBtn) {
        dockMusicBtn.addEventListener('click', () => {
            audio.init();
            ytMusic.togglePlay();
        });
    }

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === ' ') {
            physics.nudge(0.5);
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            physics.nudge(0.5);
        } else if (e.key === 'ArrowUp') {
            physics.nudge(-0.5);
        } else if (e.key.toLowerCase() === 'f') {
            flowerBtn.click();
        } else if (e.key.toLowerCase() === 'b') {
            const bells = document.querySelectorAll('.bell-group');
            if (bells.length) bells[0].click();
        } else if (e.key.toLowerCase() === 's') {
            shankhBtn.click();
        } else if (e.key.toLowerCase() === 'a') {
            aartiBtn.click();
        } else if (e.key.toLowerCase() === 'm') {
            ytMusic.togglePlay();
        }
    });
});
