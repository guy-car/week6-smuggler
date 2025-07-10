import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Turn } from '../../store/gameStore';
import AIGuessSection from './AIGuessSection';
import AIThinkingSection from './AIThinkingSection';
import ConversationHistory from './ConversationHistory';

interface AISectionProps {
    currentTurn: 'encryptor' | 'ai' | 'decryptor' | null;
    conversationHistory: Turn[];
    currentPlayerId?: string;
    onQuit?: () => void;
    conversationHistoryProps?: Record<string, any>;
}

const AISectionComponent: React.FC<AISectionProps> = ({
    currentTurn,
    conversationHistory,
    currentPlayerId,
    onQuit,
    conversationHistoryProps,
}) => {
    const [countdown, setCountdown] = useState(30);

    // Countdown timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prevCount) => {
                if (prevCount <= 1) {
                    return 30; // Reset to 30 when it reaches 0
                }
                return prevCount - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

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
            <View style={styles.headerRow}>
                {onQuit ? (
                    <TouchableOpacity style={styles.quitButton} onPress={onQuit}>
                        <Text style={styles.quitButtonText}>Abort</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 60 }} />
                )}
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="clip">AI is Listening</Text>
                <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>{countdown}s</Text>
                </View>
            </View>

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
                    {aiAnalysis.thinking && <AIThinkingSection thinking={aiAnalysis.thinking} />}
                    {aiAnalysis.guess && <AIGuessSection guess={aiAnalysis.guess} />}
                </View>
            )}
            {/* {!aiAnalysis && !isAITurn && (
                <View style={styles.noAnalysisContainer}>
                    <Text style={styles.noAnalysisText}>
                        No AI analysis available yet. The AI will analyze the conversation after each turn.
                    </Text>
                </View>
            )} */}
            {/* Conversation history inside AI section */}
            <ConversationHistory conversation={conversationHistory} currentPlayerId={currentPlayerId} {...(conversationHistoryProps || {})} />


        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 14,
        width: '100%',
        maxWidth: 500,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        marginHorizontal: 'auto',
        borderWidth: 4,
        borderColor: '#FF00C8',
        shadowColor: '#FF00C8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    quitButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'white',
    },
    quitButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        flex: 1,
    },
    timerContainer: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'red',
        borderRadius: 8,
        marginLeft: 10,
    },
    timerText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
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