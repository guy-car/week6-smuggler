import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useButtonSound } from '../../hooks/useButtonSound';

interface ConnectionTroubleshootingGuideProps {
    onClose?: () => void;
}

const ConnectionTroubleshootingGuide: React.FC<ConnectionTroubleshootingGuideProps> = ({
    onClose,
}) => {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [connectionTestResult, setConnectionTestResult] = useState<{
        status: 'idle' | 'testing' | 'success' | 'error';
        message: string;
    }>({ status: 'idle', message: '' });
    const playButtonSound = useButtonSound();

    const handleClose = () => {
        playButtonSound();
        if (onClose) onClose();
    };

    const handleTestConnection = async () => {
        playButtonSound();
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
                    message: '✅ Success! Your device can reach the backend server.\n\nIf you\'re still having WebSocket issues, try the other troubleshooting steps.'
                });
            } else {
                setConnectionTestResult({
                    status: 'error',
                    message: '❌ Server responded with an error.\n\nThis suggests the server is running but may have issues.'
                });
            }
        } catch (err) {
            setConnectionTestResult({
                status: 'error',
                message: '❌ Cannot reach the server.\n\nThis confirms it\'s a network connectivity issue. Follow the troubleshooting steps above.'
            });
        }
    };

    const handleClearTest = () => {
        playButtonSound();
        setConnectionTestResult({ status: 'idle', message: '' });
    };

    const toggleSection = (sectionId: string) => {
        playButtonSound();
        setExpandedSection(expandedSection === sectionId ? null : sectionId);
    };

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
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Connection Troubleshooting</Text>
                {onClose && (
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.description}>
                    Having trouble connecting to the game server? Follow these steps to resolve common mobile connection issues.
                </Text>

                <TouchableOpacity
                    style={styles.testButton}
                    onPress={handleTestConnection}
                    disabled={connectionTestResult.status === 'testing'}
                >
                    <Text style={styles.testButtonText}>
                        {connectionTestResult.status === 'testing' ? '🔍 Testing...' : '🔍 Test Connection Now'}
                    </Text>
                </TouchableOpacity>

                {/* Connection Test Results */}
                {connectionTestResult.status !== 'idle' && (
                    <View style={[styles.connectionTestResult, getConnectionTestStyles()]}>
                        <Text style={styles.connectionTestText}>
                            {connectionTestResult.message}
                        </Text>
                        {connectionTestResult.status !== 'testing' && (
                            <TouchableOpacity
                                style={styles.clearTestButton}
                                onPress={handleClearTest}
                            >
                                <Text style={styles.clearTestButtonText}>Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {troubleshootingSteps.map((step) => (
                    <View key={step.id} style={styles.stepContainer}>
                        <TouchableOpacity
                            style={styles.stepHeader}
                            onPress={() => toggleSection(step.id)}
                        >
                            <Text style={styles.stepTitle}>{step.title}</Text>
                            <Text style={styles.expandIcon}>
                                {expandedSection === step.id ? '▼' : '▶'}
                            </Text>
                        </TouchableOpacity>

                        {expandedSection === step.id && (
                            <View style={styles.stepContent}>
                                {step.content.map((item, index) => (
                                    <Text key={index} style={styles.stepItem}>
                                        • {item}
                                    </Text>
                                ))}
                            </View>
                        )}
                    </View>
                ))}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Still having issues? Check the console logs for more detailed error information.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#666666',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    description: {
        fontSize: 16,
        color: '#666666',
        lineHeight: 22,
        marginBottom: 20,
    },
    testButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 24,
    },
    testButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    connectionTestResult: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
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
    stepContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    stepHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        flex: 1,
    },
    expandIcon: {
        fontSize: 12,
        color: '#007AFF',
        marginLeft: 8,
    },
    stepContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    stepItem: {
        fontSize: 14,
        color: '#666666',
        lineHeight: 20,
        marginBottom: 8,
    },
    footer: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#F8F8F8',
        borderRadius: 8,
    },
    footerText: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default ConnectionTroubleshootingGuide; 