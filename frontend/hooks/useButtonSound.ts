import { soundManager } from '../utils/soundManager';

export const useButtonSound = () => {
    return soundManager.playClick.bind(soundManager);
}; 