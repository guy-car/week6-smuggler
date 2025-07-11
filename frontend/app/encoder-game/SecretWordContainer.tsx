import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SecretWordContainerProps {
    secretWord?: string;
}

const SecretWordContainer: React.FC<SecretWordContainerProps> = ({ secretWord }) => (
    <View style={[styles.secretWordContainerUnified, { marginTop: 0 }]}> 
        <Text style={styles.secretWordTitleUnified}>Secret Word:</Text>
        <Text style={styles.secretWordTextUnified}>{secretWord || 'Loading...'}</Text>
    </View>
);

const styles = StyleSheet.create({
    secretWordContainerUnified: {
        padding: 16,
        width: '95%',
        maxWidth: 500,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        marginHorizontal: 'auto',
        borderWidth: 4,
        borderColor: 'blue',
        shadowColor: '#blue',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
    },
    secretWordTitleUnified: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 4,
    },
    secretWordTextUnified: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default SecretWordContainer; 