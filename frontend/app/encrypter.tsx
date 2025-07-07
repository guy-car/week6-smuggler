import { router } from 'expo-router';
import { useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import InputSubmit from '../components/InputSubmit';
import MessageModal from '../components/MessageModal';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function EncrypterScreen() {
  const [gameStarted, setGameStarted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasOpenedMessage, setHasOpenedMessage] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const toggleGame = () => {
    setGameStarted(!gameStarted);
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
    setMessages(prev => [...prev, value]);
    console.log('Encrypter: clue submitted:', value);
  };

  const goHome = () => {
    router.replace('/');
  };

  console.log('Encrypter: rendering with modalVisible:', modalVisible, 'hasOpenedMessage:', hasOpenedMessage);
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.container}>
        <View style={styles.topLeftControls} pointerEvents="box-none">
          <TouchableOpacity 
            style={[styles.button, gameStarted ? styles.stopButton : styles.startButton]} 
            onPress={toggleGame}
          >
            <Text style={styles.buttonText}>
              {gameStarted ? 'Stop' : 'Start'}
            </Text>
          </TouchableOpacity>
          {gameStarted && (
            <TouchableOpacity 
              style={styles.openMessageButton} 
              onPress={openMessage}
            >
              <Text style={styles.openMessageButtonText}>Open Message</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.homeButton} onPress={goHome}>
          <Text style={styles.homeButtonText}>Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Encrypter</Text>
        <MessageModal
          visible={modalVisible}
          onClose={closeModal}
          message="Finally, another human I can trust. Your message is DOG. Handle it with care."
        />
        {!modalVisible && hasOpenedMessage && (
          <View style={styles.inputSubmitWrapper}>
            <InputSubmit
              placeholder="Give a clue to your accomplice... Don't get intercepted."
              onSubmit={handleInputSubmit}
              messages={messages}
            />
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
  topLeftControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    alignItems: 'flex-start',
    gap: 8,
    zIndex: 100,
    elevation: 100,
    pointerEvents: 'box-none',
  },
  homeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 0,
    elevation: 2,
    zIndex: 101,
  },
  homeButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 100,
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
    backgroundColor: '#eee',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
    minWidth: 0,
    elevation: 2,
  },
  openMessageButtonText: {
    color: '#007AFF',
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
  inputSubmitOverlay: {
    position: 'absolute',
    bottom: 40,
    left: (SCREEN_WIDTH * 0.2),
    width: SCREEN_WIDTH * 0.6,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
    pointerEvents: 'box-none',
  },
}); 