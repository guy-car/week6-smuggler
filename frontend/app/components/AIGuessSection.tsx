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
    guessContent: {
        fontSize: 16,
        color: '#155724',
        lineHeight: 22,
        fontWeight: '500',
    },
});

export default AIGuessSection; 