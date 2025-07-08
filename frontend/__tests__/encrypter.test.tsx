import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import * as websocket from '../services/websocket';
import { useGameStore } from '../store/gameStore';
import EncrypterScreen from './encrypter';

jest.mock('../store/gameStore', () => {
  const actual = jest.requireActual('../store/gameStore');
  return {
    ...actual,
    useGameStore: jest.fn(),
  };
});

jest.mock('../services/websocket');

describe('EncrypterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows Ready button and updates state', () => {
    const setPlayerReady = jest.fn();
    useGameStore.mockReturnValue({
      connected: true,
      roomId: 'room1',
      players: [{ id: '1', name: 'A', ready: false, role: 'encryptor', socketId: 's1' }],
      gameStatus: 'waiting',
      role: 'encryptor',
      round: 1,
      score: 0,
      messages: [],
      setPlayerReady,
      setMessages: jest.fn(),
    });
    const { getByText } = render(<EncrypterScreen />);
    fireEvent.press(getByText('Ready'));
    expect(websocket.setPlayerReady).toHaveBeenCalledWith(true);
  });

  it('shows encrypter UI when role is encryptor', () => {
    useGameStore.mockReturnValue({
      connected: true,
      roomId: 'room1',
      players: [{ id: '1', name: 'A', ready: true, role: 'encryptor', socketId: 's1' }],
      gameStatus: 'active',
      role: 'encryptor',
      round: 1,
      score: 0,
      messages: [],
      setMessages: jest.fn(),
    });
    const { getByText } = render(<EncrypterScreen />);
    expect(getByText('Encrypter')).toBeTruthy();
    expect(getByText('Role: encryptor')).toBeTruthy();
  });
}); 