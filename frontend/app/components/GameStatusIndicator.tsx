import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GameStatus } from '../../store/gameStore';

interface GameStatusIndicatorProps {
    gameStatus: GameStatus;
    currentTurn: 'encryptor' | 'ai' | 'decryptor' | null;
    playerRole: 'encryptor' | 'decryptor' | null;
    round: number;
    maxRounds: number;
    isLoading?: boolean;
}

const GameStatusIndicator: React.FC<GameStatusIndicatorProps> = ({
    gameStatus,
    currentTurn,
    playerRole,
    round,
    maxRounds,
    isLoading = false,
}) => {
    const getStatusText = () => {
        if (isLoading) {
            return 'Loading...';
        }

        switch (gameStatus) {
            case 'waiting':
                return 'Waiting for players...';
            case 'active':
                if (currentTurn === 'encryptor') {
                    return playerRole === 'encryptor' ? 'Your turn - give a hint!' : 'Encryptor turn';
                } else if (currentTurn === 'ai') {
                    return 'AI turn';
                } else if (currentTurn === 'decryptor') {
                    return playerRole === 'decryptor' ? 'Your turn - make a guess!' : 'Decryptor turn';
                } else {
                    return 'Game in progress...';
                }
            case 'ended':
                return 'Game ended';
            default:
                return 'Unknown status';
        }
    };

    const getStatusColor = () => {
        if (isLoading) {
            return '#007AFF';
        }

        switch (gameStatus) {
            case 'waiting':
                return '#FF9500';
            case 'active':
                if (currentTurn === playerRole) {
                    return '#34C759';
                } else if (currentTurn === 'ai') {
                    return '#5856D6';
                } else {
                    return '#007AFF';
                }
            case 'ended':
                return '#FF3B30';
            default:
                return '#8E8E93';
        }
    };

    const isMyTurn = currentTurn === playerRole;

    return (
        <View style={styles.container}>
            <View style={styles.statusRow}>
                <View style={styles.statusContainer}>
                    {isLoading && <ActivityIndicator size="small" color={getStatusColor()} style={styles.loadingIndicator} />}
                    <Text style={[styles.statusText, { color: getStatusColor() }]}>
                        {getStatusText()}
                    </Text>
                </View>

                <View style={styles.roundContainer}>
                    <Text style={styles.roundText}>
                        Round {round}/{maxRounds}
                    </Text>
                </View>
            </View>

            {gameStatus === 'active' && currentTurn && (
                <View style={styles.turnIndicator}>
                    <View style={[styles.turnDot, { backgroundColor: getStatusColor() }]} />
                    <Text style={[styles.turnText, { color: getStatusColor() }]}>
                        {currentTurn === 'encryptor' ? 'Encryptor Turn' :
                            currentTurn === 'ai' ? 'AI Turn' : 'Decryptor Turn'}
                    </Text>
                </View>
            )}

            {isMyTurn && gameStatus === 'active' && (
                <View style={styles.myTurnContainer}>
                    <Text style={styles.myTurnText}>It's your turn!</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
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
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    loadingIndicator: {
        marginRight: 8,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
    },
    roundContainer: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    roundText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    turnIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    turnDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    turnText: {
        fontSize: 14,
        fontWeight: '500',
    },
    myTurnContainer: {
        backgroundColor: '#E8F5E8',
        padding: 8,
        borderRadius: 8,
        marginTop: 8,
        alignItems: 'center',
    },
    myTurnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E7D32',
    },
});

export default GameStatusIndicator; 