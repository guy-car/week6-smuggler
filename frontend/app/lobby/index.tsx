import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Text, TextInput, View } from 'react-native';
import { createRoom, getAvailableRooms, joinRoom } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';

const LobbyScreen = () => {
    const router = useRouter();
    const availableRooms = useGameStore((s) => s.availableRooms);
    const connected = useGameStore((s) => s.connected);
    const [playerName, setPlayerName] = useState('');
    const [roomIdInput, setRoomIdInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (connected) getAvailableRooms();
    }, [connected]);

    const handleCreateRoom = async () => {
        setLoading(true);
        setError(null);
        try {
            await createRoom(playerName || `Player${Math.floor(Math.random() * 1000)}`);
            router.push('../room');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = () => {
        if (!roomIdInput) {
            setError('Enter a room ID');
            return;
        }
        setError(null);
        joinRoom(roomIdInput, playerName || `Player${Math.floor(Math.random() * 1000)}`);
        router.push('../room');
    };

    return (
        <View style={{ flex: 1, padding: 24, backgroundColor: '#F2F2F7' }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16 }}>Lobby</Text>
            <TextInput
                placeholder="Enter your name (optional)"
                value={playerName}
                onChangeText={setPlayerName}
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 12 }}
            />
            <Button title="Create Room" onPress={handleCreateRoom} disabled={loading || !connected} />
            <Text style={{ marginVertical: 16, fontWeight: 'bold' }}>Or join a room:</Text>
            <TextInput
                placeholder="Room ID"
                value={roomIdInput}
                onChangeText={setRoomIdInput}
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }}
            />
            <Button title="Join Room" onPress={handleJoinRoom} disabled={loading || !connected} />
            <Text style={{ marginVertical: 16, fontWeight: 'bold' }}>Available Rooms:</Text>
            {loading && <ActivityIndicator />}
            {error && <Text style={{ color: 'red' }}>{error}</Text>}
            <FlatList
                data={availableRooms}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={{ padding: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
                        <Text>Room ID: {item.id} ({item.playerCount}/{item.maxPlayers})</Text>
                        <Button title="Select" onPress={() => setRoomIdInput(item.id)} />
                    </View>
                )}
                ListEmptyComponent={<Text>No rooms available.</Text>}
            />
        </View>
    );
};

export default LobbyScreen; 