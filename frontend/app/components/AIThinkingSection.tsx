import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const AIThinkingSection: React.FC<{ thinking: string }> = ({ thinking }) => (
    <View style={styles.thinkingSection}>
        <Text style={styles.sectionLabel}>AI Thinking:</Text>
        <Text style={styles.thinkingContent}>{thinking}</Text>
    </View>
);

const styles = StyleSheet.create({
    thinkingSection: {
        marginBottom: 12,
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#6C757D',
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
});

export default AIThinkingSection; 