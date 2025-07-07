import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface InputSubmitProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
  messages?: string[];
}

export default function InputSubmit({ placeholder, onSubmit, messages = [] }: InputSubmitProps) {
  const [input, setInput] = useState('');

  const handlePress = () => {
    if (input.trim() !== '') {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <View style={styles.container}>
      {messages.length > 0 && (
        <View style={styles.messagesContainer}>
          <ScrollView contentContainerStyle={styles.messagesScroll} showsVerticalScrollIndicator={false}>
            {messages.map((msg, idx) => (
              <View key={idx} style={styles.messageBubble}>
                <Text style={styles.messageText}>{msg}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.submitButton} onPress={handlePress}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  messagesContainer: {
    width: '100%',
    maxHeight: 120,
    marginBottom: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 8,
  },
  messagesScroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#333',
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f7f7f7',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 