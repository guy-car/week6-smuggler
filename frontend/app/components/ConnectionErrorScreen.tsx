import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getSocket } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';
import ConnectionTroubleshootingGuide from './ConnectionTroubleshootingGuide';

interface ConnectionErrorScreenProps {
    onRetry?: () => void;
}

const ConnectionErrorScreen: React.FC<ConnectionErrorScreenProps> = ({ onRetry }) => {
    const { error, isLoading } = useGameStore();
    const [showTroubleshooting, setShowTroubleshooting] = useState(false);
    const [connectionTestResult, setConnectionTestResult] = useState<{
        status: 'idle' | 'testing' | 'success' | 'error';
        message: string;
    }>({ status: 'idle', message: '' });

    const handleRetry = async () => {
        if (onRetry) {
            onRetry();
        } else {
            // Default retry behavior
            useGameStore.getState().setIsLoading(true);
            useGameStore.getState().setError(null);

            try {
                // Attempt to reconnect
                getSocket();
            } catch (err: any) {
                useGameStore.getState().setError(err.message || 'Failed to connect to server');
            } finally {
                useGameStore.getState().setIsLoading(false);
            }
        }
    };

    const handleCheckConnection = async () => {
        const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        const healthUrl = `${backendUrl}/api/health`;

        setConnectionTestResult({ status: 'testing', message: 'Testing connection...' });

        try {
            const response = await fetch(healthUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setConnectionTestResult({
                    status: 'success',
                    message: '✅ Backend server is reachable! Your device can connect to the server, but WebSocket connection may have failed. Try the retry button.'
                });
            } else {
                setConnectionTestResult({
                    status: 'error',
                    message: '❌ Backend server responded with an error. This suggests the server is running but may have issues.'
                });
            }
        } catch (err) {
            setConnectionTestResult({
                status: 'error',
                message: '❌ Cannot reach backend server. This usually means:\n• Server is not running\n• Wrong IP address in config\n• Firewall blocking connection\n• Device not on same network'
            });
        }
    };

    const getErrorDetails = () => {
        if (!error) return { title: 'Connection Error', message: 'Unknown error occurred' };

        // Parse common error patterns
        if (error.includes('Failed to connect to')) {
            return {
                title: 'Network Connection Failed',
                message: 'Your device cannot reach the game server. This is usually a network configuration issue.',
                suggestions: [
                    'Check if the backend server is running',
                    'Verify your IP address in the environment configuration',
                    'Ensure your device is on the same WiFi network',
                    'Try disabling your firewall temporarily'
                ]
            };
        }

        if (error.includes('CORS') || error.includes('cors')) {
            return {
                title: 'CORS Policy Error',
                message: 'The server rejected the connection due to CORS policy restrictions.',
                suggestions: [
                    'Check if the backend CORS configuration is correct',
                    'Verify the EXPO_PUBLIC_BACKEND_URL environment variable',
                    'Ensure the backend is configured to accept connections from your device'
                ]
            };
        }

        if (error.includes('timeout') || error.includes('Timeout')) {
            return {
                title: 'Connection Timeout',
                message: 'The connection attempt timed out. The server may be overloaded or unreachable.',
                suggestions: [
                    'Check if the backend server is running and responsive',
                    'Try again in a few moments',
                    'Verify network connectivity'
                ]
            };
        }

        return {
            title: 'Connection Error',
            message: error,
            suggestions: [
                'Check your internet connection',
                'Verify the server is running',
                'Try restarting the app'
            ]
        };
    };

    const errorDetails = getErrorDetails();

    const getConnectionTestStyles = () => {
        switch (connectionTestResult.status) {
            case 'success':
                return { backgroundColor: '#E8F5E8', borderColor: '#34C759' };
            case 'error':
                return { backgroundColor: '#FFE8E8', borderColor: '#FF3B30' };
            case 'testing':
                return { backgroundColor: '#FFF8E8', borderColor: '#FF9500' };
            default:
                return { backgroundColor: '#F8F8F8', borderColor: '#E5E5EA' };
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                </View>

                <Text style={styles.title}>{errorDetails.title}</Text>
                <Text style={styles.message}>{errorDetails.message}</Text>

                {errorDetails.suggestions && (
                    <View style={styles.suggestionsContainer}>
                        <Text style={styles.suggestionsTitle}>Troubleshooting Steps:</Text>
                        {errorDetails.suggestions.map((suggestion, index) => (
                            <Text key={index} style={styles.suggestion}>
                                • {suggestion}
                            </Text>
                        ))}
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={handleRetry}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>
                            {isLoading ? 'Retrying...' : 'Retry Connection'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={handleCheckConnection}
                        disabled={isLoading || connectionTestResult.status === 'testing'}
                    >
                        <Text style={styles.secondaryButtonText}>
                            {connectionTestResult.status === 'testing' ? 'Testing...' : 'Test Connection'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.tertiaryButton]}
                        onPress={() => setShowTroubleshooting(true)}
                        disabled={isLoading}
                    >
                        <Text style={styles.tertiaryButtonText}>📖 Troubleshooting Guide</Text>
                    </TouchableOpacity>
                </View>

                {/* Connection Test Results */}
                {connectionTestResult.status !== 'idle' && (
                    <View style={[styles.connectionTestResult, getConnectionTestStyles()]}>
                        <Text style={styles.connectionTestText}>
                            {connectionTestResult.message}
                        </Text>
                        {connectionTestResult.status !== 'testing' && (
                            <TouchableOpacity
                                style={styles.clearTestButton}
                                onPress={() => setConnectionTestResult({ status: 'idle', message: '' })}
                            >
                                <Text style={styles.clearTestButtonText}>Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={styles.debugInfo}>
                    <Text style={styles.debugTitle}>Debug Information:</Text>
                    <Text style={styles.debugText}>
                        Backend URL: {process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000'}
                    </Text>
                    <Text style={styles.debugText}>
                        Error: {error || 'No error message'}
                    </Text>
                </View>
            </View>

            <Modal
                visible={showTroubleshooting}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <ConnectionTroubleshootingGuide onClose={() => setShowTroubleshooting(false)} />
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F2F2F7',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        marginBottom: 24,
    },
    errorIcon: {
        fontSize: 64,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF3B30',
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#000000',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    suggestionsContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    suggestionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 12,
    },
    suggestion: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 8,
        lineHeight: 20,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    button: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: '#007AFF',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    tertiaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#666666',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    tertiaryButtonText: {
        color: '#666666',
        fontSize: 16,
        fontWeight: '600',
    },
    connectionTestResult: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 16,
    },
    connectionTestText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#000000',
    },
    clearTestButton: {
        alignSelf: 'flex-end',
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    clearTestButtonText: {
        fontSize: 12,
        color: '#666666',
    },
    debugInfo: {
        marginTop: 32,
        padding: 16,
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
        width: '100%',
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666666',
        marginBottom: 8,
    },
    debugText: {
        fontSize: 12,
        color: '#999999',
        marginBottom: 4,
        fontFamily: 'monospace',
    },
});

export default ConnectionErrorScreen; 