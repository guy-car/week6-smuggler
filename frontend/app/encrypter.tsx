import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EncrypterScreen() {
  const [gameStarted, setGameStarted] = useState(false);

  const toggleGame = () => {
    setGameStarted(!gameStarted);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Encrypter</Text>
      
      <TouchableOpacity 
        style={[styles.button, gameStarted ? styles.stopButton : styles.startButton]} 
        onPress={toggleGame}
      >
        <Text style={styles.buttonText}>
          {gameStarted ? 'Stop Game' : 'Start Game'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 60,
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    minWidth: 200,
  },
  startButton: {
    backgroundColor: '#34C759', // Green color
  },
  stopButton: {
    backgroundColor: '#FF3B30', // Red color
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
}); 