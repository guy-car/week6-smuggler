import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import * as websocket from '../services/websocket';
import { useGameStore } from '../store/gameStore';
import DecrypterScreen from './decrypter';

jest.mock('../store/gameStore', () => {
  const actual = jest.requireActual('../store/gameStore');
  return {
    ...actual,
    useGameStore: jest.fn(),
  };
});

jest.mock('../services/websocket');

describe('DecrypterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows decrypter UI when role is decryptor', () => {
    useGameStore.mockReturnValue({
      connected: true,
      roomId: 'room1',
      players: [{ id: '1', name: 'A', ready: true, role: 'decryptor', socketId: 's1' }],
      gameStatus: 'active',
      role: 'decryptor',
      round: 1,
      score: 0,
      messages: [],
    });
    const { getByText } = render(<DecrypterScreen />);
    expect(getByText('Decrypter')).toBeTruthy();
    expect(getByText('Role: decryptor')).toBeTruthy();
  });

  it('sends guess when input is submitted', () => {
    useGameStore.mockReturnValue({
      connected: true,
      roomId: 'room1',
      players: [{ id: '1', name: 'A', ready: true, role: 'decryptor', socketId: 's1' }],
      gameStatus: 'active',
      role: 'decryptor',
      round: 1,
      score: 0,
      messages: [],
    });
    const { getByPlaceholderText } = render(<DecrypterScreen />);
    const input = getByPlaceholderText('Type your guess or a message...');
    fireEvent.changeText(input, 'DOG');
    fireEvent(input, 'submitEditing', { nativeEvent: { text: 'DOG' } });
    expect(websocket.submitGuess).toHaveBeenCalledWith('DOG');
  });
}); 