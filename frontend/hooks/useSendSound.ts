import { useCallback } from 'react';
import { soundManager } from '../utils/soundManager';

export const useSendSound = () => {
    return useCallback(() => {
        soundManager.playSend();
    }, []);
}; 