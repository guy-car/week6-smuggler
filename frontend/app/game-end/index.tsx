import { ResizeMode, Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useGameStore } from '../../store/gameStore';

const GameEndScreen = () => {
    const {
        score,
        round,
        maxRounds,
        secretWord,
        playerRole,
        reset,
    } = useGameStore();

    const handleReturnToLobby = () => {
        reset();
        // Use state-based navigation to return to lobby
        useGameStore.getState().setCurrentScreen('lobby');
    };

    const getResultText = () => {
        if (isWinner) {
            return 'Humans Defeat AI!';
        } else {
            return 'Humans Lose';
        }
    };

    const getResultColor = () => {
        if (isWinner) {
            return '#34C759';
        } else {
            return '#FF3B30';
        }
    };

    const getRoleText = () => {
        return playerRole === 'encoder' ? 'Encoder' : 'Decoder';
    };

    // Determine game result
    const isWinner = score >= 10;
    const isAIWinner = score <= 0; // AI wins when score is 0 or negative
    const isTie = false; // No ties in this game - AI wins at 0

    return (
        <View style={styles.container}>
            {isAIWinner && (
                <Video
                    source={require('../../assets/videos/end_game_ai_wins.mp4')}
                    style={styles.videoBackground}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                    isMuted
                />
            )}
            {isWinner && (
                <Video
                    source={require('../../assets/videos/end_game_humans_win.mp4')}
                    style={styles.videoBackground}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                    isMuted
                />
            )}
            {/* <SparksShower /> */}
            <View style={styles.content}>
                <Text style={styles.title}>Game Over</Text>

                <View style={styles.resultContainer}>
                    <Animated.Text
                        entering={FadeIn.duration(1000)}
                        style={[styles.resultText, { color: getResultColor() }]}
                    >
                        {getResultText()}
                    </Animated.Text>
                </View>

                <BlurView intensity={40} tint="dark" style={styles.blurButtonBackground}>
                    <View style={styles.glowContainer}>
                        <TouchableOpacity
                            style={styles.returnButton}
                            onPress={handleReturnToLobby}
                        >
                            <Text style={styles.returnButtonText}>
                                Return to Lobby
                            </Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    content: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 16,
        padding: 32,
        margin: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        alignItems: 'center',
        minWidth: 300,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 24,
    },
    resultContainer: {
        marginBottom: 32,
    },
    resultText: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    statsContainer: {
        width: '100%',
        marginBottom: 32,
    },
    statItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    statLabel: {
        fontSize: 16,
        color: '#8E8E93',
        fontWeight: '500',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
    },
    secretWord: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    blurButtonBackground: {
        width: '90%',
        alignSelf: 'center',
        borderRadius: 20, // Ensure this matches the button
        marginBottom: 24,
        overflow: 'hidden',
    },
    glowContainer: {
        borderRadius: 20, // Match the button's borderRadius
        shadowColor: '#ff3333',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 10,
    },
    returnButton: {
        backgroundColor: 'rgba(30,30,30,0.4)',
        borderRadius: 20, // Match the wrapper's borderRadius
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderWidth: 3,
        borderColor: '#ff3333',
        shadowColor: '#ff3333',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 12,
        alignItems: 'center',
    },
    returnButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        letterSpacing: 2,
        textAlign: 'center',
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    confettiContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
    },
    confetti: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        opacity: 0.7,
        top: 0,
    },
});

export default GameEndScreen; 