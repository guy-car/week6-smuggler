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

    // Parse AI content to separate thinking from guess
    const parseAIContent = (content: string) => {
        // Handle the format: "Thinking: [thinking text]\n\nGuess: [guess text]"
        const thinkingMatch = content.match(/Thinking:\s*(.+?)(?=\n\nGuess:|$)/s);
        const guessMatch = content.match(/Guess:\s*(.+?)$/);

        return {
            thinking: thinkingMatch ? thinkingMatch[1].trim() : '',
            guess: guessMatch ? guessMatch[1].trim() : ''
        };
    };

    const aiAnalysis = latestAITurn ? parseAIContent(latestAITurn.content) : null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>AI Listener</Text>

            {isAITurn ? (
                <View style={styles.thinkingContainer}>
                    <Text style={styles.thinkingText}>AI is analyzing the conversation...</Text>
                    <View style={styles.loadingDots}>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.dot}>•</Text>
                    </View>
                </View>
            ) : null}

            {aiAnalysis && (
                <View style={styles.latestAnalysisContainer}>

                    {aiAnalysis.thinking && (
                        <View style={styles.thinkingSection}>
                            <Text style={styles.sectionLabel}>Thinking:</Text>
                            <Text style={styles.thinkingContent}>{aiAnalysis.thinking}</Text>
                        </View>
                    )}

                    {aiAnalysis.guess && (
                        <View style={styles.guessSection}>
                            <Text style={styles.sectionLabel}>Guess:</Text>
                            <Text style={styles.guessContent}>{aiAnalysis.guess}</Text>
                        </View>
                    )}
                </View>
            )}

            {!aiAnalysis && !isAITurn && (
                <View style={styles.noAnalysisContainer}>
                    <Text style={styles.noAnalysisText}>
                        No AI analysis available yet. The AI will analyze the conversation after each turn.
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(10,10,20,0.85)',
        borderRadius: 24,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        borderWidth: 4,
        borderColor: '#FF00C8',
        shadowColor: '#FF00C8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
    },
    thinkingContainer: {
        backgroundColor: '#F3E5F5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    thinkingText: {
        fontSize: 16,
        color: '#7B1FA2',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    loadingDots: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    dot: {
        fontSize: 20,
        color: '#7B1FA2',
        marginHorizontal: 2,
        opacity: 0.7,
    },
    waitingContainer: {
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    waitingText: {
        fontSize: 14,
        color: '#757575',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    latestAnalysisContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    latestAnalysisTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1976D2',
        marginBottom: 12,
        textAlign: 'center',
    },
    thinkingSection: {
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#6C757D',
    },
    guessSection: {
        padding: 12,
        backgroundColor: '#E8F5E8',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#28A745',
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    thinkingContent: {
        fontSize: 14,
        color: '#495057',
        lineHeight: 20,
        fontStyle: 'italic',
    },
    guessContent: {
        fontSize: 16,
        color: '#155724',
        lineHeight: 22,
        fontWeight: '500',
    },
    noAnalysisContainer: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'black',
        alignItems: 'center',
    },
    noAnalysisText: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default AISectionComponent; 