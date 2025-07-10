import React, { useEffect, useState } from 'react';
import {
    Alert,
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
import { leaveRoom, sendMessage } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';
import AISectionComponent from '../components/AISectionComponent';
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

    const [messageInput, setMessageInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSendMessage = currentTurn === 'decryptor' && gameStatus === 'active';
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

    return (
        <ImageBackground
            source={decoderBg}
            style={styles.background}
            resizeMode="cover"
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
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
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <AISectionComponent
                        currentTurn={currentTurn}
                        conversationHistory={conversationHistory}
                        currentPlayerId={player?.id}
                        onQuit={handleAbort}
                        conversationHistoryProps={{ emptySubtext: 'Waiting for your ally to send a clue' }}
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
                                ? "Help the encryptor guess the word..."
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
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
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
    messageInput: {
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
    messageInputDisabled: {
        borderColor: '#C7C7CC',
        backgroundColor: '#F2F2F7',
        color: '#8E8E93',
    },
    sendButton: {
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
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: '#000',
        fontWeight: '600',
    },
});

export default DecryptorGameScreen; 