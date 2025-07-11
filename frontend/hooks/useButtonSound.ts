import { soundManager } from '../utils/soundManager';

export const useButtonSound = () => {
    console.log('useButtonSound hook called');
    const boundFunction = soundManager.playClick.bind(soundManager);
    return () => {
        console.log('Button sound function called');
        boundFunction();
    };
}; 