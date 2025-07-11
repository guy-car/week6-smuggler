import * as Haptics from 'expo-haptics';

class HapticsManager {
    private static instance: HapticsManager;

    private constructor() {}

    static getInstance(): HapticsManager {
        if (!HapticsManager.instance) {
            HapticsManager.instance = new HapticsManager();
        }
        return HapticsManager.instance;
    }

    // Light feedback for regular buttons (navigation, toggles)
    lightPress() {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            // Silently fail if haptics aren't available
        }
    }

    // Medium feedback for important actions (send message, submit guess)
    mediumPress() {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            // Silently fail if haptics aren't available
        }
    }

    // Heavy feedback for game-changing actions (ready, game end)
    heavyPress() {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (error) {
            // Silently fail if haptics aren't available
        }
    }

    // Success feedback (correct guess, round win)
    success() {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            // Silently fail if haptics aren't available
        }
    }

    // Error feedback (invalid input, connection error)
    error() {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (error) {
            // Silently fail if haptics aren't available
        }
    }

    // Warning feedback (time running low)
    warning() {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (error) {
            // Silently fail if haptics aren't available
        }
    }
}

export const hapticsManager = HapticsManager.getInstance(); 