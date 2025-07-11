import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AIDisplayComponentProps {
    isThinking: boolean;
    thinkingText?: string;
    guess?: string;
}

const DOTS = ['', '.', '..', '...'];
const DOT_INTERVAL = 500;

const AIDisplayComponent: React.FC<AIDisplayComponentProps> = ({
    isThinking,
    thinkingText = 'AI is thinking',
    guess,
}) => {
    const [dotIndex, setDotIndex] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Dot animation effect
    useEffect(() => {
        if (isThinking) {
            // Start dot animation
            intervalRef.current = setInterval(() => {
                setDotIndex((prev) => (prev + 1) % DOTS.length);
            }, DOT_INTERVAL);
        } else {
            // Reset dot index when not thinking
            setDotIndex(0);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isThinking]);

    // Don't render if no AI activity
    if (!isThinking && !guess) {
        return null;
    }

    return (
        <View style={styles.container}>
            {isThinking ? (
                <View style={styles.content}>
                    <Text style={styles.label}>AI Thinking:</Text>
                    <Text style={styles.thinkingContent}>
                        {thinkingText}{DOTS[dotIndex]}
                    </Text>
                </View>
            ) : guess ? (
                <View style={styles.content}>
                    <Text style={styles.label}>AI Guess:</Text>
                    <Text style={styles.guessContent}>{guess}</Text>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        padding: 14,
        backgroundColor: 'rgba(0,255,255,0.08)',
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#00FFF0',
        shadowColor: '#00FFF0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
    },
    content: {
        // Container for content alignment
    },
    label: {
        fontSize: 18,
        fontWeight: '700',
        color: '#00FFF0',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontFamily: 'VT323',
        textShadowColor: '#00FFF0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    thinkingContent: {
        fontSize: 30,
        color: '#00FFF0',
        lineHeight: 22,
        fontWeight: '500',
        fontFamily: 'VT323',
        textShadowColor: '#00FFF0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    guessContent: {
        fontSize: 30,
        color: '#00FFF0',
        lineHeight: 22,
        fontWeight: '500',
        fontFamily: 'VT323',
        textShadowColor: '#00FFF0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
});

export default AIDisplayComponent; 