import React, { useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { leaveRoom, submitGuess } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';
import ConversationHistory from '../components/ConversationHistory';
import GameStatusIndicator from '../components/GameStatusIndicator';
import ScoreProgressBar from '../components/ScoreProgressBar';

const DecryptorGameScreen = () => {
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
        showCluesModal,
        setShowCluesModal,
    } = useGameStore();

    const [guessInput, setGuessInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmitGuess = currentTurn === 'decryptor' && gameStatus === 'active';
    const isMyTurn = currentTurn === playerRole;

    const handleSubmitGuess = async () => {
        if (!guessInput.trim() || !canSubmitGuess || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        try {
            await submitGuess(guessInput.trim());
            setGuessInput('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit guess');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShowClues = () => {
        setShowCluesModal(true);
    };

    const handleQuit = () => {
        leaveRoom();
        // Use state-based navigation to return to lobby
        useGameStore.getState().setCurrentScreen('lobby');
        useGameStore.getState().setRoomId(null);
        useGameStore.getState().setPlayers([]);
        useGameStore.getState().reset();
    };

    // Get previous hints from the conversation
    const previousHints = conversationHistory.filter(
        (turn) => turn.type === 'encryptor'
    );

    const scrollViewRef = useRef<ScrollView>(null);
    const inputRef = useRef<TextInput>(null);

    // Scroll input into view when focused
    const handleInputFocus = () => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };
    // Dismiss keyboard on submit
    const handleSubmitEditing = () => {
        Keyboard.dismiss();
    };
    // Auto-focus input on mount
    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Decryptor Game</Text>
                <TouchableOpacity style={styles.quitButton} onPress={handleQuit}>
                    <Text style={styles.quitButtonText}>Quit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                ref={scrollViewRef}
                keyboardShouldPersistTaps="handled"
            >
                {/* Encoder Avatar Placeholder */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarLabel}>Encoder</Text>
                    </View>
                </View>
                {/* Decryptor Instructions */}
                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsText}>
                        Your role: <Text style={{ fontWeight: 'bold' }}>Decryptor</Text>. Use the hints to guess the secret word. You win if you guess before the AI does!
                    </Text>
                </View>
                <GameStatusIndicator
                    gameStatus={gameStatus}
                    currentTurn={currentTurn}
                    playerRole={playerRole}
                    round={round}
                    maxRounds={maxRounds}
                />

                <ScoreProgressBar
                    score={score}
                    maxScore={10}
                    aiWinsScore={-5}
                    humansWinScore={5}
                />

                <View style={styles.controlsContainer}>
                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={handleShowClues}
                    >
                        <Text style={styles.controlButtonText}>Previous Hints</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.aiSection}>
                    <Text style={styles.aiSectionTitle}>AI Thinking</Text>
                    <View style={styles.aiThinkingBox}>
                        <Text style={styles.aiThinkingText}>
                            {currentTurn === 'ai' ? 'AI is analyzing the conversation...' : 'AI is waiting for the next turn...'}
                        </Text>
                    </View>
                </View>

                <ConversationHistory
                    conversation={conversationHistory}
                    currentPlayerId={player?.id}
                />
                {/* Guess History & Feedback */}
                <View style={styles.guessHistoryContainer}>
                    <Text style={styles.guessHistoryTitle}>Your Guesses</Text>
                    {conversationHistory.filter(turn => turn.type === 'decryptor' && turn.playerId === player?.id).length === 0 ? (
                        <Text style={styles.noGuessesText}>No guesses yet</Text>
                    ) : (
                        conversationHistory
                            .filter(turn => turn.type === 'decryptor' && turn.playerId === player?.id)
                            .map((turn, idx) => (
                                <View key={turn.id} style={styles.guessHistoryItem}>
                                    <Text style={styles.guessHistoryGuess}>{turn.content}</Text>
                                    {/* Feedback placeholder */}
                                    <Text style={styles.guessHistoryFeedback}>-</Text>
                                    <Text style={styles.guessHistoryTime}>{new Date(turn.timestamp).toLocaleTimeString()}</Text>
                                </View>
                            ))
                    )}
                </View>
            </ScrollView>

            <View style={styles.inputContainer}>
                <TextInput
                    ref={inputRef}
                    style={[
                        styles.guessInput,
                        !canSubmitGuess && styles.guessInputDisabled,
                    ]}
                    value={guessInput}
                    onChangeText={setGuessInput}
                    placeholder={
                        canSubmitGuess
                            ? "Enter your guess for the secret word..."
                            : "Waiting for your turn..."
                    }
                    multiline
                    maxLength={50}
                    editable={canSubmitGuess}
                    onFocus={handleInputFocus}
                    onSubmitEditing={handleSubmitEditing}
                    blurOnSubmit={true}
                    testID="decryptor-guess-input"
                />
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (!canSubmitGuess || !guessInput.trim() || isSubmitting) &&
                        styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmitGuess}
                    disabled={!canSubmitGuess || !guessInput.trim() || isSubmitting}
                >
                    <Text style={styles.submitButtonText}>
                        {isSubmitting ? 'Submitting...' : 'Submit Guess'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Previous Hints Modal */}
            {showCluesModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Previous Hints</Text>
                        <ScrollView style={styles.hintsList}>
                            {previousHints.map((hint, index) => (
                                <View key={hint.id} style={styles.hintItem}>
                                    <Text style={styles.hintNumber}>Hint {index + 1}</Text>
                                    <Text style={styles.hintText}>{hint.content}</Text>
                                    <Text style={styles.hintTime}>
                                        {new Date(hint.timestamp).toLocaleTimeString()}
                                    </Text>
                                </View>
                            ))}
                            {previousHints.length === 0 && (
                                <Text style={styles.noHintsText}>No hints yet</Text>
                            )}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowCluesModal(false)}
                        >
                            <Text style={styles.modalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
    },
    quitButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FF3B30',
        borderRadius: 8,
    },
    quitButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    controlsContainer: {
        paddingHorizontal: 16,
        marginVertical: 8,
    },
    controlButton: {
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
        marginVertical: 8,
    },
    aiSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#000000',
    },
    aiThinkingBox: {
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#1976D2',
    },
    aiThinkingText: {
        color: '#1976D2',
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        gap: 8,
    },
    guessInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        maxHeight: 100,
    },
    guessInputDisabled: {
        borderColor: '#C7C7CC',
        backgroundColor: '#F2F2F7',
        color: '#8E8E93',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#C7C7CC',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
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
    hintsList: {
        maxHeight: 300,
        marginBottom: 16,
    },
    hintItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    hintNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 4,
    },
    hintText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 4,
    },
    hintTime: {
        fontSize: 12,
        color: '#8E8E93',
    },
    noHintsText: {
        textAlign: 'center',
        color: '#8E8E93',
        fontStyle: 'italic',
        paddingVertical: 20,
    },
    avatarContainer: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    avatarCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    avatarLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5856D6',
    },
    instructionsContainer: {
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 12,
        backgroundColor: '#FFF3E0',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#F57C00',
    },
    instructionsText: {
        color: '#F57C00',
        fontSize: 15,
        lineHeight: 20,
    },
    guessHistoryContainer: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 16,
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    guessHistoryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#007AFF',
    },
    guessHistoryItem: {
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    guessHistoryGuess: {
        fontSize: 15,
        fontWeight: '500',
        color: '#000',
    },
    guessHistoryFeedback: {
        fontSize: 13,
        color: '#F57C00',
        marginTop: 2,
    },
    guessHistoryTime: {
        fontSize: 11,
        color: '#8E8E93',
        marginTop: 2,
    },
    noGuessesText: {
        textAlign: 'center',
        color: '#8E8E93',
        fontStyle: 'italic',
        paddingVertical: 20,
    },
});

export default DecryptorGameScreen; 