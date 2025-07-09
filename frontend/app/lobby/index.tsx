import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Text, TextInput, View } from 'react-native';
import { createRoom, getAvailableRooms, getSocket, joinRoom } from '../../services/websocket';
import { useGameStore } from '../../store/gameStore';

const LobbyScreen = () => {
    const availableRooms = useGameStore((s) => s.availableRooms);
    const connected = useGameStore((s) => s.connected);
    const [playerName, setPlayerName] = useState('');
    const [roomIdInput, setRoomIdInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (connected) {
            // Enter lobby to receive real-time updates
            getSocket().emit('enter_lobby');
            getAvailableRooms();
        }
    }, [connected]);

    // Cleanup effect to leave lobby when component unmounts
    useEffect(() => {
        return () => {
            if (connected) {
                getSocket().emit('leave_lobby');
            }
        };
    }, [connected]);

    const handleCreateRoom = async () => {
        setLoading(true);
        setError(null);
        try {
            await createRoom(playerName || `Player${Math.floor(Math.random() * 1000)}`);
            // Navigation will be handled by WebSocket events when room is joined
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
        // Navigation will be handled by WebSocket events when room is joined
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
            {/*
            <Text style={{ marginVertical: 16, fontWeight: 'bold' }}>Or join a room:</Text>
            <TextInput
                placeholder="Room ID"
                value={roomIdInput}
                onChangeText={setRoomIdInput}
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }}
            />
            <Button title="Join Room" onPress={handleJoinRoom} disabled={loading || !connected} />
            */}
            <Text style={{ marginVertical: 16, fontWeight: 'bold' }}>Available Rooms:</Text>
            {loading && <ActivityIndicator />}
            {error && <Text style={{ color: 'red' }}>{error}</Text>}
            <FlatList
                data={availableRooms}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={{ padding: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
                        <Text>Room ID: {item.id} ({item.playerCount}/{item.maxPlayers})</Text>
                        <Button title="Join Room" onPress={() => joinRoom(item.id, playerName || `Player${Math.floor(Math.random() * 1000)}`)} />
                    </View>
                )}
                ListEmptyComponent={<Text>No rooms available.</Text>}
            />
        </View>
    );
};

export default LobbyScreen; 