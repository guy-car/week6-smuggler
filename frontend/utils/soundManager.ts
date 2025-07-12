import { Audio } from 'expo-av';
import { Platform } from 'react-native';

class SoundManager {
    private static instance: SoundManager;
    private sounds: Map<string, Audio.Sound> = new Map();
    private backgroundMusic: Audio.Sound | null = null;
    private initialized: boolean = false;
    private musicVolume: number = 0.5; // Default music volume
    private effectsVolume: number = 1.0; // Default effects volume
    private hasUserInteraction: boolean = false;
    private currentGameEndSound: Audio.Sound | null = null;
    private webInteractionHandler: (() => void) | null = null;

    private constructor() {
        // Set up web interaction handler immediately for the entire lifecycle
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            this.setupWebAutoplayHandler();
        }
    }

    static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private setupWebAutoplayHandler() {
        if (this.webInteractionHandler) {
            // Remove existing listeners before setting up new ones
            document.removeEventListener('click', this.webInteractionHandler);
            document.removeEventListener('touchstart', this.webInteractionHandler);
            document.removeEventListener('keydown', this.webInteractionHandler);
        }

        this.webInteractionHandler = () => {
            if (!this.hasUserInteraction) {
                this.hasUserInteraction = true;
                this.playBackgroundMusic().catch(error => {
                    console.warn('Failed to play background music after interaction:', error);
                });
            }
        };

        document.addEventListener('click', this.webInteractionHandler);
        document.addEventListener('touchstart', this.webInteractionHandler);
        document.addEventListener('keydown', this.webInteractionHandler);
    }

    async initialize() {
        if (this.initialized) return;

        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
            });

            // Preload all sounds
            const clickSound = await Audio.Sound.createAsync(
                require('../assets/sound-FX/click_1.mp3'),
                { shouldPlay: false, volume: this.effectsVolume, isLooping: false },
                (status) => {
                    if (status.isLoaded) {
                        // Click sound loaded successfully
                    }
                },
                true // Download first
            );
            this.sounds.set('click', clickSound.sound);

            const sendSound = await Audio.Sound.createAsync(
                require('../assets/sound-FX/send_button_v1.mp3'),
                { shouldPlay: false, volume: this.effectsVolume, isLooping: false },
                (status) => {
                    if (status.isLoaded) {
                        // Send sound loaded successfully
                    }
                },
                true // Download first
            );
            this.sounds.set('send', sendSound.sound);

            // Load game end sounds
            const aiWinsGameSound = await Audio.Sound.createAsync(
                require('../assets/sound-FX/ai-wins-game.mp3'),
                { shouldPlay: false, volume: this.effectsVolume, isLooping: false },
                (status) => {
                    if (status.isLoaded) {
                        // AI wins game sound loaded successfully
                    }
                },
                true
            );
            this.sounds.set('ai-wins-game', aiWinsGameSound.sound);

            const humansWinGameSound = await Audio.Sound.createAsync(
                require('../assets/sound-FX/humans-win-game.mp3'),
                { shouldPlay: false, volume: this.effectsVolume, isLooping: false },
                (status) => {
                    if (status.isLoaded) {
                        // Humans win game sound loaded successfully
                    }
                },
                true
            );
            this.sounds.set('humans-win-game', humansWinGameSound.sound);

            // Load round end sounds
            const aiWinsRoundSound = await Audio.Sound.createAsync(
                require('../assets/sound-FX/ai-wins-round.mp3'),
                { shouldPlay: false, volume: this.effectsVolume, isLooping: false },
                (status) => {
                    if (status.isLoaded) {
                        // AI wins round sound loaded successfully
                    }
                },
                true
            );
            this.sounds.set('ai-wins-round', aiWinsRoundSound.sound);

            const humansWinRoundSound = await Audio.Sound.createAsync(
                require('../assets/sound-FX/humans-win-round.mp3'),
                { shouldPlay: false, volume: this.effectsVolume, isLooping: false },
                (status) => {
                    if (status.isLoaded) {
                        // Humans win round sound loaded successfully
                    }
                },
                true
            );
            this.sounds.set('humans-win-round', humansWinRoundSound.sound);

            // Load background music
            const bgMusic = await Audio.Sound.createAsync(
                require('../assets/sound-FX/lobby-sound.mp3'),
                {
                    shouldPlay: false,
                    volume: this.musicVolume,
                    isLooping: true,
                    progressUpdateIntervalMillis: 1000,
                },
                (status) => {
                    if (status.isLoaded) {
                        // Background music loaded successfully
                    }
                },
                true // Download first
            );
            this.backgroundMusic = bgMusic.sound;

            this.initialized = true;

            // On native platforms, start playing immediately
            if (Platform.OS !== 'web') {
                await this.playBackgroundMusic();
            }
            // On web, we already set up the interaction handler in constructor
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    async playBackgroundMusic() {
        if (!this.backgroundMusic) return;

        // On web, check for user interaction
        if (Platform.OS === 'web' && !this.hasUserInteraction) {
            return;
        }

        try {
            const status = await this.backgroundMusic.getStatusAsync();
            if (status.isLoaded) {
                if (!status.isPlaying) {
                    await this.backgroundMusic.setVolumeAsync(this.musicVolume);
                    await this.backgroundMusic.playAsync();
                }
            }
        } catch (error) {
            if (Platform.OS === 'web' && !this.hasUserInteraction) {
                // Browser requires user interaction before playing audio
            } else {
                console.error('Error playing background music:', error);
            }
        }
    }

    async stopBackgroundMusic() {
        if (!this.backgroundMusic) return;
        try {
            const status = await this.backgroundMusic.getStatusAsync();
            if (status.isLoaded && status.isPlaying) {
                await this.backgroundMusic.stopAsync();
            }
        } catch (error) {
            console.error('Error stopping background music:', error);
        }
    }

    async pauseBackgroundMusic() {
        if (!this.backgroundMusic) return;
        try {
            const status = await this.backgroundMusic.getStatusAsync();
            if (status.isLoaded && status.isPlaying) {
                await this.backgroundMusic.pauseAsync();
            }
        } catch (error) {
            console.error('Error pausing background music:', error);
        }
    }

    async duckBackgroundMusic() {
        if (!this.backgroundMusic) return;
        try {
            await this.backgroundMusic.setVolumeAsync(this.musicVolume * 0.6); // Reduce volume to 30%
            setTimeout(async () => {
                if (this.backgroundMusic) {
                    await this.backgroundMusic.setVolumeAsync(this.musicVolume);
                }
            }, 100); // Restore volume after 500ms
        } catch (error) {
            console.error('Error ducking background music:', error);
        }
    }

    playClick() {
        const sound = this.sounds.get('click');
        if (sound) {
            try {
                this.duckBackgroundMusic();
                sound.replayAsync();
            } catch (error) {
                console.error('Error playing click sound:', error);
            }
        } else {
            console.warn('Click sound not found or not loaded');
        }
    }

    playSend() {
        const sound = this.sounds.get('send');
        if (sound) {
            try {
                this.duckBackgroundMusic();
                sound.replayAsync();
            } catch (error) {
                console.error('Error playing send sound:', error);
            }
        } else {
            console.warn('Send sound not found or not loaded');
        }
    }

    async playAIWinsGame() {
        const sound = this.sounds.get('ai-wins-game');
        if (sound) {
            try {
                // Stop any currently playing game end sound
                if (this.currentGameEndSound) {
                    await this.currentGameEndSound.stopAsync();
                }
                this.currentGameEndSound = sound;
                this.duckBackgroundMusic();
                await sound.replayAsync();
            } catch (error) {
                console.error('Error playing AI wins game sound:', error);
            }
        } else {
            console.warn('AI wins game sound not found or not loaded');
        }
    }

    async playHumansWinGame() {
        const sound = this.sounds.get('humans-win-game');
        if (sound) {
            try {
                // Stop any currently playing game end sound
                if (this.currentGameEndSound) {
                    await this.currentGameEndSound.stopAsync();
                }
                this.currentGameEndSound = sound;
                this.duckBackgroundMusic();
                await sound.replayAsync();
            } catch (error) {
                console.error('Error playing humans win game sound:', error);
            }
        } else {
            console.warn('Humans win game sound not found or not loaded');
        }
    }

    async stopGameEndSound() {
        if (this.currentGameEndSound) {
            try {
                await this.currentGameEndSound.stopAsync();
                this.currentGameEndSound = null;
            } catch (error) {
                console.error('Error stopping game end sound:', error);
            }
        }
    }

    playAIWinsRound() {
        const sound = this.sounds.get('ai-wins-round');
        if (sound) {
            try {
                this.duckBackgroundMusic();
                sound.replayAsync();
            } catch (error) {
                console.error('Error playing AI wins round sound:', error);
            }
        } else {
            console.warn('AI wins round sound not found or not loaded');
        }
    }

    playHumansWinRound() {
        const sound = this.sounds.get('humans-win-round');
        if (sound) {
            try {
                this.duckBackgroundMusic();
                sound.replayAsync();
            } catch (error) {
                console.error('Error playing humans win round sound:', error);
            }
        } else {
            console.warn('Humans win round sound not found or not loaded');
        }
    }

    async cleanup() {
        await this.stopGameEndSound();
        if (this.backgroundMusic) {
            await this.backgroundMusic.unloadAsync();
            this.backgroundMusic = null;
        }
        for (const sound of this.sounds.values()) {
            await sound.unloadAsync();
        }
        this.sounds.clear();
        this.initialized = false;
        // Don't reset hasUserInteraction on cleanup, maintain it for the session
        // Don't remove web interaction handlers either, keep them for the session
    }
}

export const soundManager = SoundManager.getInstance(); 