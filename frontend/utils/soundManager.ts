import { Audio } from 'expo-av';

class SoundManager {
    private static instance: SoundManager;
    private sounds: Map<string, Audio.Sound> = new Map();
    private initialized: boolean = false;

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
                shouldDuckAndroid: false,
            });

            // Preload all sounds
            const clickSound = await Audio.Sound.createAsync(
                require('../assets/sound-FX/click_1.mp3'),
                { shouldPlay: false, volume: 1.0, isLooping: false },
                undefined,
                true // Download first
            );
            this.sounds.set('click', clickSound.sound);

            const sendSound = await Audio.Sound.createAsync(
                require('../assets/sound-FX/send_button_v1.mp3'),
                { shouldPlay: false, volume: 1.0, isLooping: false },
                undefined,
                true // Download first
            );
            this.sounds.set('send', sendSound.sound);

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    playClick() {
        const sound = this.sounds.get('click');
        if (sound) {
            try {
                // Don't await, just fire and forget for better responsiveness
                sound.replayAsync();
            } catch (error) {
                console.error('Error playing click sound:', error);
            }
        }
    }

    playSend() {
        const sound = this.sounds.get('send');
        if (sound) {
            try {
                sound.replayAsync();
            } catch (error) {
                console.error('Error playing send sound:', error);
            }
        }
    }

    async cleanup() {
        for (const sound of this.sounds.values()) {
            await sound.unloadAsync();
        }
        this.sounds.clear();
        this.initialized = false;
    }
}

export const soundManager = SoundManager.getInstance(); 