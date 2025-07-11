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
import { useActionHaptics, useButtonHaptics } from '../../hooks/useHaptics';
import { useSendSound } from '../../hooks/useSendSound';
import { leaveRoom, sendMessage } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';
import { isMessageTooSimilar } from '../../utils/stringValidation';
import AISectionComponent from '../components/AISectionComponent';
import RoundModal from '../components/RoundModal';
import ScoreProgressBar from '../components/ScoreProgressBar';
import SecretWordContainer from './SecretWordContainer';

const EncoderGameScreen = () => {
    const {
        conversationHistory,
        currentTurn,
        playerRole,
        gameStatus,
        round,
        maxRounds,
        score,
        player,
        roomId,
        secretWord,
        remainingTime,
    } = useGameStore();

    const [messageInput, setMessageInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const playSendSound = useSendSound();
    const triggerActionHaptics = useActionHaptics();
    const triggerButtonHaptics = useButtonHaptics();

    const canSendMessage = currentTurn === 'encoder' && gameStatus === 'active';
    const isMyTurn = currentTurn === playerRole;

    const flashAnim = useRef(new Animated.Value(1)).current;

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

    useEffect(() => {
        const setup = async () => {
            // No-op for now, placeholder for future audio setup
        };
        setup();
        return () => {
            // No-op for now, placeholder for future cleanup
        };
    }, []);

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

        // Play sound and haptics immediately without awaiting
        playSendSound();
        triggerActionHaptics();

        setIsSubmitting(true);
        try {
            await sendMessage(messageInput.trim());
            setMessageInput('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send message');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuit = () => {
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

    return (
        <ImageBackground
            source={encoderBg}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <KeyboardAvoidingView
                        style={styles.container}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
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
                        <View style={styles.content}>
                            <AISectionComponent
                                currentTurn={currentTurn}
                                conversationHistory={conversationHistory}
                                currentPlayerId={player?.id}
                            />
                        </View>
                        {/* Secret word above input field */}
                        <SecretWordContainer secretWord={secretWord || undefined} />
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[
                                    styles.messageInput,
                                    !canSendMessage && styles.messageInputDisabled,
                                ]}
                                value={messageInput}
                                onChangeText={setMessageInput}
                                placeholder={
                                    canSendMessage
                                        ? "Send a clue to your ally..."
                                        : "Waiting for AI response..."
                                }
                                multiline
                                maxLength={200}
                                editable={canSendMessage}
                                placeholderTextColor="white"
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    (!canSendMessage || !messageInput.trim() || isSubmitting) &&
                                    styles.sendButtonDisabled,
                                ]}
                                onPress={handleSendMessage}
                                disabled={!canSendMessage || !messageInput.trim() || isSubmitting}
                            >
                                <Text style={styles.sendButtonText}>
                                    {isSubmitting ? 'Sending...' : 'Send'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
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
        fontWeight: 'bold',
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
        fontWeight: '600',
        fontFamily: 'Audiowide',
    },
    content: {
        flex: 1,
        paddingTop: 16,
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
        fontWeight: '600',
    },
    aiSection: {
        paddingHorizontal: 16,
        marginVertical: 16,
    },
    aiSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
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
        padding: 16,
        gap: 8,
    },
    messageInput: {
        flex: 1,
        borderWidth: 4,
        borderColor: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        maxHeight: 100,
        color: '#fff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        fontFamily: 'Audiowide',

    },
    messageInputDisabled: {
        borderColor: '#C7C7CC',
        backgroundColor: '#F2F2F7',
        color: '#8E8E93',
    },
    sendButton: {
        borderWidth: 4,
        borderColor: '#00FF90',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,255,144,0.5)',
        shadowColor: '#00FF90',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 16,
        elevation: 10,
        fontFamily: 'Audiowide',
    },
    sendButtonDisabled: {
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
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
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    secretWord: {
        fontSize: 24,
        fontWeight: 'bold',
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
        fontWeight: '600',
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
        fontWeight: '500',
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
        marginHorizontal: 16,
        marginVertical: 8,
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
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 4,
    },
    secretWordText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginTop: 40, // Move marginTop here for spacing above header
    },
    secretWordContainerUnified: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
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
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 4,
    },
    secretWordTextUnified: {
        fontSize: 20,
        fontWeight: 'bold',
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
        fontWeight: '600',
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
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'Audiowide',
    },
});

export default EncoderGameScreen; 