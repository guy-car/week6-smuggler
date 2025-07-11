import { useCallback } from 'react';
import { soundManager } from '../utils/soundManager';

export const useButtonSound = () => {
    return useCallback(() => {
        soundManager.playClick();
    }, []);
}; 