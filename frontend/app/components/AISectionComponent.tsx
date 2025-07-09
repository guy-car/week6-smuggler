import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Turn } from '../../store/gameStore';

interface AISectionProps {
    currentTurn: 'encryptor' | 'ai' | 'decryptor' | null;
    conversationHistory: Turn[];
}

const AISectionComponent: React.FC<AISectionProps> = ({
    currentTurn,
    conversationHistory,
}) => {
    // Get the latest AI turn from conversation history
    const latestAITurn = conversationHistory
        .filter(turn => turn.type === 'ai')
        .pop();

    const isAITurn = currentTurn === 'ai';

    return (
        <View style={styles.container}>
            <Text style={styles.title}>AI Analysis</Text>

            {isAITurn ? (
                <View style={styles.thinkingContainer}>
                    <Text style={styles.thinkingText}>AI is analyzing the conversation...</Text>
                </View>
            ) : (
                <View style={styles.waitingContainer}>
                    <Text style={styles.waitingText}>AI is waiting for the next turn...</Text>
                </View>
            )}

            {latestAITurn && (
                <View style={styles.latestAnalysisContainer}>
                    <Text style={styles.latestAnalysisTitle}>Latest AI Analysis:</Text>
                    <Text style={styles.latestAnalysisContent}>{latestAITurn.content}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#BBDEFB',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 8,
    },
    thinkingContainer: {
        backgroundColor: '#F3E5F5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    thinkingText: {
        fontSize: 14,
        color: '#7B1FA2',
        fontStyle: 'italic',
    },
    waitingContainer: {
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    waitingText: {
        fontSize: 14,
        color: '#757575',
        fontStyle: 'italic',
    },
    latestAnalysisContainer: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    latestAnalysisTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1976D2',
        marginBottom: 4,
    },
    latestAnalysisContent: {
        fontSize: 14,
        color: '#424242',
        lineHeight: 20,
    },
});

export default AISectionComponent; 