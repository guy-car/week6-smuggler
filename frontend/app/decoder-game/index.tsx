import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    ImageBackground,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import decoderBg from '../../assets/images/decoder.png';
import { useButtonSound } from '../../hooks/useButtonSound';
import { useActionHaptics, useButtonHaptics } from '../../hooks/useHaptics';
import { useSendSound } from '../../hooks/useSendSound';
import { emitTypingStart, emitTypingStop, leaveRoom, submitGuess } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';
import AISectionComponent from '../components/AISectionComponent';
import RoundModal from '../components/RoundModal';
import ScoreProgressBar from '../components/ScoreProgressBar';
import TypingIndicator from '../components/TypingIndicator';

const DecoderGameScreen = () => {
    const {
        conversationHistory,
        currentTurn,
        playerRole,
        gameStatus,
        round,
        score,
        player,
        roomId,
        remainingTime,
        typingIndicator,
    } = useGameStore();

    const [guessInput, setGuessInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const playButtonSound = useButtonSound();
    const playSendSound = useSendSound();
    const triggerActionHaptics = useActionHaptics();
    const triggerButtonHaptics = useButtonHaptics();

    const handleSubmitGuess = async () => {
        if (!guessInput.trim() || !canSubmitGuess || isSubmitting) {
            return;
        }

        const currentGuess = guessInput.trim();
        setIsSubmitting(true);
        // Clear input immediately for better UX
        setGuessInput('');

        // Play sound and haptics immediately without awaiting
        playSendSound();

        triggerActionHaptics();

        try {
            await submitGuess(currentGuess);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit guess');
            // Restore the input if there was an error
            setGuessInput(currentGuess);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAbort = () => {
        playButtonSound();
        triggerButtonHaptics();
        leaveRoom();
        useGameStore.getState().setCurrentScreen('lobby');
        useGameStore.getState().setRoomId(null);
        useGameStore.getState().setPlayers([]);
        useGameStore.getState().reset();
    };

    useEffect(() => {
        // This will be handled by the ConversationHistory component
    }, [conversationHistory]);

    const canSubmitGuess = currentTurn === 'decoder' && gameStatus === 'active';
    const isMyTurn = currentTurn === playerRole;

    const flashAnim = useRef(new Animated.Value(1)).current;
    const buttonAnim = useRef(new Animated.Value(1)).current;
    const buttonWidthAnim = useRef(new Animated.Value(100)).current; // 100 = visible, 0 = hidden

    // Animate button based on canSubmitGuess state
    useEffect(() => {
        if (canSubmitGuess) {
            Animated.parallel([
                Animated.timing(buttonAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(buttonWidthAnim, {
                    toValue: 100,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(buttonAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(buttonWidthAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [canSubmitGuess]);

    // Flashing animation for last 30 seconds
    useEffect(() => {
        if (remainingTime <= 30 && remainingTime > 0) {
            const flashAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(flashAnim, {
                        toValue: 0.3,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flashAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            flashAnimation.start();
            return () => flashAnimation.stop();
        } else {
            flashAnim.setValue(1);
        }
    }, [remainingTime, flashAnim]);

    // Animated border color for input
    const borderColorAnim = flashAnim.interpolate({
        inputRange: [0.3, 1],
        outputRange: ['#FF3B30', '#FFD600'],
    });

    // Remove inputWidthAnim and all related animation logic

    const typingTimeoutRef = useRef<any>(null);

    const handleTyping = (text: string) => {
        setGuessInput(text);
        if (!canSubmitGuess || !playerRole) return;
        emitTypingStart(playerRole);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            emitTypingStop(playerRole);
        }, 1500); // Changed from 1000 to 1500ms
    };

    // Format timer display as MM:SS
    const formatTimerDisplay = (seconds: number): string => {
        const totalSeconds = Math.floor(seconds);
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = Math.abs(totalSeconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Timer styling based on remaining time
    const getTimerStyle = () => {
        if (remainingTime <= 30) {
            return [styles.timerContainer, styles.timerContainerFlashing];
        } else if (remainingTime <= 60) {
            return [styles.timerContainer, styles.timerContainerWarning];
        } else if (remainingTime <= 120) {
            return [styles.timerContainer, styles.timerContainerLow];
        }
        return [styles.timerContainer, styles.timerContainerNormal];
    };

    return (
        <ImageBackground
            source={decoderBg}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <View style={styles.topRow}>
                            <TouchableOpacity style={styles.abortButton} onPress={handleAbort}>
                                <Text style={styles.abortButtonText}>Abort</Text>
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <ScoreProgressBar
                                    score={score}
                                    maxScore={6}
                                    aiWinsScore={0}
                                    humansWinScore={6}
                                />
                            </View>
                            <Animated.View style={[getTimerStyle(), { opacity: flashAnim }]}>
                                <Text style={styles.timerText}>{formatTimerDisplay(remainingTime)}</Text>
                            </Animated.View>
                        </View>
                    </TouchableWithoutFeedback>

                    <View style={styles.content}>
                        <AISectionComponent
                            currentTurn={currentTurn}
                            conversationHistory={conversationHistory}
                            currentPlayerId={player?.id}
                            conversationHistoryProps={{ emptySubtext: 'Waiting for the encoder to send a clue' }}
                        />
                    </View>

                    {/* Typing indicator above input field */}
                    <View style={styles.typingIndicatorContainer}>
                        <TypingIndicator
                            role={(typingIndicator?.role || 'encoder') as 'encoder' | 'decoder'}
                            isVisible={!!(typingIndicator && typingIndicator.isTyping && typingIndicator.role !== playerRole)}
                        />
                    </View>

                    {/* inputContainer at the bottom, will be pushed up by KeyboardAvoidingView */}
                    <View style={[styles.inputContainer, canSubmitGuess && { gap: 8 }]}>
                        <View style={{ flex: 1, minWidth: 120, marginRight: canSubmitGuess ? 8 : 0 }}>
                            <Animated.View style={[styles.inputOuter, { borderColor: borderColorAnim }]}>
                                <TextInput
                                    style={[
                                        styles.guessInput,
                                        Platform.OS === 'web'
                                            ? { outline: 'none', boxSizing: 'border-box', height: 48, lineHeight: 48, paddingTop: 0, paddingBottom: 0 }
                                            : { paddingVertical: 10, lineHeight: 20 },
                                        !canSubmitGuess && styles.guessInputDisabled
                                    ]}
                                    value={guessInput}
                                    onChangeText={handleTyping}
                                    placeholder={
                                        canSubmitGuess
                                            ? "Guess the secret..."
                                            : "Waiting for the clue..."
                                    }
                                    multiline
                                    maxLength={50}
                                    editable={canSubmitGuess}
                                    placeholderTextColor="white"
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                    spellCheck={false}
                                />
                            </Animated.View>
                        </View>
                        <Animated.View style={{ width: buttonWidthAnim, opacity: buttonAnim, overflow: 'hidden' }}>
                            <Animated.View style={[styles.submitButton, { borderColor: borderColorAnim }]}>
                                <TouchableOpacity
                                    style={[{ flex: 1, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }, !canSubmitGuess && styles.submitButtonDisabled]}
                                    onPress={handleSubmitGuess}
                                    disabled={!canSubmitGuess}
                                >
                                    <Text style={styles.submitButtonText} numberOfLines={1}>
                                        {isSubmitting ? 'Submitting...' : 'Guess'}
                                    </Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
            </View>
            <RoundModal />
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: 16, // Add global screen padding
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        // Remove paddingHorizontal and paddingVertical
        marginTop: 40, // Keep marginTop for spacing above header
    },
    content: {
        flex: 1,
        minHeight: 0,
        paddingTop: 16,
        paddingBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56, // fixed height for stability
        width: '100%',
        // Remove padding and margin here
    },
    inputOuter: {
        borderWidth: 4,
        borderColor: '#FFD600',
        borderRadius: 8,
        height: 48,
        zIndex: 1,
        overflow: 'hidden',
    },
    guessInput: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        fontFamily: 'Audiowide',
        height: 48,
        borderWidth: 0,
        lineHeight: 20,
    },
    guessInputDisabled: {
        // Only dim text color, do not change background or border
        color: '#8E8E93',
        // opacity: 0.5, // optional, can remove if not desired
    },
    submitButton: {
        borderWidth: 4,
        borderColor: '#FFD600',
        backgroundColor: 'rgba(222, 192, 0, 0.8)',
        paddingHorizontal: 16,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        shadowColor: '#FFD600',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
        alignItems: 'center',
        minWidth: 80,
    },
    submitButtonDisabled: {
        opacity: .4,
    },
    submitButtonText: {
        color: '#000',
        fontSize: 16,
        textAlign: 'center',
        fontFamily: 'Audiowide',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    abortButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'white',
        marginRight: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },
    abortButtonText: {
        color: '#FFFFFF',
        fontFamily: 'Audiowide',
    },
    timerContainer: {
        width: 60, // Fixed width for timer
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 8,
        marginLeft: 10,
        textAlign: 'center',
    },
    timerContainerNormal: {
        backgroundColor: '#34C759', // Green for normal time (>2 minutes)
    },
    timerContainerLow: {
        backgroundColor: '#FF9500', // Yellow for low time (1-2 minutes)
    },
    timerContainerWarning: {
        backgroundColor: '#FF3B30', // Red for warning (<1 minute)
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 6,
    },
    timerContainerFlashing: {
        backgroundColor: '#FF3B30', // Bright red for flashing (<30 seconds)
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 14,
        elevation: 8,
    },
    timerText: {
        color: '#FFFFFF',
        fontSize: 12,
        textAlign: 'center',
        fontFamily: 'Audiowide',
    },
    typingIndicatorContainer: {
        height: 42, // Fixed height to prevent layout shifts (30 + 12 margin)
        paddingHorizontal: 16,
    },
});

export default DecoderGameScreen; 