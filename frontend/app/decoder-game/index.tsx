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
    } = useGameStore();

    const [guessInput, setGuessInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmitGuess = currentTurn === 'decoder' && gameStatus === 'active';
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
                    <View style={{ flex: 1, marginTop: 30 }}>
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
                            (!canSubmitGuess || !guessInput.trim() || isSubmitting) &&
                            styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmitGuess}
                        disabled={!canSubmitGuess || !guessInput.trim() || isSubmitting}
                    >
                        <Text style={styles.submitButtonText}>
                            {isSubmitting ? 'Submitting...' : 'Guess'}
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
});

export default DecoderGameScreen; 