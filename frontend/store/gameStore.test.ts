import { act } from 'react-test-renderer';
import { useGameStore } from './gameStore';

describe('gameStore', () => {
  it('setConnected updates connected state', () => {
    act(() => {
      useGameStore.getState().setConnected(true);
    });
    expect(useGameStore.getState().connected).toBe(true);
  });

  it('setRoomId updates roomId', () => {
    act(() => {
      useGameStore.getState().setRoomId('room123');
    });
    expect(useGameStore.getState().roomId).toBe('room123');
  });

  it('addMessage adds a message', () => {
    const msg = { id: '1', content: 'hello', senderId: 'a', timestamp: 'now' };
    act(() => {
      useGameStore.getState().addMessage(msg);
    });
    expect(useGameStore.getState().messages).toContainEqual(msg);
  });
}); 