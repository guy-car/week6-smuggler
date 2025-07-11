import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Turn, useGameStore } from '../../store/gameStore';
import AIDisplayComponent from './AIDisplayComponent';
import ConversationHistory from './ConversationHistory';

interface AISectionProps {
    currentTurn: 'encoder' | 'ai' | 'decoder' | null;
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
    const remainingTime = useGameStore((state) => state.remainingTime);
    const flashAnim = useRef(new Animated.Value(1)).current;

    // Flashing animation for last 30 seconds
    useEffect(() => {
        if (remainingTime <= 30 && remainingTime > 0) {
            const flashAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(flashAnim, {
                        toValue: 0.3,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flashAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            flashAnimation.start();
            return () => flashAnimation.stop();
        } else {
            flashAnim.setValue(1);
        }
    }, [remainingTime, flashAnim]);

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

    // Determine if we should show AI thinking state
    const hasHumanMessages = conversationHistory.some(turn => turn.type === 'encoder' || turn.type === 'decoder');

    // Check if humans have sent messages after the latest AI turn
    const hasNewHumanMessagesAfterAI = latestAITurn ?
        conversationHistory.some(turn =>
            (turn.type === 'encoder' || turn.type === 'decoder') &&
            new Date(turn.timestamp) > new Date(latestAITurn.timestamp)
        ) : hasHumanMessages;

    const shouldShowAIThinking = isAITurn && hasHumanMessages && hasNewHumanMessagesAfterAI;

    // Only show timer for human turns
    const showTimer = currentTurn === 'encoder' || currentTurn === 'decoder';

    const getTimerStyle = () => {
        if (remainingTime <= 30) {
            return [styles.timerContainer, styles.timerContainerFlashing];
        } else if (remainingTime <= 60) {
            return [styles.timerContainer, styles.timerContainerWarning];
        } else if (remainingTime <= 120) {
            return [styles.timerContainer, styles.timerContainerLow];
        } else {
            return [styles.timerContainer, styles.timerContainerNormal];
        }
    };

    const formatTimerDisplay = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="clip">AI is Listening</Text>
            </View>

            {(shouldShowAIThinking || (aiAnalysis?.guess && !hasNewHumanMessagesAfterAI)) && (
                <View style={styles.latestAnalysisContainer}>
                    <AIDisplayComponent
                        isThinking={shouldShowAIThinking}
                        thinkingText="Analyzing"
                        guess={!hasNewHumanMessagesAfterAI ? aiAnalysis?.guess : undefined}
                    />
                </View>
            )}
            {/* Scrollable conversation history */}
            <View style={styles.conversationContainer}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                >
                    <ConversationHistory
                        conversation={conversationHistory}
                        currentPlayerId={currentPlayerId}
                        {...(conversationHistoryProps || {})}
                    />
                </ScrollView>
            </View>
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
        borderWidth: 1,
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
    },
    title: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        flex: 1,
        fontFamily: 'Audiowide',
        marginBottom: 4,
    },
    timerContainer: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        marginLeft: 10,
    },
    timerContainerNormal: {
        backgroundColor: '#34C759', // Green for normal time (>2 minutes)
    },
    timerContainerLow: {
        backgroundColor: '#FF9500', // Yellow for low time (1-2 minutes)
    },
    timerContainerWarning: {
        backgroundColor: '#FF3B30', // Red for warning (<1 minute)
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 6,
    },
    timerContainerFlashing: {
        backgroundColor: '#FF3B30', // Bright red for flashing (<30 seconds)
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 8,
    },
    timerText: {
        color: '#FFFFFF',
        fontSize: 16,
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
        color: '#1976D2',
        marginBottom: 12,
        textAlign: 'center',
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
    conversationContainer: {
        flex: 1,
        minHeight: 0,
        marginTop: 12,
    },
    scrollView: {
        flex: 1,
        minHeight: 0,
    },
    scrollContent: {
        flexGrow: 1,
    },
});

export default AISectionComponent; 