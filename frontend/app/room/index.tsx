import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Button, FlatList, Text, View } from 'react-native';
import { leaveRoom, setPlayerReady } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';

const RoomScreen = () => {
    const router = useRouter();
    const roomId = useGameStore((s) => s.roomId);
    const players = useGameStore((s) => s.players);
    const player = useGameStore((s) => s.player);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isReady = player?.ready;

    const handleReadyToggle = () => {
        setLoading(true);
        setError(null);
        try {
            setPlayerReady(!isReady);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLeave = () => {
        leaveRoom();
        router.replace('../lobby');
    };

    return (
        <View style={{ flex: 1, padding: 24, backgroundColor: '#F2F2F7' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 12 }}>Room: {roomId}</Text>
            <Button title="Leave Room" onPress={handleLeave} color="#FF3B30" />
            <Text style={{ marginVertical: 16, fontWeight: 'bold' }}>Players:</Text>
            {loading && <ActivityIndicator />}
            {error && <Text style={{ color: 'red' }}>{error}</Text>}
            <FlatList
                data={players}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}>
                        <Text style={{ flex: 1 }}>{item.name} {item.id === player?.id ? '(You)' : ''}</Text>
                        <Text style={{ color: item.ready ? '#34C759' : '#FF3B30' }}>{item.ready ? 'Ready' : 'Not Ready'}</Text>
                    </View>
                )}
                ListEmptyComponent={<Text>No players in room.</Text>}
            />
            <Button
                title={isReady ? 'Unready' : 'Ready'}
                onPress={handleReadyToggle}
                color={isReady ? '#FF3B30' : '#34C759'}
                disabled={loading}
            />
        </View>
    );
};

export default RoomScreen; 