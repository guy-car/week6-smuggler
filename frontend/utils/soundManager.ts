import { Audio } from 'expo-av';

class SoundManager {
    private static instance: SoundManager;
    private sounds: Map<string, Audio.Sound> = new Map();
    private backgroundMusic: Audio.Sound | null = null;
    private initialized: boolean = false;
    private musicVolume: number = 0.5; // Default music volume
    private effectsVolume: number = 1.0; // Default effects volume

    private constructor() {}

    static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true, // Enable ducking on Android
            });

            // Preload all sounds
            const clickSound = await Audio.Sound.createAsync(
                require('../assets/sound-FX/click_1.mp3'),
                { shouldPlay: false, volume: this.effectsVolume, isLooping: false },
                (status) => {
                    if (status.isLoaded) {
                        console.log('Click sound loaded successfully');
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
                        console.log('Send sound loaded successfully');
                    }
                },
                true // Download first
            );
            this.sounds.set('send', sendSound.sound);

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
                        console.log('Background music loaded successfully');
                    }
                },
                true // Download first
            );
            this.backgroundMusic = bgMusic.sound;

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    async playBackgroundMusic() {
        if (!this.backgroundMusic) return;
        try {
            const status = await this.backgroundMusic.getStatusAsync();
            if (status.isLoaded) {
                if (!status.isPlaying) {
                    await this.backgroundMusic.setVolumeAsync(this.musicVolume);
                    await this.backgroundMusic.playAsync();
                }
            }
        } catch (error) {
            console.error('Error playing background music:', error);
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
        console.log('🔊 Playing click sound');
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
        console.log('🔊 Playing send sound');
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

    async cleanup() {
        if (this.backgroundMusic) {
            await this.backgroundMusic.unloadAsync();
            this.backgroundMusic = null;
        }
        for (const sound of this.sounds.values()) {
            await sound.unloadAsync();
        }
        this.sounds.clear();
        this.initialized = false;
    }
}

export const soundManager = SoundManager.getInstance(); 