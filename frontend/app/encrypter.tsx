import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import InputSubmit from '../components/InputSubmit';
import MessageModal from '../components/MessageModal';
import { leaveRoom, sendMessage, setPlayerReady, submitWord } from '../services/websocket';
import { useGameStore } from '../store/gameStore';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function EncrypterScreen() {
  const {
    connected,
    roomId,
    players,
    gameStatus,
    role,
    round,
    score,
    messages,
    setMessages
  } = useGameStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [hasOpenedMessage, setHasOpenedMessage] = useState(false);
  const [localMessages, setLocalMessages] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string>('');

  useEffect(() => {
    // If not connected or no room, go back to home
    if (!connected || !roomId) {
      router.replace('/');
    }
  }, [connected, roomId]);

  useEffect(() => {
    // If game starts, show the message modal
    if (gameStatus === 'active' && role === 'encryptor') {
      setModalVisible(true);
    }
  }, [gameStatus, role]);

  const handleReady = () => {
    setPlayerReady(true);
  };

  const handleNotReady = () => {
    setPlayerReady(false);
  };

  const openMessage = () => {
    console.log('Encrypter: openMessage called');
    try {
      setModalVisible(true);
      setHasOpenedMessage(true);
      console.log('Encrypter: modalVisible set to true, hasOpenedMessage set to true');
    } catch (error) {
      console.error('Encrypter: error setting modal visible:', error);
    }
  };

  const closeModal = () => {
    console.log('Encrypter: closeModal called');
    setModalVisible(false);
  };

  const handleInputSubmit = (value: string) => {
    if (gameStatus === 'active' && role === 'encryptor') {
      // Submit word to backend
      submitWord(value);
      setCurrentWord(value);
    } else {
      // Send chat message
      sendMessage(value);
    }
    setLocalMessages(prev => [...prev, value]);
    console.log('Encrypter: submitted:', value);
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveRoom();
            router.replace('/');
          }
        }
      ]
    );
  };

  const getReadyPlayersCount = () => {
    return players.filter(p => p.ready).length;
  };

  const getCurrentPlayer = () => {
    return players.find(p => p.socketId === useGameStore.getState().player?.socketId);
  };

  const isCurrentPlayerReady = () => {
    const currentPlayer = getCurrentPlayer();
    return currentPlayer?.ready || false;
  };

  console.log('Encrypter: rendering with modalVisible:', modalVisible, 'hasOpenedMessage:', hasOpenedMessage);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.container}>
        {/* Connection Status */}
        <View style={styles.statusBar}>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.statusText}>
            {connected ? 'Connected' : 'Disconnected'}
          </Text>
          {roomId && (
            <Text style={styles.roomText}>Room: {roomId}</Text>
          )}
        </View>

        {/* Game Controls */}
        <View style={styles.topLeftControls} pointerEvents="box-none">
          {gameStatus === 'waiting' && (
            <>
              <TouchableOpacity
                style={[styles.button, isCurrentPlayerReady() ? styles.stopButton : styles.startButton]}
                onPress={isCurrentPlayerReady() ? handleNotReady : handleReady}
              >
                <Text style={styles.buttonText}>
                  {isCurrentPlayerReady() ? 'Not Ready' : 'Ready'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {gameStatus === 'active' && role === 'encryptor' && (
            <TouchableOpacity
              style={styles.openMessageButton}
              onPress={openMessage}
            >
              <Text style={styles.openMessageButtonText}>Open Message</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.homeButton} onPress={handleLeaveRoom}>
          <Text style={styles.homeButtonText}>Leave Room</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Encrypter</Text>

        {/* Game Info */}
        <View style={styles.gameInfo}>
          <Text style={styles.gameStatus}>Status: {gameStatus}</Text>
          {gameStatus === 'active' && (
            <>
              <Text style={styles.roundInfo}>Round: {round}</Text>
              <Text style={styles.scoreInfo}>Score: {score}</Text>
              <Text style={styles.roleInfo}>Role: {role}</Text>
            </>
          )}
        </View>

        {/* Players List */}
        <View style={styles.playersContainer}>
          <Text style={styles.playersTitle}>Players ({players.length})</Text>
          <ScrollView style={styles.playersList}>
            {players.map((player) => (
              <View key={player.id} style={styles.playerItem}>
                <Text style={styles.playerName}>{player.name}</Text>
                <View style={[styles.readyIndicator, { backgroundColor: player.ready ? '#4CAF50' : '#ccc' }]} />
                {player.role && (
                  <Text style={styles.playerRole}>{player.role}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Waiting for Players */}
        {gameStatus === 'waiting' && (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>
              Waiting for players... ({getReadyPlayersCount()}/{players.length} ready)
            </Text>
            {players.length >= 2 && getReadyPlayersCount() === players.length && (
              <Text style={styles.readyText}>All players ready! Game will start soon...</Text>
            )}
          </View>
        )}

        <MessageModal
          visible={modalVisible}
          onClose={closeModal}
          message="Finally, another human I can trust. Your message is DOG. Handle it with care."
        />

        {!modalVisible && hasOpenedMessage && gameStatus === 'active' && role === 'encryptor' && (
          <View style={styles.inputSubmitWrapper}>
            <InputSubmit
              placeholder="Give a clue to your accomplice... Don't get intercepted."
              onSubmit={handleInputSubmit}
              messages={localMessages}
            />
          </View>
        )}

        {/* Chat Messages */}
        {gameStatus === 'active' && (
          <View style={styles.chatContainer}>
            <Text style={styles.chatTitle}>Messages</Text>
            <ScrollView style={styles.chatList}>
              {messages.map((msg, index) => (
                <View key={index} style={styles.messageItem}>
                  <Text style={styles.messageSender}>{msg.senderId}</Text>
                  <Text style={styles.messageContent}>{msg.content}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  roomText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  topLeftControls: {
    position: 'absolute',
    top: 120,
    left: 20,
    alignItems: 'flex-start',
    gap: 8,
    zIndex: 100,
    elevation: 100,
    pointerEvents: 'box-none',
  },
  homeButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: '#FF3B30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 0,
    elevation: 2,
    zIndex: 101,
  },
  homeButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 180,
  },
  gameInfo: {
    alignItems: 'center',
    marginTop: 20,
    gap: 5,
  },
  gameStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  roundInfo: {
    fontSize: 14,
    color: '#666',
  },
  scoreInfo: {
    fontSize: 14,
    color: '#666',
  },
  roleInfo: {
    fontSize: 14,
    color: '#666',
  },
  playersContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  playersList: {
    maxHeight: 100,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    gap: 10,
  },
  playerName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  readyIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  playerRole: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  waitingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  waitingText: {
    fontSize: 16,
    color: '#666',
  },
  readyText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 5,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 80,
  },
  startButton: {
    backgroundColor: '#34C759', // Green color
  },
  stopButton: {
    backgroundColor: '#FF3B30', // Red color
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  openMessageButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
    minWidth: 0,
    elevation: 2,
  },
  openMessageButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  inputSubmitWrapper: {
    position: 'absolute',
    bottom: 40,
    left: (SCREEN_WIDTH * 0.2),
    width: SCREEN_WIDTH * 0.6,
    alignItems: 'center',
    zIndex: 10,
  },
  chatContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    maxHeight: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  chatList: {
    flex: 1,
  },
  messageItem: {
    marginBottom: 5,
  },
  messageSender: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  messageContent: {
    fontSize: 12,
    color: '#333',
  },
}); 