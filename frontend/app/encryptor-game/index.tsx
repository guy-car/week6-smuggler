import React, { useEffect, useState } from 'react';
import {
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import encoderBg from '../../assets/images/encoder.png';
import { leaveRoom, sendMessage } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';
import AISectionComponent from '../components/AISectionComponent';
import RoundModal from '../components/RoundModal';
import ScoreProgressBar from '../components/ScoreProgressBar';
import SecretWordContainer from './SecretWordContainer';

const EncryptorGameScreen = () => {
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

    const handleQuit = () => {
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

                </View>

                {/* Remove ScrollView, use View instead */}
                <View style={styles.content}>
                    <AISectionComponent
                        currentTurn={currentTurn}
                        conversationHistory={conversationHistory}
                        currentPlayerId={player?.id}
                        onQuit={handleQuit}
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
                                ? "Help the decoder guess the word..."
                                : "Waiting for your turn..."
                        }
                        multiline
                        maxLength={200}
                        editable={canSendMessage}
                        placeholderTextColor="#CCCCCC"
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
    },
    quitButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
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
    },
    messageInputDisabled: {
        borderColor: '#C7C7CC',
        backgroundColor: '#F2F2F7',
        color: '#8E8E93',
    },
    sendButton: {
        borderWidth: 4,
        borderColor: 'blue',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 16, 186, 0.8)',
    },
    sendButtonDisabled: {
    },
    sendButtonText: {
        color: '#fff',
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16, // match decoder
        paddingVertical: 16,    // match decoder
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
});

export default EncryptorGameScreen; 