import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MessageModal from '../components/MessageModal';

export default function EncrypterScreen() {
  const [gameStarted, setGameStarted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const toggleGame = () => {
    setGameStarted(!gameStarted);
  };

  const openMessage = () => {
    console.log('Encrypter: openMessage called');
    try {
      setModalVisible(true);
      console.log('Encrypter: modalVisible set to true');
    } catch (error) {
      console.error('Encrypter: error setting modal visible:', error);
    }
  };

  const closeModal = () => {
    console.log('Encrypter: closeModal called');
    setModalVisible(false);
  };

  console.log('Encrypter: rendering with modalVisible:', modalVisible);
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, gameStarted ? styles.stopButton : styles.startButton]} 
        onPress={toggleGame}
      >
        <Text style={styles.buttonText}>
          {gameStarted ? 'Stop' : 'Start'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Encrypter</Text>
      
      {gameStarted && (
        <TouchableOpacity 
          style={styles.messageButton} 
          onPress={openMessage}
        >
          <Text style={styles.messageButtonText}>Open Message</Text>
        </TouchableOpacity>
      )}

      <MessageModal
        visible={modalVisible}
        onClose={closeModal}
        message="This is a sample message. In the real game, this would contain the encrypted message that the AI will try to decode."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 100,
  },
  button: {
    position: 'absolute',
    top: 50,
    left: 20,
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
  messageButton: {
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
    alignSelf: 'center',
    marginTop: 50,
    minWidth: 200,
  },
  messageButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 