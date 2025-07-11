import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import decoderBg from '../../assets/images/decoder.png';
import { useSendSound } from '../../hooks/useSendSound';
import { leaveRoom, submitGuess } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';
import AISectionComponent from '../components/AISectionComponent';
import RoundModal from '../components/RoundModal';
import ScoreProgressBar from '../components/ScoreProgressBar';

const DecoderGameScreen = () => {
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
        remainingTime,
    } = useGameStore();

    const [guessInput, setGuessInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const playSendSound = useSendSound();

    const handleSubmitGuess = async () => {
        if (!guessInput.trim() || !canSubmitGuess || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        // Play sound immediately without awaiting
        playSendSound();
        
        try {
            await submitGuess(guessInput.trim());
            setGuessInput('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit guess');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAbort = () => {
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
                >
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
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <AISectionComponent
                            currentTurn={currentTurn}
                            conversationHistory={conversationHistory}
                            currentPlayerId={player?.id}
                            conversationHistoryProps={{ emptySubtext: 'Waiting for your ally to send a clue' }}
                        />
                    </ScrollView>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[
                                styles.guessInput,
                                !canSubmitGuess && styles.guessInputDisabled,
                            ]}
                            value={guessInput}
                            onChangeText={setGuessInput}
                            placeholder={
                                canSubmitGuess
                                    ? "Guess the secret word..."
                                    : "Waiting for your clue..."
                            }
                            multiline
                            maxLength={50}
                            editable={canSubmitGuess}
                            placeholderTextColor="white"
                        />
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                !canSubmitGuess && styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmitGuess}
                            disabled={!canSubmitGuess}
                        >
                            <Text style={styles.submitButtonText}>
                                {isSubmitting ? 'Submitting...' : 'Guess'}
                            </Text>
                        </TouchableOpacity>
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
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginTop: 40, // Move marginTop here for spacing above header
    },
    content: {
        flex: 1,
        paddingTop: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
    },
    guessInput: {
        flex: 1,
        borderWidth: 4,
        borderColor: '#FFD600',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        maxHeight: 100,
        color: '#fff',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    guessInputDisabled: {
        borderColor: '#C7C7CC',
        color: '#8E8E93',
        opacity: 0.5,
    },
    submitButton: {
        borderWidth: 4,
        borderColor: '#FFD600',
        backgroundColor: 'rgba(222, 192, 0, 0.8)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        shadowColor: '#FFD600',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
    },
    submitButtonDisabled: {
        opacity: .4,
    },
    submitButtonText: {
        color: '#000',
        fontWeight: '600',
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
    },
    timerContainer: {
        width: 60, // Fixed width for timer
        paddingHorizontal: 10,
        paddingVertical: 5,
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
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default DecoderGameScreen; 