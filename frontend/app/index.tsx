import React, { useEffect } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { getSocket } from '../services/websocket';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../utils/soundManager';
import ConnectionErrorScreen from './components/ConnectionErrorScreen';
import DecoderGameScreen from './decoder-game';
import EncoderGameScreen from './encoder-game';
import GameEndScreen from './game-end';
import LobbyScreen from './lobby';
import RoomScreen from './room';

const App = () => {
    const {
        currentScreen,
        connected,
        isLoading,
        error,
        setIsLoading,
        setError,
    } = useGameStore();

    useEffect(() => {
        // Initialize WebSocket connection and sound manager
        const initialize = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Initialize sound manager first
                await soundManager.initialize();
                await soundManager.playBackgroundMusic();
                
                // Then initialize WebSocket
                getSocket();
            } catch (err: any) {
                setError(err.message || 'Failed to connect to server');
            } finally {
                setIsLoading(false);
            }
        };

        initialize();

        // Handle app state changes
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                // App came to foreground
                soundManager.playBackgroundMusic();
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                // App went to background
                soundManager.pauseBackgroundMusic();
            }
        });

        // Cleanup on unmount
        return () => {
            subscription.remove();
            soundManager.cleanup();
        };
    }, []);

    // Show loading screen while connecting
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={[styles.loadingText, { fontFamily: 'Audiowide' }]}>Connecting to server...</Text>
            </View>
        );
    }

    // Show error screen if connection failed
    if (error && !connected) {
        return <ConnectionErrorScreen />;
    }

    // Render appropriate screen based on current state
    switch (currentScreen) {
        case 'lobby':
            return <LobbyScreen />;
        case 'room':
            return <RoomScreen />;
        case 'encoder-game':
            return <EncoderGameScreen />;
        case 'decoder-game':
            return <DecoderGameScreen />;
        case 'game-end':
            return <GameEndScreen />;
        default:
            return <LobbyScreen />;
    }
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#8E8E93',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        padding: 24,
    },
    errorTitle: {
        fontSize: 24,
        color: '#FF3B30',
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#000000',
        textAlign: 'center',
        marginBottom: 16,
    },
    errorSubtext: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
    },
});

export default App; 