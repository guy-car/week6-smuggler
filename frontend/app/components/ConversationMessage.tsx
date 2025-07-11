import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Turn } from '../../store/gameStore';

interface ConversationMessageProps {
    item: Turn;
    currentPlayerId?: string;
}

const ConversationMessage: React.FC<ConversationMessageProps> = ({ item, currentPlayerId }) => {
    const isCurrentPlayer = item.playerId === currentPlayerId;
    const isEncoder = item.type === 'encoder';
    const isDecoder = item.type === 'decoder';

    // Holographic color themes
    let backgroundColor = 'rgba(0,255,255,0.08)';
    let textColor = '#00FFF0';
    let borderColor = '#00FFF0';
    let shadowColor = '#00FFF0';

    if (isEncoder) {
        backgroundColor = 'rgba(0,255,90,0.12)';
        textColor = '#00FF90';
        borderColor = '#00FF90';
        shadowColor = '#00FF90';
    } else if (isDecoder) {
        backgroundColor = 'rgba(255,200,0,0.10)';
        textColor = '#FFD600';
        borderColor = '#FFD600';
        shadowColor = '#FFD600';
    }

    const alignSelf = isCurrentPlayer ? 'flex-end' : 'flex-start';
    const maxWidth = '80%';

    return (
        <View style={[
            styles.turnContainer,
            { alignSelf, maxWidth, backgroundColor, borderColor, shadowColor }
        ]}>
            <View style={styles.turnHeader}>
                <Text style={[styles.turnType, { color: textColor }]}>
                    {isEncoder ? 'Encoder' : 'Decoder'}
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
        padding: 14,
        borderRadius: 6,
        borderWidth: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 14,
        elevation: 8,
    },
    turnHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    turnType: {
        fontSize: 18,
        textTransform: 'uppercase',
        fontFamily: 'VT323',
        textShadowColor: '#00FFF0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    timestamp: {
        fontSize: 10,
        opacity: 0.7,
    },
    turnContent: {
        fontSize: 30,
        lineHeight: 22,
        fontFamily: 'VT323',
        textShadowColor: '#00FFF0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
});

export default ConversationMessage; 