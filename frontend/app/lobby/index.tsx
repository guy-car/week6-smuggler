import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import lobbyBackground from '../../assets/images/lobby.png';
import { createRoom, getAvailableRooms, getSocket, joinRoom } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';
import ConnectionStatusIndicator from '../components/ConnectionStatusIndicator';

const LobbyScreen = () => {
    const availableRooms = useGameStore((s) => s.availableRooms);
    const connected = useGameStore((s) => s.connected);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (connected) {
            getSocket().emit('enter_lobby');
            getAvailableRooms();
        }
    }, [connected]);

    useEffect(() => {
        return () => {
            if (connected) {
                getSocket().emit('leave_lobby');
            }
        };
    }, [connected]);

    const handleCreateRoom = async () => {
        setLoading(true);
        setError(null);
        try {
            await createRoom();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = (roomId: string) => {
        joinRoom(roomId);
    };

return (
        <ImageBackground source={lobbyBackground} style={{ flex: 1 }} resizeMode="cover">
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.container}>
                    {/* Top bar: Title and Connection Status */}
                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={styles.title}>SMUGGLER</Text>
                    </View>
                    <Text style={styles.subheader}>PASS A SECRET TO SAVE THE WORLD</Text>
                    <View style={styles.connectionStatus}>
                        <ConnectionStatusIndicator compact showDetails />
                    </View>

                    {/* New Game Button */}
                    <BlurView intensity={40} tint="dark" style={styles.blurButtonBg}>
                        <TouchableOpacity style={styles.newGameButton} onPress={handleCreateRoom} disabled={loading || !connected}>
                            <Text style={styles.newGameButtonText}>NEW GAME</Text>
                        </TouchableOpacity>
                    </BlurView>

                    <View style={styles.divider} />

                    <Text style={styles.joinHeader}>JOIN GAME</Text>

                    <View style={styles.roomsList}>
                        {loading && <ActivityIndicator style={{ marginVertical: 16 }} />}
                        {error && <Text style={styles.errorText}>{error}</Text>}
                        {availableRooms.length === 0 && !loading && (
                            <Text style={styles.noRoomsText}>No games available.</Text>
                        )}
                        {availableRooms.map((item) => (
                            <BlurView key={item.id} intensity={40} tint="dark" style={styles.blurButtonBg}>
                                <TouchableOpacity
                                    style={styles.roomButton}
                                    onPress={() => handleJoinRoom(item.id)}
                                >
                                    <Text style={styles.roomButtonLabel}>ROOM ID</Text>
                                    <Text style={styles.roomButtonId}>{item.id.slice(0, 8).toUpperCase()}</Text>
                                </TouchableOpacity>
                            </BlurView>
                        ))}
                    </View>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 32,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
        marginTop: 24,
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 8,
        fontFamily: 'Audiowide',
    },
    subheader: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 32,
        marginTop: 8,
        fontFamily: 'monospace',
        letterSpacing: 1,
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    connectionStatus: {
        marginTop: -10,
        marginBottom: 20,
    },
    blurButtonBg: {
        width: '90%',
        alignSelf: 'center',
        borderRadius: 20,
        marginBottom: 24,
        overflow: 'hidden',
    },
    newGameButton: {
        backgroundColor: 'rgba(30,30,30,0.4)',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderWidth: 3,
        borderColor: '#ff3333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        alignItems: 'center',
    },
    newGameButtonText: {
        color: '#fff',
        fontSize: 52,
        fontWeight: 'bold',
        fontFamily: 'VT323',
        letterSpacing: 2,
        textAlign: 'center',
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    divider: {
        width: '80%',
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginVertical: 24,
        borderRadius: 1,
    },
    joinHeader: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        fontFamily: 'Audiowide',
        letterSpacing: 2,
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    roomsList: {
        width: '100%',
        alignItems: 'center',
    },
    roomButton: {
        backgroundColor: 'rgba(30,30,30,0.4)',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
        marginBottom: 20,
        borderWidth: 3,
        borderColor: '#ff3333',
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    roomButtonLabel: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 4,
        fontFamily: 'VT323',
    },
    roomButtonId: {
        color: '#fff',
        fontSize: 44,
        fontWeight: 'bold',
        fontFamily: 'VT323',
        letterSpacing: 2,
    },
    errorText: {
        color: '#ff3333',
        marginBottom: 12,
        fontWeight: 'bold',
    },
    noRoomsText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 16,
        fontFamily: 'monospace',
        opacity: 0.7,
    },
});

export default LobbyScreen; 