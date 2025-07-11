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
import encoderBg from '../../assets/images/encoder.png';
import { useButtonSound } from '../../hooks/useButtonSound';
import { useActionHaptics, useButtonHaptics } from '../../hooks/useHaptics';
import { useSendSound } from '../../hooks/useSendSound';
import { emitTypingStart, emitTypingStop, leaveRoom, sendMessage } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';
import { isMessageTooSimilar } from '../../utils/stringValidation';
import AISectionComponent from '../components/AISectionComponent';
import RoundModal from '../components/RoundModal';
import ScoreProgressBar from '../components/ScoreProgressBar';
import TypingIndicator from '../components/TypingIndicator';
import SecretWordContainer from './SecretWordContainer';

const EncoderGameScreen = () => {
    const {
        conversationHistory,
        currentTurn,
        playerRole,
        gameStatus,
        round,
        score,
        player,
        roomId,
        secretWord,
        remainingTime,
        typingIndicator,
    } = useGameStore();

    const [messageInput, setMessageInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const playButtonSound = useButtonSound();
    const playSendSound = useSendSound();
    const triggerActionHaptics = useActionHaptics();
    const triggerButtonHaptics = useButtonHaptics();

    const canSendMessage = currentTurn === 'encoder' && gameStatus === 'active';
    const isMyTurn = currentTurn === playerRole;

    const flashAnim = useRef(new Animated.Value(1)).current;
    const typingTimeoutRef = useRef<any>(null);
    const buttonAnim = useRef(new Animated.Value(1)).current;
    const buttonWidthAnim = useRef(new Animated.Value(100)).current; // 100 = visible, 0 = hidden

    // Initialize audio and load sound
    useEffect(() => {
        const setup = async () => {
            // await initializeAudio(); // This line is removed as per the new_code
            // const loadedSound = await loadSound( // This line is removed as per the new_code
            //     require('../../assets/sound-FX/send_button_v1.mp3') // This line is removed as per the new_code
            // ); // This line is removed as per the new_code
            // setSound(loadedSound); // This line is removed as per the new_code
        };

        setup();

        return () => {
            // if (sound) { // This line is removed as per the new_code
            //     sound.unloadAsync(); // This line is removed as per the new_code
            // } // This line is removed as per the new_code
        };
    }, []);

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

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !canSendMessage || isSubmitting) {
            return;
        }

        // Validate that the message doesn't contain the secret word or similar variations
        if (secretWord && isMessageTooSimilar(messageInput.trim(), secretWord)) {
            Alert.alert(
                'Do Better',
                'Are you trying to get us killed? Be more creative with your hints!',
                [{ text: 'OK' }]
            );
            return;
        }

        const currentMessage = messageInput.trim();
        setIsSubmitting(true);
        // Clear input immediately for better UX
        setMessageInput('');

        // Play sound and haptics immediately without awaiting
        playSendSound();

        triggerActionHaptics();

        try {
            await sendMessage(currentMessage);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send message');
            // Restore the input if there was an error
            setMessageInput(currentMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTyping = (text: string) => {
        setMessageInput(text);
        if (!canSendMessage || !playerRole) return;
        emitTypingStart(playerRole);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            emitTypingStop(playerRole);
        }, 1500); // Changed from 1000 to 1500ms
    };

    const handleQuit = () => {
        playButtonSound();
        triggerButtonHaptics();
        leaveRoom();
        // Use state-based navigation to return to lobby
        useGameStore.getState().setCurrentScreen('lobby');
        useGameStore.getState().setRoomId(null);
        useGameStore.getState().setPlayers([]);
        useGameStore.getState().reset();
    };

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        // This will be handled by the ConversationHistory component
    }, [conversationHistory]);

    useEffect(() => {
        if (canSendMessage) {
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
    }, [canSendMessage]);

    return (
        <ImageBackground
            source={encoderBg}
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
                            <TouchableOpacity style={styles.abortButton} onPress={handleQuit}>
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
                        />
                    </View>

                    {/* Secret word above input field */}
                    <SecretWordContainer secretWord={secretWord || undefined} />

                    {/* Typing indicator above input field */}
                    <View style={styles.typingIndicatorContainer}>
                        <TypingIndicator
                            role={(typingIndicator?.role || 'encoder') as 'encoder' | 'decoder'}
                            isVisible={!!(typingIndicator && typingIndicator.isTyping && typingIndicator.role !== playerRole)}
                        />
                    </View>

                    {/* inputContainer moved inside KeyboardAvoidingView */}
                    <View style={[styles.inputContainer, canSendMessage && { gap: 8 }]}>
                        <View style={{ flex: 1, minWidth: 120, marginRight: canSendMessage ? 8 : 0 }}>
                            <Animated.View style={[styles.inputOuter, { borderColor: borderColorAnim }]}>
                                <TextInput
                                    style={[
                                        styles.messageInput,
                                        Platform.OS === 'web'
                                            ? { outline: 'none', boxSizing: 'border-box', height: 48, lineHeight: 48, paddingTop: 0, paddingBottom: 0 }
                                            : { paddingVertical: 10, lineHeight: 20 },
                                        !canSendMessage && styles.messageInputDisabled
                                    ]}
                                    value={messageInput}
                                    onChangeText={handleTyping}
                                    placeholder={
                                        canSendMessage
                                            ? "Send a clue..."
                                            : "Waiting for AI response..."
                                    }
                                    multiline
                                    maxLength={200}
                                    editable={canSendMessage}
                                    placeholderTextColor="white"
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                    spellCheck={false}
                                />
                            </Animated.View>
                        </View>
                        <Animated.View style={{ width: buttonWidthAnim, opacity: buttonAnim, overflow: 'hidden' }}>
                            <Animated.View style={[styles.sendButton, { borderColor: borderColorAnim }]}>
                                <TouchableOpacity
                                    style={[{ flex: 1, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }, (!canSendMessage || !messageInput.trim() || isSubmitting) && styles.sendButtonDisabled]}
                                    onPress={handleSendMessage}
                                    disabled={!canSendMessage || !messageInput.trim() || isSubmitting}
                                >
                                    <Text style={styles.sendButtonText} numberOfLines={1}>
                                        {isSubmitting ? 'Sending...' : 'Send'}
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
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: 16, // Add global screen padding
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        marginTop: 10,
    },
    title: {
        fontSize: 20,
        color: '#000000',
    },
    quitButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FF3B30',
        borderRadius: 8,
        fontFamily: 'Audiowide',
    },
    quitButtonText: {
        color: '#FFFFFF',
        fontFamily: 'Audiowide',
    },
    content: {
        flex: 1,
        minHeight: 0,
        marginTop: 16, // Add this to match decoder's gap from header
    },
    controlsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginVertical: 8,
        gap: 8,
    },
    controlButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    controlButtonText: {
        color: '#FFFFFF',
    },
    aiSection: {
        // Remove paddingHorizontal and marginVertical for consistency
    },
    aiSectionTitle: {
        fontSize: 16,
        marginBottom: 8,
        color: '#000000',
    },
    aiThinkingBox: {
        backgroundColor: '#E3F2FD',
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#1976D2',
    },
    aiThinkingText: {
        color: '#1976D2',
        fontSize: 14,
        fontFamily: 'Audiowide',
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
    messageInput: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        fontFamily: 'Audiowide',
        height: 48,
        borderWidth: 0,
        lineHeight: 20,
    },
    messageInputDisabled: {
        // Only dim text color, do not change background or border
        color: '#8E8E93',
        // opacity: 0.5, // optional, can remove if not desired
    },
    sendButton: {
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
    sendButtonDisabled: {
        opacity: .4,
    },
    sendButtonText: {
        color: '#000',
        fontSize: 16,
        textAlign: 'center',
        fontFamily: 'Audiowide',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24,
        margin: 32,
        maxWidth: '80%',
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 18,
        marginBottom: 16,
        textAlign: 'center',
    },
    secretWord: {
        fontSize: 24,
        color: '#007AFF',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#FFFFFF',
    },
    guessesList: {
        maxHeight: 200,
        marginBottom: 16,
    },
    guessItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    guessText: {
        fontSize: 16,
        color: '#000000',
    },
    guessTime: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
    },
    noGuessesText: {
        textAlign: 'center',
        color: '#8E8E93',
        fontStyle: 'italic',
        paddingVertical: 20,
    },
    secretWordContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        marginTop: 16,
        width: '100%', // Make it fill the available width
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    secretWordTitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 4,
    },
    secretWordText: {
        fontSize: 20,
        color: '#007AFF',
        fontFamily: 'VT323',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        // Remove paddingHorizontal and paddingVertical
        marginTop: 40, // Keep marginTop for spacing above header
    },
    secretWordContainerUnified: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        marginTop: 16,
        width: '100%', // Make it fill the available width
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    secretWordTitleUnified: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 4,
    },
    secretWordTextUnified: {
        fontSize: 20,
        color: '#007AFF',
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
        shadowRadius: 12,
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

export default EncoderGameScreen; 