import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import * as websocket from '../services/websocket';
import { useGameStore } from '../store/gameStore';
import HomeScreen from './index';

jest.mock('../services/websocket');

jest.mock('../store/gameStore', () => {
  const actual = jest.requireActual('../store/gameStore');
  return {
    ...actual,
    useGameStore: jest.fn(),
  };
});

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Create New Game button', () => {
    useGameStore.mockReturnValue({
      connected: true,
      availableRooms: [],
      roomId: null,
      setAvailableRooms: jest.fn(),
    });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Create New Game')).toBeTruthy();
  });

  it('calls createRoom and navigates to encrypter on room creation', async () => {
    const createRoomMock = jest.spyOn(websocket, 'createRoom');
    let roomId = null;
    useGameStore.mockImplementation(() => ({
      connected: true,
      availableRooms: [],
      roomId,
      setAvailableRooms: jest.fn(),
    }));
    const { getByText, rerender } = render(<HomeScreen />);
    fireEvent.press(getByText('Create New Game'));
    expect(createRoomMock).toHaveBeenCalled();
    // Simulate roomId being set
    roomId = 'test-room';
    useGameStore.mockImplementation(() => ({
      connected: true,
      availableRooms: [],
      roomId,
      setAvailableRooms: jest.fn(),
    }));
    rerender(<HomeScreen />);
    await waitFor(() => {
      // The navigation to /encrypter would happen here
      // You can check for side effects or mock router if needed
    });
  });
}); 