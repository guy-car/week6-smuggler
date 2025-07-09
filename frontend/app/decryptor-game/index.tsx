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
import AISectionComponent from '../components/AISectionComponent';
import ConversationHistory from '../components/ConversationHistory';
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
            {/* Score bar and quit button in a row at the very top */}
            <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                    <ScoreProgressBar
                        score={score}
                        maxScore={10}
                        aiWinsScore={0}
                        humansWinScore={10}
                    />
                </View>
                <TouchableOpacity style={styles.quitButton} onPress={handleQuit}>
                    <Text style={styles.quitButtonText}>Quit</Text>
                </TouchableOpacity>
            </View>

            {/* Avatar below the score bar and quit button */}
            <View style={styles.avatarRow}>
                <View style={styles.avatarContainerUnified}>
                    <View style={styles.avatarCircleUnified}>
                        <Text style={styles.avatarLabelUnified}>Decoder</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                ref={scrollViewRef}
                keyboardShouldPersistTaps="handled"
            >
                <AISectionComponent
                    currentTurn={currentTurn}
                    conversationHistory={conversationHistory}
                />
                <ConversationHistory
                    conversation={conversationHistory}
                    currentPlayerId={player?.id}
                />
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
    avatarRow: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    avatarContainerUnified: {
        alignItems: 'center',
    },
    avatarCircleUnified: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#C7C7CC',
    },
    avatarLabelUnified: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
});

export default DecryptorGameScreen; 