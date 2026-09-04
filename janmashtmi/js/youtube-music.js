/**
 * YouTube Devotional Music Engine for Krishna Mandir (Pure Static Client-Side)
 * - 100% Client-Side: Zero PHP or backend server required
 * - Uses official YouTube IFrame Player API for playback
 * - Persistent storage in browser localStorage
 * - Client-side title fetching via noembed / JSONP with instant offline fallback
 */

class YouTubeMusicEngine {
    constructor() {
        this.player = null;
        this.isReady = false;
        this.isPlaying = false;
        this.currentIndex = 0;
        this.volume = 90;
        this.onStateChange = null;
        this.onPlaylistUpdate = null;

        // Default verified embeddable YouTube Krishna Bhajans (Starts with Suprabha KV Nonstop Bhajan)
        this.defaultPlaylist = [
            {
                id: 'iYueDsR5-Sk',
                title: 'Nonstop Krishna Bhajan Songs (Suprabha KV)',
                author: 'Suprabha KV',
                url: 'https://www.youtube.com/watch?v=iYueDsR5-Sk',
                thumbnail: 'https://i.ytimg.com/vi/iYueDsR5-Sk/hqdefault.jpg'
            },
            {
                id: 'aWQtph9gsGs',
                title: 'श्री कृष्ण गोविन्द हरे मुरारी (Devi Chitralekha)',
                author: 'T-Series Bhakti Sagar',
                url: 'https://www.youtube.com/watch?v=aWQtph9gsGs',
                thumbnail: 'https://i.ytimg.com/vi/aWQtph9gsGs/hqdefault.jpg'
            },
            {
                id: '5-Xoh7jKVo8',
                title: 'अच्युतम केशवम कृष्ण दामोदरम (Alka Yagnik)',
                author: 'Zee Music Devotional',
                url: 'https://www.youtube.com/watch?v=5-Xoh7jKVo8',
                thumbnail: 'https://i.ytimg.com/vi/5-Xoh7jKVo8/hqdefault.jpg'
            },
            {
                id: 'qt6V53CnnOY',
                title: 'हरे कृष्ण महा मन्त्र (Hare Krishna 108 Times)',
                author: 'Rajshri Soul',
                url: 'https://www.youtube.com/watch?v=qt6V53CnnOY',
                thumbnail: 'https://i.ytimg.com/vi/qt6V53CnnOY/hqdefault.jpg'
            },
            {
                id: 'ATpdRfzNHHs',
                title: 'श्री कृष्ण बाँसुरी ध्यान (Krishna\'s Flute Meditation)',
                author: 'Sounds of Isha',
                url: 'https://www.youtube.com/watch?v=ATpdRfzNHHs',
                thumbnail: 'https://i.ytimg.com/vi/ATpdRfzNHHs/hqdefault.jpg'
            },
            {
                id: 'zRPw0M-HsYU',
                title: 'Sneh Bihari Ji Ki Aarti || Vrindavan || U.P ||',
                author: 'Adhyatm TV',
                url: 'https://www.youtube.com/watch?v=zRPw0M-HsYU',
                thumbnail: 'https://i.ytimg.com/vi/zRPw0M-HsYU/hqdefault.jpg'
            }
        ];

        this.playlist = [...this.defaultPlaylist];
        this.init();
    }

    init() {
        this.loadSavedPlaylist();
        this.loadYouTubeIframeAPI();
    }

    loadYouTubeIframeAPI() {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => {
                this.setupPlayer();
            };
        } else if (window.YT && window.YT.Player) {
            this.setupPlayer();
        }
    }

    setupPlayer() {
        const container = document.getElementById('yt-player');
        if (!container) return;

        const current = this.currentTrack();
        this.player = new YT.Player('yt-player', {
            height: '110',
            width: '180',
            videoId: current ? current.id : 'iYueDsR5-Sk',
            playerVars: {
                autoplay: 0,
                controls: 1,
                disablekb: 0,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                rel: 0,
                playsinline: 1
            },
            events: {
                onReady: (event) => {
                    this.isReady = true;
                    this.player.setVolume(this.volume);
                    this.notifyState();
                },
                onStateChange: (event) => {
                    if (event.data === YT.PlayerState.PLAYING) {
                        this.isPlaying = true;
                        if (window.templeAudio) window.templeAudio.stopFlute();
                    } else if (event.data === YT.PlayerState.PAUSED) {
                        this.isPlaying = false;
                    } else if (event.data === YT.PlayerState.ENDED) {
                        this.next();
                    }
                    this.notifyState();
                },
                onError: (event) => {
                    console.warn('YouTube playback notice code:', event.data);
                    // Automatically move to the next valid video in the playlist
                    setTimeout(() => {
                        this.next();
                    }, 1200);
                }
            }
        });
    }

    currentTrack() {
        return this.playlist[this.currentIndex] || this.playlist[0];
    }

    loadSavedPlaylist() {
        try {
            const saved = JSON.parse(localStorage.getItem('krishna_mandir_playlist') || '[]');
            if (Array.isArray(saved) && saved.length > 0) {
                // Merge with default list to preserve new defaults
                const list = [...saved];
                this.defaultPlaylist.forEach(def => {
                    if (!list.some(p => p.id === def.id)) {
                        list.push(def);
                    }
                });
                this.playlist = list;
            } else {
                this.playlist = [...this.defaultPlaylist];
            }
        } catch (e) {
            this.playlist = [...this.defaultPlaylist];
        }

        // Ensure Suprabha KV Nonstop Bhajan is ALWAYS the first track to start
        const favIdx = this.playlist.findIndex(p => p.id === 'iYueDsR5-Sk');
        if (favIdx > 0) {
            const [fav] = this.playlist.splice(favIdx, 1);
            this.playlist.unshift(fav);
        }

        if (this.onPlaylistUpdate) {
            this.onPlaylistUpdate(this.playlist);
        }
        this.notifyState();
    }

    savePlaylist() {
        try {
            localStorage.setItem('krishna_mandir_playlist', JSON.stringify(this.playlist));
        } catch (e) {
            console.warn('Could not save to localStorage', e);
        }
    }

    startMusicOnEnter() {
        const attemptPlay = () => {
            if (this.isReady && this.player && typeof this.player.playVideo === 'function') {
                this.player.playVideo();
                this.isPlaying = true;
                this.notifyState();
                return true;
            }
            return false;
        };

        if (!attemptPlay()) {
            let tries = 0;
            const interval = setInterval(() => {
                tries++;
                if (attemptPlay() || tries > 25) {
                    clearInterval(interval);
                }
            }, 300);
        }
    }

    playTrack(index) {
        if (index < 0 || index >= this.playlist.length) index = 0;
        this.currentIndex = index;
        const track = this.playlist[this.currentIndex];

        if (this.isReady && this.player && typeof this.player.loadVideoById === 'function') {
            this.player.loadVideoById(track.id);
            this.player.playVideo();
            this.isPlaying = true;
        }
        this.notifyState();
    }

    togglePlay() {
        if (!this.isReady || !this.player) return;

        if (this.isPlaying) {
            this.player.pauseVideo();
            this.isPlaying = false;
        } else {
            this.player.playVideo();
            this.isPlaying = true;
        }
        this.notifyState();
    }

    next() {
        const nextIdx = (this.currentIndex + 1) % this.playlist.length;
        this.playTrack(nextIdx);
    }

    prev() {
        const prevIdx = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.playTrack(prevIdx);
    }

    setVolume(volPercent) {
        this.volume = Math.max(0, Math.min(100, volPercent));
        if (this.player && typeof this.player.setVolume === 'function') {
            this.player.setVolume(this.volume);
        }
    }

    extractVideoId(url) {
        if (!url) return null;
        const clean = url.trim();
        const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
        const match = clean.match(regExp);
        if (match && match[1]) return match[1];
        if (/^[\w-]{11}$/.test(clean)) return clean;
        return null;
    }

    async fetchYouTubeDetails(url) {
        const videoId = this.extractVideoId(url);
        if (!videoId) {
            throw new Error('अवैध YouTube लिंक (Invalid YouTube link)');
        }

        const standardUrl = `https://www.youtube.com/watch?v=${videoId}`;
        let title = '';
        let author = 'YouTube भक्ति';

        // Method 1: Try noembed (CORS enabled)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2200);
            const resp = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(standardUrl)}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (resp.ok) {
                const data = await resp.json();
                if (data.title) {
                    title = data.title;
                    author = data.author_name || author;
                }
            }
        } catch (e) {}

        // Method 2: Try JSONP directly from YouTube oEmbed (Works universally in all browsers, zero CORS)
        if (!title && typeof document !== 'undefined') {
            try {
                const data = await new Promise((resolve, reject) => {
                    const cb = 'yt_cb_' + Math.random().toString(36).substring(2, 9);
                    const script = document.createElement('script');
                    const timeout = setTimeout(() => {
                        cleanup();
                        reject(new Error('timeout'));
                    }, 2200);

                    function cleanup() {
                        clearTimeout(timeout);
                        delete window[cb];
                        if (script.parentNode) script.parentNode.removeChild(script);
                    }

                    window[cb] = (payload) => {
                        cleanup();
                        resolve(payload);
                    };

                    script.onerror = () => {
                        cleanup();
                        reject(new Error('script error'));
                    };

                    script.src = `https://www.youtube.com/oembed?url=${encodeURIComponent(standardUrl)}&format=json&callback=${cb}`;
                    document.head.appendChild(script);
                });

                if (data && data.title) {
                    title = data.title;
                    author = data.author_name || author;
                }
            } catch (e) {}
        }

        // Method 3: Instant clean fallback (ensures adding NEVER fails or hangs)
        if (!title) {
            title = 'श्री कृष्ण भजन (' + videoId + ')';
        }

        return {
            id: videoId,
            title: title,
            author: author,
            url: standardUrl,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        };
    }

    async addYouTubeBhajan(url, customTitle = '') {
        const videoId = this.extractVideoId(url);
        if (!videoId) {
            throw new Error('अवैध YouTube लिंक (Invalid YouTube link)');
        }

        let details = null;
        try {
            details = await this.fetchYouTubeDetails(url);
        } catch (e) {
            details = {
                id: videoId,
                title: 'श्री कृष्ण भजन (' + videoId + ')',
                author: 'YouTube भक्ति',
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            };
        }

        // Apply custom title if user typed one
        if (customTitle && customTitle.trim()) {
            details.title = customTitle.trim();
        }

        // Add or update in playlist
        const existingIdx = this.playlist.findIndex(p => p.id === details.id);
        if (existingIdx !== -1) {
            this.playlist[existingIdx] = details;
            this.playTrack(existingIdx);
        } else {
            this.playlist.push(details);
            this.playTrack(this.playlist.length - 1);
        }

        // Persist permanently in client browser
        this.savePlaylist();

        if (this.onPlaylistUpdate) {
            this.onPlaylistUpdate(this.playlist);
        }
        this.notifyState();

        return details;
    }

    notifyState() {
        if (this.onStateChange) {
            this.onStateChange({
                isPlaying: this.isPlaying,
                track: this.currentTrack(),
                index: this.currentIndex
            });
        }
    }
}

window.YouTubeMusicEngine = YouTubeMusicEngine;
window.krishnaYouTube = new YouTubeMusicEngine();
