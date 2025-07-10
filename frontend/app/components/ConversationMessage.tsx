import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Turn } from '../../store/gameStore';

interface ConversationMessageProps {
    item: Turn;
    currentPlayerId?: string;
}

const ConversationMessage: React.FC<ConversationMessageProps> = ({ item, currentPlayerId }) => {
    const isCurrentPlayer = item.playerId === currentPlayerId;
    const isEncryptor = item.type === 'encryptor';
    const isDecryptor = item.type === 'decryptor';


    let backgroundColor = '#F2F2F7';
    let textColor = '#000000';
    let borderColor = '#E5E5EA';

    if (isEncryptor) {
        backgroundColor = '#E8F5E8';
        textColor = '#2E7D32';
        borderColor = '#C8E6C9';
    } else if (isDecryptor) {
        backgroundColor = '#FFF3E0';
        textColor = '#F57C00';
        borderColor = '#FFCC02';
    }

    const alignSelf = isCurrentPlayer ? 'flex-end' : 'flex-start';
    const maxWidth = '80%';

    return (
        <View style={[
            styles.turnContainer,
            { alignSelf, maxWidth, backgroundColor, borderColor }
        ]}>
            <View style={styles.turnHeader}>
                <Text style={[styles.turnType, { color: textColor }]}> 
                    {isEncryptor ? 'Encryptor' : 'Decryptor'}
                </Text>
            </View>
            <Text style={[styles.turnContent, { color: textColor }]}> 
                {item.content}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    turnContainer: {
        marginVertical: 4,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    turnHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    turnType: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    timestamp: {
        fontSize: 10,
        opacity: 0.7,
    },
    turnContent: {
        fontSize: 14,
        lineHeight: 20,
    },
});

export default ConversationMessage; 