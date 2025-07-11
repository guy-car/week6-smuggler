import { soundManager } from '../utils/soundManager';

export const useSendSound = () => {
    return soundManager.playSend.bind(soundManager);
}; 