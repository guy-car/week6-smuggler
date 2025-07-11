import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const AIGuessSection: React.FC<{ guess: string }> = ({ guess }) => (
    <View style={styles.guessSection}>
        <Text style={styles.sectionLabel}>AI Guess:</Text>
        <Text style={styles.guessContent}>{guess}</Text>
    </View>
);

const styles = StyleSheet.create({
    guessSection: {
        padding: 14,
        backgroundColor: 'rgba(0,255,255,0.08)',
        borderRadius:6,
        borderWidth: 2,
        borderColor: '#00FFF0',
        shadowColor: '#00FFF0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#00FFF0',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontFamily: 'monospace',
        textShadowColor: '#00FFF0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    guessContent: {
        fontSize: 16,
        color: '#00FFF0',
        lineHeight: 22,
        fontWeight: '500',
        fontFamily: 'monospace',
        textShadowColor: '#00FFF0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
});

export default AIGuessSection; 