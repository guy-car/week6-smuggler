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
    thinkingContent: {
        fontSize: 15,
        color: '#00FFF0',
        lineHeight: 22,
        fontFamily: 'monospace',
        textShadowColor: '#00FFF0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
        fontStyle: 'italic',
    },
});

export default AIThinkingSection; 