import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SecretWordContainerProps {
    secretWord?: string;
}

const SecretWordContainer: React.FC<SecretWordContainerProps> = ({ secretWord }) => (
    <View style={[styles.secretWordContainerUnified, { marginTop: 16 }]}>
        <Text style={styles.secretWordTitleUnified}>Secret Word:</Text>
        <Text style={styles.secretWordTextUnified}>{secretWord || 'Loading...'}</Text>
    </View>
);

const styles = StyleSheet.create({
    secretWordContainerUnified: {
        padding: 16,
        width: '100%', // Fill available width
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        borderWidth: 4,
        borderColor: '#00FF90',
        shadowColor: '#00FF90',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
    },
    secretWordTitleUnified: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 4,
        fontFamily: 'Audiowide',
    },
    secretWordTextUnified: {
        fontSize: 40,
        color: '#fff',
        fontFamily: 'VT323',
    },
});

export default SecretWordContainer; 