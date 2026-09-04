/**
 * Divine Krishna Temple Audio Synthesizer
 * 100% offline & self-contained Web Audio API engine.
 * Realistic brass bells, shankh, ghungroo, sweet bansuri, and Bal Gopal's joyful giggle sound.
 */

class TempleAudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isFlutePlaying = false;
        this.fluteInterval = null;
        this.masterVolume = null;
        this.lastGiggleTime = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterVolume = this.ctx.createGain();
            this.masterVolume.gain.setValueAtTime(0.85, this.ctx.currentTime);
            this.masterVolume.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterVolume) {
            this.masterVolume.gain.setTargetAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime, 0.05);
        }
        return this.isMuted;
    }

    /**
     * Bal Gopal's Joyful Divine Giggle / Kilkari
     * Sweet, melodic, baby chuckle tones when swinging happily
     */
    playBalGopalGiggle() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        if (now - this.lastGiggleTime < 4.0) return; // Don't repeat too frequently
        this.lastGiggleTime = now;

        // Sequence of gentle rising, bubbling baby giggles (musical pitch syllables)
        const gigglePitches = [
            { freq: 620, time: 0.00, dur: 0.12 },
            { freq: 780, time: 0.10, dur: 0.14 },
            { freq: 940, time: 0.22, dur: 0.16 },
            { freq: 880, time: 0.38, dur: 0.13 },
            { freq: 1050, time: 0.50, dur: 0.22 }
        ];

        gigglePitches.forEach(g => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + g.time;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(g.freq * 0.9, t);
            osc.frequency.exponentialRampToValueAtTime(g.freq * 1.15, t + g.dur * 0.5);
            osc.frequency.exponentialRampToValueAtTime(g.freq, t + g.dur);

            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + g.dur);

            osc.connect(gain);
            gain.connect(this.masterVolume);

            osc.start(t);
            osc.stop(t + g.dur + 0.05);
        });

        // Soft accompanying chime of ankle ghungroo
        this.playGhungroo(0.2);
    }

    /**
     * Temple Brass Bell (Ghanti) Synthesizer
     * Physical acoustic modes of authentic temple bell
     */
    playBell(frequency = 587.33, intensity = 1.0) {
        this.init();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        const partials = [
            { ratio: 0.5, gain: 0.35, decay: 3.5 },
            { ratio: 1.0, gain: 1.0, decay: 2.8 },
            { ratio: 1.183, gain: 0.65, decay: 2.2 },
            { ratio: 1.506, gain: 0.55, decay: 1.8 },
            { ratio: 2.0, gain: 0.75, decay: 1.5 },
            { ratio: 2.74, gain: 0.35, decay: 1.0 },
            { ratio: 3.85, gain: 0.25, decay: 0.6 },
            { ratio: 5.2, gain: 0.12, decay: 0.3 }
        ];

        const bellGain = this.ctx.createGain();
        bellGain.gain.setValueAtTime(0.38 * intensity, now);
        bellGain.connect(this.masterVolume);

        partials.forEach(p => {
            const osc = this.ctx.createOscillator();
            const pGain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency * p.ratio, now);

            pGain.gain.setValueAtTime(0, now);
            pGain.gain.linearRampToValueAtTime(p.gain, now + 0.003);
            pGain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay * (0.85 + Math.random() * 0.3));

            osc.connect(pGain);
            pGain.connect(bellGain);

            osc.start(now);
            osc.stop(now + p.decay * 1.5);
        });
    }

    /**
     * Ghungroo tinkles
     */
    playGhungroo(delay = 0) {
        this.init();
        if (this.isMuted) return;
        const pitches = [1800, 2200, 2600, 3100, 3500];
        const now = this.ctx.currentTime + delay;
        const count = 3 + Math.floor(Math.random() * 3);

        for (let i = 0; i < count; i++) {
            const freq = pitches[Math.floor(Math.random() * pitches.length)];
            const timeOffset = now + i * 0.035 + (Math.random() * 0.02);

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, timeOffset);

            gain.gain.setValueAtTime(0, timeOffset);
            gain.gain.linearRampToValueAtTime(0.07, timeOffset + 0.002);
            gain.gain.exponentialRampToValueAtTime(0.0001, timeOffset + 0.25);

            osc.connect(gain);
            gain.connect(this.masterVolume);

            osc.start(timeOffset);
            osc.stop(timeOffset + 0.3);
        }
    }

    /**
     * Sacred Shankh (Conch Shell)
     */
    playShankh() {
        this.init();
        if (this.isMuted) return;

        const now = this.ctx.currentTime;
        const duration = 4.5;
        const baseFreq = 220;

        const shankhMaster = this.ctx.createGain();
        shankhMaster.gain.setValueAtTime(0.001, now);
        shankhMaster.gain.linearRampToValueAtTime(0.4, now + 1.2);
        shankhMaster.gain.setValueAtTime(0.38, now + 3.0);
        shankhMaster.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        shankhMaster.connect(this.masterVolume);

        const harmonics = [1, 2, 3, 4, 5];
        const harmonicWeights = [1.0, 0.6, 0.35, 0.2, 0.1];

        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(4.5, now);
        lfoGain.gain.setValueAtTime(4.0, now);
        lfo.connect(lfoGain);
        lfo.start(now);
        lfo.stop(now + duration);

        harmonics.forEach((h, idx) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();

            osc.type = (idx === 0) ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(baseFreq * h, now);
            osc.frequency.linearRampToValueAtTime(baseFreq * h * 1.02, now + 0.8);
            lfoGain.connect(osc.frequency);

            g.gain.setValueAtTime(harmonicWeights[idx], now);

            osc.connect(g);
            g.connect(shankhMaster);

            osc.start(now);
            osc.stop(now + duration);
        });

        // Subtle breath resonance
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, now);
        filter.Q.setValueAtTime(3.0, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.linearRampToValueAtTime(0.035, now + 1.0);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(shankhMaster);

        whiteNoise.start(now);
        whiteNoise.stop(now + duration);
    }

    /**
     * Meditative Krishna Bansuri (Bamboo Flute)
     */
    startFlute() {
        this.init();
        if (this.isFlutePlaying) return;
        this.isFlutePlaying = true;

        const scale = [
            261.63, 293.66, 329.63, 392.00, 440.00,
            523.25, 587.33, 659.25, 783.99
        ];

        const motifs = [
            [2, 3, 4, 3, 2],
            [1, 2, 4, 3, 2, 1],
            [3, 4, 5, 4, 3],
            [4, 5, 6, 5, 4, 3, 2],
            [0, 1, 2, 4, 3, 1, 0]
        ];

        let motifIdx = 0;
        let noteIdx = 0;
        let currentMotif = motifs[0];

        const playNextNote = () => {
            if (!this.isFlutePlaying) return;

            const noteDegree = currentMotif[noteIdx];
            const freq = scale[noteDegree];
            const noteDuration = 1.4 + Math.random() * 0.8;

            this.playFluteNote(freq, noteDuration);

            noteIdx++;
            if (noteIdx >= currentMotif.length) {
                noteIdx = 0;
                motifIdx = (motifIdx + 1) % motifs.length;
                currentMotif = motifs[motifIdx];
                this.fluteInterval = setTimeout(playNextNote, (noteDuration + 0.8 + Math.random() * 0.8) * 1000);
            } else {
                this.fluteInterval = setTimeout(playNextNote, (noteDuration * 0.85) * 1000);
            }
        };

        playNextNote();
    }

    stopFlute() {
        this.isFlutePlaying = false;
        if (this.fluteInterval) {
            clearTimeout(this.fluteInterval);
            this.fluteInterval = null;
        }
    }

    playFluteNote(freq, duration) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(0.16, now + 0.25);
        noteGain.gain.setValueAtTime(0.14, now + duration * 0.7);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        noteGain.connect(this.masterVolume);

        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, now);

        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, now);

        const osc2Gain = this.ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.06, now);

        const vibrato = this.ctx.createOscillator();
        const vibratoGain = this.ctx.createGain();
        vibrato.frequency.setValueAtTime(5.2, now);
        vibratoGain.gain.setValueAtTime(2.5, now);
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc1.frequency);
        vibratoGain.connect(osc2.frequency);
        vibrato.start(now);
        vibrato.stop(now + duration + 0.1);

        osc1.frequency.setValueAtTime(freq * 0.985, now);
        osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.15);

        osc1.connect(noteGain);
        osc2.connect(osc2Gain);
        osc2Gain.connect(noteGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration + 0.1);
        osc2.stop(now + duration + 0.1);
    }

    playFlowerChime() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
        freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            const t = now + idx * 0.08;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t);

            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.05, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

            osc.connect(g);
            g.connect(this.masterVolume);
            osc.start(t);
            osc.stop(t + 0.6);
        });
    }

    playRopeTension() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.025, now + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        osc.connect(g);
        g.connect(this.masterVolume);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}

window.templeAudio = new TempleAudioEngine();
