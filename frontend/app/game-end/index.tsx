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
            return 'Humans Win! 🎉';
        } else if (isAIWinner) {
            return 'AI Wins! 🤖';
        } else {
            return "It's a Tie! 🤝";
        }
    };

    const getResultColor = () => {
        if (isWinner) {
            return '#34C759';
        } else if (isAIWinner) {
            return '#FF3B30';
        } else {
            return '#FF9500';
        }
    };

    const getRoleText = () => {
        return playerRole === 'encoder' ? 'Encoder' : 'Decoder';
    };

    // Determine game result
    const isWinner = score > 0;
    const isAIWinner = score < 0;
    const isTie = score === 0;

    return (
        <View style={styles.container}>
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

                {/* Confetti effect (simple animated circles) */}
                <View style={styles.confettiContainer} pointerEvents="none">
                    {[...Array(12)].map((_, i) => (
                        <Animated.View
                            key={i}
                            entering={FadeIn.delay(i * 100).duration(800)}
                            style={[
                                styles.confetti,
                                {
                                    left: `${Math.random() * 90}%`,
                                    backgroundColor: i % 2 === 0 ? '#34C759' : '#FF3B30',
                                },
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Final Score</Text>
                        <Text style={[styles.statValue, { color: getResultColor() }]}>
                            {score > 0 ? `+${score}` : score}
                        </Text>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Rounds Played</Text>
                        <Text style={styles.statValue}>{round}/{maxRounds}</Text>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Your Role</Text>
                        <Text style={styles.statValue}>{getRoleText()}</Text>
                    </View>

                    {secretWord && (
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Secret Word</Text>
                            <Text style={styles.secretWord}>{secretWord}</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.returnButton}
                    onPress={handleReturnToLobby}
                >
                    <Text style={styles.returnButtonText}>
                        Return to Lobby
                    </Text>
                </TouchableOpacity>
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
    content: {
        backgroundColor: '#FFFFFF',
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
        color: '#000000',
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
    returnButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        minWidth: 200,
        alignItems: 'center',
    },
    returnButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
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