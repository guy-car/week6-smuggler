import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Turn } from '../../store/gameStore';

interface ConversationHistoryProps {
    conversation: Turn[];
    currentPlayerId?: string;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
    conversation,
    currentPlayerId
}) => {
    const renderTurn = ({ item }: { item: Turn }) => {
        const isCurrentPlayer = item.playerId === currentPlayerId;
        const isAI = item.type === 'ai';

        let backgroundColor = '#F2F2F7';
        let textColor = '#000000';
        let borderColor = '#E5E5EA';

        if (isAI) {
            backgroundColor = '#E3F2FD';
            textColor = '#1976D2';
            borderColor = '#BBDEFB';
        } else if (item.type === 'encryptor') {
            backgroundColor = '#E8F5E8';
            textColor = '#2E7D32';
            borderColor = '#C8E6C9';
        } else if (item.type === 'decryptor') {
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
                        {isAI ? 'AI' : item.type === 'encryptor' ? 'Encryptor' : 'Decryptor'}
                    </Text>
                    <Text style={[styles.timestamp, { color: textColor }]}>
                        {new Date(item.timestamp).toLocaleTimeString()}
                    </Text>
                </View>
                <Text style={[styles.turnContent, { color: textColor }]}>
                    {item.content}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Conversation History</Text>
            <FlatList
                data={conversation}
                keyExtractor={(item) => item.id}
                renderItem={renderTurn}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No messages yet</Text>
                        <Text style={styles.emptySubtext}>Start the conversation!</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        paddingHorizontal: 16,
        color: '#000000',
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