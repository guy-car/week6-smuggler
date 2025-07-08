import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createRoom, getAvailableRooms, getSocket, joinRoom } from '../services/websocket';
import { useGameStore } from '../store/gameStore';

export default function HomeScreen() {
  const { 
    connected, 
    availableRooms, 
    roomId, 
    setAvailableRooms 
  } = useGameStore();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    getSocket();
    
    // Load available rooms
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      getAvailableRooms();
    } catch (error) {
      console.error('Failed to load rooms:', error);
      Alert.alert('Error', 'Failed to load available rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const playerName = 'Player';
      const roomId = await createRoom(playerName);
      // Redirect to encrypter screen after room creation
      router.push('/encrypter');
    } catch (error: any) {
      console.error('Failed to create room:', error);
      Alert.alert('Error', error.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    setLoading(true);
    try {
      joinRoom(roomId);
    } catch (error) {
      console.error('Failed to join room:', error);
      Alert.alert('Error', 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      getAvailableRooms();
    } catch (error) {
      console.error('Failed to refresh rooms:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderRoom = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.roomItem}
      onPress={() => handleJoinRoom(item.id)}
      disabled={loading}
    >
      <Text style={styles.roomId}>Room {item.id}</Text>
      <Text style={styles.roomInfo}>
        {item.playerCount}/{item.maxPlayers} players
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smuggler</Text>
      
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: connected ? '#4CAF50' : '#F44336' }]} />
        <Text style={styles.statusText}>
          {connected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.createButton]} 
          onPress={handleCreateRoom}
          disabled={loading || !connected}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Create New Game</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.roomsContainer}>
        <Text style={styles.sectionTitle}>Available Rooms</Text>
        
        {loading && availableRooms.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading rooms...</Text>
          </View>
        ) : (
          <FlatList
            data={availableRooms}
            renderItem={renderRoom}
            keyExtractor={(item) => item.id}
            style={styles.roomList}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No rooms available. Create one to get started!
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  roomsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  roomList: {
    flex: 1,
  },
  roomItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roomId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  roomInfo: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
  },
});
