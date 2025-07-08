import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { leaveRoom, setPlayerReady } from '../services/websocket';
import { Player, useGameStore } from '../store/gameStore';

export default function PreGameScreen() {
    const {
        connected,
        roomId,
        player,
        players,
        gameStatus,
        setGameStatus,
        setRole
    } = useGameStore();

    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);

    // Auto-navigate to game screens when game starts
    useEffect(() => {
        if (gameStatus === 'active' && player?.role) {
            if (player.role === 'encryptor') {
                router.replace('/encrypter');
            } else if (player.role === 'decryptor') {
                router.replace('/decrypter');
            }
        }
    }, [gameStatus, player?.role]);

    // Check if both players are ready
    useEffect(() => {
        if (players.length === 2 && players.every((p: any) => p.ready)) {
            // Both players are ready, game should start soon
            console.log('Both players ready, waiting for game start...');
        }
    }, [players]);

    const handleToggleReady = async () => {
        if (!connected || !roomId) {
            Alert.alert('Error', 'Not connected to server');
            return;
        }

        setLoading(true);
        try {
            const newReadyState = !ready;
            setReady(newReadyState);
            setPlayerReady(newReadyState);
        } catch (error) {
            console.error('Failed to set ready status:', error);
            Alert.alert('Error', 'Failed to update ready status');
            setReady(!ready); // Revert the local state
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveRoom = async () => {
        if (!connected || !roomId) {
            router.replace('/');
            return;
        }

        setLoading(true);
        try {
            leaveRoom();
            router.replace('/');
        } catch (error) {
            console.error('Failed to leave room:', error);
            Alert.alert('Error', 'Failed to leave room');
        } finally {
            setLoading(false);
        }
    };

    const renderPlayer = (playerData: Player, index: number) => (
        <View key={playerData.id} style={styles.playerItem}>
            <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                    {playerData.name || `Player ${index + 1}`}
                </Text>
                <Text style={styles.playerRole}>
                    {playerData.role ? `${playerData.role.charAt(0).toUpperCase() + playerData.role.slice(1)}` : 'Role pending...'}
                </Text>
            </View>
            <View style={[styles.readyIndicator, { backgroundColor: playerData.ready ? '#4CAF50' : '#FF9800' }]}>
                <Text style={styles.readyText}>
                    {playerData.ready ? 'Ready' : 'Not Ready'}
                </Text>
            </View>
        </View>
    );

    if (!roomId) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No room found. Redirecting to lobby...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Waiting for Players</Text>
                <Text style={styles.roomInfo}>Room: {roomId}</Text>
            </View>

            <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: connected ? '#4CAF50' : '#F44336' }]} />
                <Text style={styles.statusText}>
                    {connected ? 'Connected' : 'Disconnected'}
                </Text>
            </View>

            <View style={styles.playersContainer}>
                <Text style={styles.sectionTitle}>Players ({players.length}/2)</Text>

                {players.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Waiting for players to join...</Text>
                    </View>
                ) : (
                    <View style={styles.playerList}>
                        {players.map((playerData, index) => renderPlayer(playerData, index))}
                    </View>
                )}

                {players.length === 2 && players.every((p: any) => p.ready) && (
                    <View style={styles.readyMessage}>
                        <Text style={styles.readyMessageText}>Both players ready! Game starting...</Text>
                        <ActivityIndicator size="small" color="#4CAF50" style={styles.readySpinner} />
                    </View>
                )}
            </View>

            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={[
                        styles.readyButton,
                        { backgroundColor: ready ? '#4CAF50' : '#FF9800' }
                    ]}
                    onPress={handleToggleReady}
                    disabled={loading || !connected}
                    testID="ready-button"
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {ready ? 'Not Ready' : 'Ready'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.leaveButton}
                    onPress={handleLeaveRoom}
                    disabled={loading}
                >
                    <Text style={styles.leaveButtonText}>Leave Room</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    roomInfo: {
        fontSize: 16,
        color: '#666',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    statusText: {
        fontSize: 16,
        color: '#666',
    },
    playersContainer: {
        flex: 1,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
    playerList: {
        flex: 1,
    },
    playerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    playerRole: {
        fontSize: 14,
        color: '#666',
    },
    readyIndicator: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    readyText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    readyMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E8F5E8',
        padding: 15,
        borderRadius: 10,
        marginTop: 15,
    },
    readyMessageText: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginRight: 10,
    },
    readySpinner: {
        marginLeft: 5,
    },
    controlsContainer: {
        gap: 15,
    },
    readyButton: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    leaveButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F44336',
    },
    leaveButtonText: {
        color: '#F44336',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 18,
        color: '#F44336',
        textAlign: 'center',
        marginTop: 100,
    },
}); 