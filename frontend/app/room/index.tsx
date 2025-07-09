import { ResizeMode, Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { leaveRoom, setPlayerReady } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';

const RoomScreen = () => {
    const roomId = useGameStore((s) => s.roomId);
    const players = useGameStore((s) => s.players);
    const player = useGameStore((s) => s.player);
    const isReady = useGameStore((s) => s.isReady);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Assign encoder and decoder based on join order
    const encoder = players[0];
    const decoder = players[1];

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

    const handleLeave = () => {
        leaveRoom();
        useGameStore.getState().setCurrentScreen('lobby');
        useGameStore.getState().setRoomId(null);
        useGameStore.getState().setPlayers([]);
        useGameStore.getState().reset();
    };

    return (
        <View style={{ flex: 1 }}>
            <Video
                source={require('../../assets/videos/sequence.mp4')}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
            />
            <View style={[styles.overlay, { flex: 1 }]}> {/* Overlay for readability */}
                {/* Header */}
                <BlurView intensity={40} tint="dark" style={styles.headerBlur}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleLeave} style={styles.backButton}>
                            <Text style={styles.backButtonText}>BACK</Text>
                        </TouchableOpacity>
                        <View style={styles.roomIdContainer}>
                            <Text style={styles.roomIdLabel}>ROOM ID</Text>
                            <Text style={styles.roomId}>{roomId?.slice(0, 8).toUpperCase()}</Text>
                        </View>
                        <View style={{ width: 60 }} /> {/* Spacer for symmetry */}
                    </View>
                </BlurView>

                {/* Footer: Pills stacked above Ready button */}
                <View style={styles.footerStack}>
                    <View style={styles.pillsRow}>
                        <View style={styles.pillContainer}>
                            <BlurView intensity={40} tint="dark" style={styles.pillBlur}>
                                <View style={styles.pillContent}>
                                    <Text style={styles.pillRole}>ENCODER</Text>
                                    <View style={[styles.pillStatus, { backgroundColor: encoder?.ready ? '#34C759' : '#FF3B30' }]}> 
                                        <Text style={styles.pillStatusText}>{encoder?.ready ? 'READY' : 'NOT READY'}</Text>
                                    </View>
                                </View>
                            </BlurView>
                        </View>
                        <View style={styles.pillContainer}>
                            <BlurView intensity={40} tint="dark" style={styles.pillBlur}>
                                <View style={styles.pillContent}>
                                    <Text style={styles.pillRole}>DECODER</Text>
                                    <View style={[styles.pillStatus, { backgroundColor: decoder?.ready ? '#34C759' : '#FF3B30' }]}> 
                                        <Text style={styles.pillStatusText}>{decoder?.ready ? 'READY' : 'NOT READY'}</Text>
                                    </View>
                                </View>
                            </BlurView>
                        </View>
                    </View>
                    <BlurView intensity={40} tint="dark" style={styles.readyButtonBlur}>
                        <TouchableOpacity
                            style={[styles.readyButton, isReady && styles.readyButtonActive]}
                            onPress={handleReadyToggle}
                            disabled={loading}
                        >
                            <Text style={styles.readyButtonText}>{isReady ? 'UNREADY' : 'READY'}</Text>
                        </TouchableOpacity>
                    </BlurView>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        backgroundColor: 'rgba(20,20,20,0.5)',
        flex: 1,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 32,
        paddingHorizontal: 16,
        marginBottom: 8,
        backgroundColor: 'rgba(20,20,20,.5)',
        padding: 16,
    },
    backButton: {
        width: 60,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
        fontFamily: 'monospace',
    },
    roomIdContainer: {
        alignItems: 'center',
    },
    roomIdLabel: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    roomId: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginTop: 2,
    },
    introContainer: {
        backgroundColor: 'rgba(30,30,30,0.8)',
        marginHorizontal: 24,
        marginTop: 8,
        marginBottom: 24,
        borderRadius: 8,
        minHeight: 220,
        justifyContent: 'center',
        alignItems: 'center',
    },
    introText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'monospace',
    },
    pillsRow: {
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        marginHorizontal: 8,
        padding: 12,
    },
    pillRole: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 12,
        fontFamily: 'monospace',
    },
    pillStatus: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    pillStatusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        fontFamily: 'monospace',
    },
    footer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    readyButton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        paddingHorizontal: 50,
        paddingVertical: 18,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#00FFB2',
        shadowColor: '#00FFB2',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    readyButtonActive: {
        backgroundColor: 'rgba(0,255,178,0.15)',
        borderColor: '#fff',
    },
    readyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 28,
        fontFamily: 'monospace',
        letterSpacing: 2,
    },
    pillContainer: {
        marginVertical: 8,
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    pillBlur: {
        borderRadius: 30,
        overflow: 'hidden',
        alignSelf: 'center',
    },
    pillContent: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        padding: 12,
    },
    readyButtonBlur: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    footerStack: {
        flexDirection: 'column',
        justifyContent: 'flex-end',
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    headerBlur: {
        borderRadius: 16,
        overflow: 'hidden',
    },
});

export default RoomScreen; 
