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
                (status) => {
                    // Optional: Handle status updates
                    if (status.isLoaded) {
                        console.log('Click sound loaded successfully');
                    }
                },
                true // Download first
            );
            this.sounds.set('click', clickSound.sound);

            const sendSound = await Audio.Sound.createAsync(
                require('../assets/sound-FX/send_button_v1.mp3'),
                { shouldPlay: false, volume: 1.0, isLooping: false },
                (status) => {
                    // Optional: Handle status updates
                    if (status.isLoaded) {
                        console.log('Send sound loaded successfully');
                    }
                },
                true // Download first
            );
            this.sounds.set('send', sendSound.sound);

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    playClick() {
        console.log('playClick() called');
        const sound = this.sounds.get('click');
        console.log('🎹🎹🎹Click sound retrieved:', sound ? 'found' : 'not found');
        if (sound) {
            try {
                console.log('🎹🎹🎹About to play click sound');
                sound.replayAsync();
                console.log('🎹🎹🎹Click sound replayAsync() called');
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