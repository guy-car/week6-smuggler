import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { leaveRoom, setPlayerReady, startGame } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';

const RoomScreen = () => {
    const router = useRouter();
    const roomId = useGameStore((s) => s.roomId);
    const players = useGameStore((s) => s.players);
    const player = useGameStore((s) => s.player);
    const isReady = useGameStore((s) => s.isReady);
    const gameStatus = useGameStore((s) => s.gameStatus);
    const currentScreen = useGameStore((s) => s.currentScreen);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if all players are ready
    const allPlayersReady = players.length >= 2 && players.every(p => p.ready);
    const canStartGame = allPlayersReady && player?.ready;

    // Navigate to appropriate screen when game starts
    useEffect(() => {
        if (gameStatus === 'active' && currentScreen !== 'room') {
            // Game has started, navigation will be handled by WebSocket events
            return;
        }
    }, [gameStatus, currentScreen]);

    const handleReadyToggle = () => {
        setLoading(true);
        setError(null);
        try {
            setPlayerReady(!isReady);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartGame = () => {
        if (!canStartGame) {
            Alert.alert('Cannot Start Game', 'All players must be ready to start the game.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            startGame();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLeave = () => {
        Alert.alert(
            'Leave Room',
            'Are you sure you want to leave this room?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: () => {
                        leaveRoom();
                        router.replace('../lobby');
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.roomTitle}>Room: {roomId}</Text>
                <Button title="Leave Room" onPress={handleLeave} color="#FF3B30" />
            </View>

            <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>Game Status</Text>
                <View style={styles.statusCard}>
                    <Text style={styles.statusText}>
                        {allPlayersReady ? 'Ready to start!' : 'Waiting for players...'}
                    </Text>
                    <Text style={styles.playerCount}>
                        {players.length}/2 players
                    </Text>
                </View>
            </View>

            <View style={styles.playersSection}>
                <Text style={styles.sectionTitle}>Players</Text>
                {loading && <ActivityIndicator style={styles.loading} />}
                {error && <Text style={styles.errorText}>{error}</Text>}

                <FlatList
                    data={players}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.playerItem}>
                            <View style={styles.playerInfo}>
                                <Text style={styles.playerName}>
                                    {item.name} {item.id === player?.id ? '(You)' : ''}
                                </Text>
                                <Text style={styles.playerRole}>
                                    {item.role ? item.role.charAt(0).toUpperCase() + item.role.slice(1) : 'Unknown'}
                                </Text>
                            </View>
                            <View style={[
                                styles.readyIndicator,
                                { backgroundColor: item.ready ? '#34C759' : '#FF3B30' }
                            ]}>
                                <Text style={styles.readyText}>
                                    {item.ready ? 'Ready' : 'Not Ready'}
                                </Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No players in room.</Text>
                        </View>
                    }
                />
            </View>

            <View style={styles.actionsSection}>
                <Button
                    title={isReady ? 'Unready' : 'Ready'}
                    onPress={handleReadyToggle}
                    color={isReady ? '#FF3B30' : '#34C759'}
                    disabled={loading}
                />

                {canStartGame && (
                    <Button
                        title="Start Game"
                        onPress={handleStartGame}
                        color="#007AFF"
                        disabled={loading}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    roomTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
    },
    statusSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
        color: '#000000',
    },
    statusCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 4,
    },
    playerCount: {
        fontSize: 14,
        color: '#8E8E93',
    },
    playersSection: {
        flex: 1,
        marginBottom: 24,
    },
    loading: {
        marginVertical: 16,
    },
    errorText: {
        color: '#FF3B30',
        marginBottom: 16,
        textAlign: 'center',
    },
    playerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
        marginBottom: 4,
    },
    playerRole: {
        fontSize: 14,
        color: '#8E8E93',
    },
    readyIndicator: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    readyText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#8E8E93',
    },
    actionsSection: {
        gap: 12,
    },
});

export default RoomScreen; 