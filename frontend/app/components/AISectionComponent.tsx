import React, { useEffect, useRef } from 'react';
import { Animated, Keyboard, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { Turn, useGameStore } from '../../store/gameStore';
import AIGuessSection from './AIGuessSection';
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
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View>
                    <View style={styles.headerRow}>
                        <Text style={styles.title} numberOfLines={1} ellipsizeMode="clip">AI is Listening</Text>
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
                            {/* {aiAnalysis.thinking && <AIThinkingSection thinking={aiAnalysis.thinking} />} */}
                            {aiAnalysis.guess && <AIGuessSection guess={aiAnalysis.guess} />}
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>
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
        fontWeight: '600',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
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
        fontWeight: 'bold',
    },
    thinkingContainer: {
        backgroundColor: 'rgba(0,255,255,0.08)',
        padding: 14,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#00FFF0',
        shadowColor: '#00FFF0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    thinkingText: {
        fontSize: 15,
        color: '#00FFF0',
        fontFamily: 'VT323',
        textShadowColor: '#00FFF0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    loadingDots: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    dot: {
        fontSize: 20,
        color: '#00FFF0',
        fontFamily: 'monospace',
        textShadowColor: '#00FFF0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
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