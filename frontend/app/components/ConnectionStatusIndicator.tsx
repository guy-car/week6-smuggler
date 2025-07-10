import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../../store/gameStore';

interface ConnectionStatusIndicatorProps {
    showDetails?: boolean;
    compact?: boolean;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
    showDetails = false,
    compact = false,
}) => {
    const { connected, socketId, error } = useGameStore();
    const [pulseAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        if (connected) {
            // Pulse animation when connected
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.8,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            // Stop animation when disconnected
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    }, [connected, pulseAnim]);

    const getStatusInfo = () => {
        if (connected) {
            return {
                color: '#34C759',
                text: 'Connected',
                icon: '🟢',
                details: socketId ? `Socket ID: ${socketId.slice(0, 8)}...` : 'Connected to server',
            };
        } else if (error) {
            return {
                color: '#FF3B30',
                text: 'Connection Error',
                icon: '🔴',
                details: error.length > 50 ? `${error.slice(0, 50)}...` : error,
            };
        } else {
            return {
                color: '#FF9500',
                text: 'Connecting...',
                icon: '🟡',
                details: 'Attempting to connect to server',
            };
        }
    };

    const statusInfo = getStatusInfo();

    if (compact) {
        return (
            <View style={styles.compactContainer}>
                <Animated.View
                    style={[
                        styles.statusDot,
                        { backgroundColor: statusInfo.color },
                        connected && { opacity: pulseAnim },
                    ]}
                />
                {showDetails && (
                    <Text style={styles.compactText} numberOfLines={1}>
                        {statusInfo.text}
                    </Text>
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.statusRow}>
                <Animated.View
                    style={[
                        styles.statusDot,
                        { backgroundColor: statusInfo.color },
                        connected && { opacity: pulseAnim },
                    ]}
                />
                <Text style={styles.statusText}>{statusInfo.text}</Text>
                <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
            </View>

            {showDetails && (
                <Text style={styles.detailsText} numberOfLines={2}>
                    {statusInfo.details}
                </Text>
            )}

            {showDetails && connected && (
                <Text style={styles.serverInfo}>
                    Server: {process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000'}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000000',
        flex: 1,
    },
    statusIcon: {
        fontSize: 12,
    },
    detailsText: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 4,
    },
    serverInfo: {
        fontSize: 10,
        color: '#999999',
        fontFamily: 'monospace',
    },
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    compactText: {
        fontSize: 12,
        color: '#666666',
    },
});

export default ConnectionStatusIndicator; 