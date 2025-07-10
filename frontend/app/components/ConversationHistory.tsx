import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Turn } from '../../store/gameStore';
import ConversationMessage from './ConversationMessage';

interface ConversationHistoryProps {
    conversation: Turn[];
    currentPlayerId?: string;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
    conversation,
    currentPlayerId
}) => {
    // Filter out AI messages from display (but keep them in data for backend)
    const displayConversation = conversation.filter(turn => turn.type !== 'ai');

    const renderTurn = ({ item }: { item: Turn }) => {
        return <ConversationMessage item={item} currentPlayerId={currentPlayerId} />;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>"Private" Human Chat</Text>
            <FlatList
                data={displayConversation}
                keyExtractor={(item) => item.id}
                renderItem={renderTurn}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No messages yet</Text>
                        <Text style={styles.emptySubtext}>Hello human, send a clue to start.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        width: '100%',
        maxWidth: 500,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        marginHorizontal: 'auto',
        borderWidth: 4,
        borderColor: 'blue',
        shadowColor: 'blue',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 8,
        marginTop: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        paddingHorizontal: 16,
        color: '#fff',
        textAlign: 'center',
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
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