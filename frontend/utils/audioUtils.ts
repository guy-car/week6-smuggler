import { Audio } from 'expo-av';

// Initialize audio system
export const initializeAudio = async () => {
    try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true, // Allow playing when the device is in silent mode
            staysActiveInBackground: false,
            shouldDuckAndroid: false,
        });
    } catch (error) {
        console.error('Failed to initialize audio', error);
    }
};

// Preload and cache sound
export const loadSound = async (soundFile: any): Promise<Audio.Sound | null> => {
    try {
        const { sound } = await Audio.Sound.createAsync(
            soundFile,
            { shouldPlay: false, volume: 1.0 }
        );
        return sound;
    } catch (error) {
        console.error('Error loading sound', error);
        return null;
    }
};

// Play sound without waiting
export const playSound = (sound: Audio.Sound | null) => {
    if (sound) {
        try {
            sound.replayAsync();
        } catch (error) {
            console.error('Error playing sound', error);
        }
    }
}; 