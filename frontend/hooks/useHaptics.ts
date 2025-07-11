import { hapticsManager } from '../utils/hapticsManager';

// For regular navigation buttons and minor interactions
export const useButtonHaptics = () => {
    return hapticsManager.lightPress.bind(hapticsManager);
};

// For sending messages and submitting guesses
export const useActionHaptics = () => {
    return hapticsManager.mediumPress.bind(hapticsManager);
};

// For game-changing actions like ready/unready
export const useGameHaptics = () => {
    return hapticsManager.heavyPress.bind(hapticsManager);
};

// For success notifications
export const useSuccessHaptics = () => {
    return hapticsManager.success.bind(hapticsManager);
};

// For error notifications
export const useErrorHaptics = () => {
    return hapticsManager.error.bind(hapticsManager);
};

// For warning notifications
export const useWarningHaptics = () => {
    return hapticsManager.warning.bind(hapticsManager);
}; 