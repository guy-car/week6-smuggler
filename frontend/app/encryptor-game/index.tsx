import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { leaveRoom, sendMessage } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';
import ConversationHistory from '../components/ConversationHistory';
import GameStatusIndicator from '../components/GameStatusIndicator';
import ScoreProgressBar from '../components/ScoreProgressBar';

const EncryptorGameScreen = () => {
    const router = useRouter();
    const {
        conversationHistory,
        currentTurn,
        playerRole,
        gameStatus,
        round,
        maxRounds,
        score,
        secretWord,
        player,
        roomId,
        showSecretModal,
        showGuessesModal,
        showQuitConfirm,
        setShowSecretModal,
        setShowGuessesModal,
        setShowQuitConfirm,
    } = useGameStore();

    const [messageInput, setMessageInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSendMessage = currentTurn === 'encryptor' && gameStatus === 'active';
    const isMyTurn = currentTurn === playerRole;

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !canSendMessage || isSubmitting) {
            return;
        }

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

    const handleShowSecret = () => {
        setShowSecretModal(true);
    };

    const handleShowGuesses = () => {
        setShowGuessesModal(true);
    };

    const handleQuit = () => {
        Alert.alert(
            'Quit Game',
            'Are you sure you want to quit? This will end the game for all players.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Quit',
                    style: 'destructive',
                    onPress: () => {
                        leaveRoom();
                        router.replace('../lobby');
                    },
                },
            ]
        );
    };

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        // This will be handled by the ConversationHistory component
    }, [conversationHistory]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Encryptor Game</Text>
                <TouchableOpacity style={styles.quitButton} onPress={handleQuit}>
                    <Text style={styles.quitButtonText}>Quit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                        onPress={handleShowSecret}
                    >
                        <Text style={styles.controlButtonText}>Secret Word</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={handleShowGuesses}
                    >
                        <Text style={styles.controlButtonText}>Previous Guesses</Text>
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
            </ScrollView>

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
                            ? "Give a hint to help the decryptor guess the word..."
                            : "Waiting for your turn..."
                    }
                    multiline
                    maxLength={200}
                    editable={canSendMessage}
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

            {/* Secret Word Modal */}
            {showSecretModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Secret Word</Text>
                        <Text style={styles.secretWord}>{secretWord || 'Loading...'}</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowSecretModal(false)}
                        >
                            <Text style={styles.modalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Previous Guesses Modal */}
            {showGuessesModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Previous Guesses</Text>
                        <ScrollView style={styles.guessesList}>
                            {conversationHistory
                                .filter((turn) => turn.type === 'decryptor')
                                .map((turn, index) => (
                                    <View key={turn.id} style={styles.guessItem}>
                                        <Text style={styles.guessText}>{turn.content}</Text>
                                        <Text style={styles.guessTime}>
                                            {new Date(turn.timestamp).toLocaleTimeString()}
                                        </Text>
                                    </View>
                                ))}
                            {conversationHistory.filter((turn) => turn.type === 'decryptor').length === 0 && (
                                <Text style={styles.noGuessesText}>No guesses yet</Text>
                            )}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowGuessesModal(false)}
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
    messageInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        maxHeight: 100,
    },
    messageInputDisabled: {
        borderColor: '#C7C7CC',
        backgroundColor: '#F2F2F7',
        color: '#8E8E93',
    },
    sendButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#C7C7CC',
    },
    sendButtonText: {
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
});

export default EncryptorGameScreen; 