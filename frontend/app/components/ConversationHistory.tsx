import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Turn } from '../../store/gameStore';
import ConversationMessage from './ConversationMessage';

interface ConversationHistoryProps {
    conversation: Turn[];
    currentPlayerId?: string;
    emptySubtext?: string;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
    conversation,
    currentPlayerId,
    emptySubtext,
}) => {
    // Filter out AI messages from display (but keep them in data for backend)
    const displayConversation = conversation.filter(turn => turn.type !== 'ai');

    if (displayConversation.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No messages yet</Text>
                    <Text style={styles.emptySubtext}>{emptySubtext || 'Send a clue to the decoder to start.'}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.listContent}>
                {displayConversation.map((item) => (
                    <ConversationMessage key={item.id} item={item} currentPlayerId={currentPlayerId} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        maxWidth: 500,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        marginHorizontal: 'auto',
        borderColor: 'blue',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
        padding: 6,
        paddingTop: 16,
    },
    title: {
        fontSize: 18,
        marginBottom: 12,
        paddingHorizontal: 16,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'Audiowide',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#8E8E93',
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#C7C7CC',
    },
});

export default ConversationHistory; 