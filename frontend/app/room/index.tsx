import { ResizeMode, Video } from 'expo-av';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useButtonSound } from '../../hooks/useButtonSound';
import { useButtonHaptics, useGameHaptics } from '../../hooks/useHaptics';
import { leaveRoom, setPlayerReady } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';
import ScrollArea from '../components/ScrollArea';

const RoomScreen = () => {
    const roomId = useGameStore((s) => s.roomId);
    const players = useGameStore((s) => s.players);
    const player = useGameStore((s) => s.player);
    const isReady = useGameStore((s) => s.isReady);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();
    const playButtonSound = useButtonSound();
    const triggerGameHaptics = useGameHaptics();
    const triggerButtonHaptics = useButtonHaptics();

    // Assign encoder and decoder based on join order
    const encoder = players[0];
    const decoder = players[1];

    const handleReadyToggle = () => {
        playButtonSound();
        triggerGameHaptics();
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
        playButtonSound();
        triggerButtonHaptics();
        leaveRoom();
        useGameStore.getState().setCurrentScreen('lobby');
        useGameStore.getState().setRoomId(null);
        useGameStore.getState().setPlayers([]);
        useGameStore.getState().reset();
    };

    // DEBUG: Let's start with the absolute minimal version
    return (
        <View style={{ flex: 1 }}>
            <StatusBar style="light" translucent backgroundColor="transparent" />
            <Video
                source={require('../../assets/videos/sequence.mp4')}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
            />
            <View style={[styles.overlay, { flex: 1 }]}>
                <BlurView intensity={40} tint="dark" style={[styles.headerBlur, { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 40 }]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleLeave} style={styles.backButton}>
                            <Text style={styles.backButtonText}>BACK</Text>
                        </TouchableOpacity>
                        <View style={styles.roomIdContainer}>
                            <Text style={styles.roomIdLabel}>ROOM ID</Text>
                            <Text style={styles.roomId}>
                                {typeof roomId === 'string' ? roomId.slice(0, 8).toUpperCase() : ''}
                            </Text>
                        </View>
                        <View style={{ width: 60 }} />
                    </View>
                </BlurView>
                <View style={styles.mainContent}>
                    <ScrollArea />
                    <View style={{ flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'center', marginVertical: 20 }}>
                        <View style={styles.pillContainer}>
                            <BlurView intensity={40} tint="dark" style={styles.pillBlur}>
                                <View style={styles.pillContent}>
                                    <Text style={styles.pillRole}>ENCODER</Text>
                                    <View style={[styles.pillStatus, { backgroundColor: players[0]?.ready ? '#34C759' : '#FF3B30' }]}>
                                        <Text style={styles.pillStatusText}>{players[0]?.ready ? 'READY' : 'NOT READY'}</Text>
                                    </View>
                                </View>
                            </BlurView>
                        </View>
                        <View style={styles.pillContainer}>
                            <BlurView intensity={40} tint="dark" style={styles.pillBlur}>
                                <View style={styles.pillContent}>
                                    <Text style={styles.pillRole}>DECODER</Text>
                                    <View style={[styles.pillStatus, { backgroundColor: players[1]?.ready ? '#34C759' : '#FF3B30' }]}>
                                        <Text style={styles.pillStatusText}>{players[1]?.ready ? 'READY' : 'NOT READY'}</Text>
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
                    <Text>Main Content</Text>
                </View>
            </View>
        </View>
    );
};

const HEADER_HEIGHT = 80; // Move header height to a constant

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
        height: HEADER_HEIGHT, // Use constant instead
        paddingHorizontal: 16,
        marginBottom: 8,
        padding: 16,
    },
    backButton: {
        width: 60,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Audiowide',
    },
    roomIdContainer: {
        alignItems: 'center',
    },
    roomIdLabel: {
        color: '#fff',
        fontSize: 12,
        letterSpacing: 1,
        fontFamily: 'VT323',
    },
    roomId: {
        color: '#fff',
        fontSize: 34,
        letterSpacing: 2,
        marginTop: 2,
        fontFamily: 'VT323',
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
        marginHorizontal: 20,
        marginBottom: 20,
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
        fontSize: 28,
        fontFamily: 'VT323',
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
        overflow: 'hidden',
    },
    mainContent: {
        flex: 1,
        paddingTop: HEADER_HEIGHT + 55, // Use constant instead
        paddingBottom: 0,
        justifyContent: 'center',
    },
});
export default RoomScreen; 

