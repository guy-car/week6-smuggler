import io from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

// You can use an environment variable or hardcode for now
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

let socket: ReturnType<typeof io> | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('[WebSocket] Connected:', socket?.id);
      useGameStore.getState().setConnected(true);
      useGameStore.getState().setSocketId(socket?.id || null);
    });

    socket.on('disconnect', (reason: any) => {
      console.log('[WebSocket] Disconnected:', reason);
      useGameStore.getState().setConnected(false);
      useGameStore.getState().setSocketId(null);
    });

    socket.on('connect_error', (err: any) => {
      console.error('[WebSocket] Connection error:', err);
      useGameStore.getState().setConnected(false);
      useGameStore.getState().setSocketId(null);
    });

    // Room events
    socket.on('join_room_success', (data: { roomId: string; players: any[]; playerId: string }) => {
      console.log('[WebSocket] Join room success:', data.roomId);
      useGameStore.getState().setRoomId(data.roomId);
      useGameStore.getState().setPlayers(data.players);
      useGameStore.getState().setCurrentScreen('room');

      // Set temporary role based on player order for immediate navigation
      const currentPlayerId = data.playerId;
      const playerIndex = data.players.findIndex(p => p.id === currentPlayerId);
      const temporaryRole = playerIndex === 0 ? 'encryptor' : 'decryptor';
      useGameStore.getState().setPlayerRole(temporaryRole);

      // Set player info
      useGameStore.getState().setPlayer({
        id: data.playerId,
        name: `Player ${playerIndex + 1}`,
        ready: false,
        role: temporaryRole,
        socketId: socket?.id || ''
      });
    });

    socket.on('room:left', () => {
      console.log('[WebSocket] Left room');
      useGameStore.getState().setRoomId(null);
      useGameStore.getState().setPlayers([]);
      useGameStore.getState().setCurrentScreen('lobby');
    });

    socket.on('room:playerJoined', (data: { player: any }) => {
      console.log('[WebSocket] Player joined:', data.player);
      const currentPlayers = useGameStore.getState().players;
      useGameStore.getState().setPlayers([...currentPlayers, data.player]);
    });

    socket.on('room:playerLeft', (data: { playerId: string }) => {
      console.log('[WebSocket] Player left:', data.playerId);
      const currentPlayers = useGameStore.getState().players;
      const updatedPlayers = currentPlayers.filter(p => p.id !== data.playerId);
      useGameStore.getState().setPlayers(updatedPlayers);
    });

    socket.on('room:playerReady', (data: { playerId: string; ready: boolean }) => {
      console.log('[WebSocket] Player ready:', data.playerId, data.ready);
      const currentPlayers = useGameStore.getState().players;
      const updatedPlayers = currentPlayers.map(p =>
        p.id === data.playerId ? { ...p, ready: data.ready } : p
      );
      useGameStore.getState().setPlayers(updatedPlayers);

      // Update current player's ready status
      const currentPlayer = useGameStore.getState().player;
      if (currentPlayer && currentPlayer.id === data.playerId) {
        useGameStore.getState().setIsReady(data.ready);
      }
    });

    socket.on('room_list', (data: { rooms: any[] }) => {
      console.log('[WebSocket] Available rooms:', data.rooms);
      useGameStore.getState().setAvailableRooms(data.rooms);
    });

    // Game events
    socket.on('start_game', (data: { roomId: string; players: any[]; roles: any; secretWord: string }) => {
      console.log('[WebSocket] Game started:', data);
      useGameStore.getState().setGameStatus('active');
      useGameStore.getState().setPlayers(data.players);
      useGameStore.getState().setSecretWord(data.secretWord);

      // Set current player's actual role from backend
      const currentPlayer = useGameStore.getState().player;
      if (currentPlayer && data.roles[currentPlayer.id]) {
        useGameStore.getState().setPlayerRole(data.roles[currentPlayer.id]);
      }

      // Navigate to appropriate game screen
      const playerRole = useGameStore.getState().playerRole;
      if (playerRole === 'encryptor') {
        useGameStore.getState().setCurrentScreen('encryptor-game');
      } else if (playerRole === 'decryptor') {
        useGameStore.getState().setCurrentScreen('decryptor-game');
      }
    });

    socket.on('game:started', (data: { players: any[]; roles: any; secretWord: string }) => {
      console.log('[WebSocket] Game started:', data);
      useGameStore.getState().setGameStatus('active');
      useGameStore.getState().setPlayers(data.players);
      useGameStore.getState().setSecretWord(data.secretWord);

      // Set current player's role
      const currentPlayer = useGameStore.getState().player;
      if (currentPlayer && data.roles[currentPlayer.id]) {
        useGameStore.getState().setPlayerRole(data.roles[currentPlayer.id]);
      }

      // Navigate to appropriate game screen
      const playerRole = useGameStore.getState().playerRole;
      if (playerRole === 'encryptor') {
        useGameStore.getState().setCurrentScreen('encryptor-game');
      } else if (playerRole === 'decryptor') {
        useGameStore.getState().setCurrentScreen('decryptor-game');
      }
    });

    socket.on('game:ended', (data: { scores: any; winner: string }) => {
      console.log('[WebSocket] Game ended:', data);
      useGameStore.getState().setGameStatus('ended');
      useGameStore.getState().setCurrentScreen('game-end');

      // Update player scores
      const currentPlayer = useGameStore.getState().player;
      if (currentPlayer && data.scores[currentPlayer.id]) {
        useGameStore.getState().setScore(data.scores[currentPlayer.id]);
      }
    });

    socket.on('game:roundStart', (data: { round: number; word: string; role: string }) => {
      console.log('[WebSocket] Round start:', data);
      useGameStore.getState().setRound(data.round);
      useGameStore.getState().setSecretWord(data.word);
      useGameStore.getState().setPlayerRole(data.role as 'encryptor' | 'decryptor' | null);
    });

    socket.on('game:roundEnd', (data: { round: number; scores: any }) => {
      console.log('[WebSocket] Round end:', data);
      useGameStore.getState().setRound(data.round);

      // Update scores
      const currentPlayer = useGameStore.getState().player;
      if (currentPlayer && data.scores[currentPlayer.id]) {
        useGameStore.getState().setScore(data.scores[currentPlayer.id]);
      }
    });

    // Turn-based game events
    socket.on('game:turnStart', (data: { turn: 'encryptor' | 'ai' | 'decryptor' }) => {
      console.log('[WebSocket] Turn start:', data.turn);
      useGameStore.getState().setCurrentTurn(data.turn);
    });

    socket.on('game:turnEnd', () => {
      console.log('[WebSocket] Turn end');
      useGameStore.getState().setCurrentTurn(null);
    });

    // Message and conversation events
    socket.on('game:message', (data: { message: any }) => {
      console.log('[WebSocket] New message:', data.message);
      const turn: any = {
        id: data.message.id,
        type: data.message.type || 'hint',
        content: data.message.content,
        timestamp: data.message.timestamp,
        playerId: data.message.senderId
      };
      useGameStore.getState().addTurn(turn);
    });

    socket.on('game:messageHistory', (data: { messages: any[] }) => {
      console.log('[WebSocket] Message history:', data.messages);
      const turns = data.messages.map(msg => ({
        id: msg.id,
        type: msg.type || 'hint',
        content: msg.content,
        timestamp: msg.timestamp,
        playerId: msg.senderId
      }));
      useGameStore.getState().setConversationHistory(turns);
    });

    socket.on('game:aiThinking', (data: { content: string }) => {
      console.log('[WebSocket] AI thinking:', data.content);
      const turn = {
        id: `ai-thinking-${Date.now()}`,
        type: 'ai' as const,
        content: data.content,
        timestamp: new Date().toISOString(),
      };
      useGameStore.getState().addTurn(turn);
    });

    socket.on('game:aiGuess', (data: { guess: string; confidence: number }) => {
      console.log('[WebSocket] AI guess:', data.guess);
      const turn = {
        id: `ai-guess-${Date.now()}`,
        type: 'ai' as const,
        content: `AI guesses: ${data.guess} (confidence: ${data.confidence}%)`,
        timestamp: new Date().toISOString(),
      };
      useGameStore.getState().addTurn(turn);
    });

    // Error events
    socket.on('error', (data: { message: string }) => {
      console.error('[WebSocket] Error:', data.message);
      useGameStore.getState().setError(data.message);
    });

    socket.on('player_joined', (data: { roomId: string; player: any; players: any[] }) => {
      console.log('[WebSocket] Player joined:', data.player);
      useGameStore.getState().setPlayers(data.players);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    useGameStore.getState().reset();
  }
}

// Helper functions for emitting events
export async function createRoom(playerName: string = "Player") {
  // Call REST API to create a room
  const response = await fetch('http://localhost:3000/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (!response.ok) {
    throw new Error('Failed to create room');
  }
  const data = await response.json();
  if (data.success && data.roomId) {
    // Join the room via websocket
    joinRoom(data.roomId, playerName);
    return data.roomId;
  } else {
    throw new Error(data.message || 'Failed to create room');
  }
}

export function joinRoom(roomId: string, playerName: string = "Player") {
  const socket = getSocket();
  socket.emit('join_room', { roomId, playerName });
}

export function leaveRoom() {
  const socket = getSocket();
  socket.emit('room:leave');
}

export function setPlayerReady(ready: boolean) {
  const socket = getSocket();
  socket.emit('room:ready', { ready });
}

export function getAvailableRooms() {
  const socket = getSocket();
  socket.emit('list_rooms');
}

export function sendMessage(content: string) {
  const socket = getSocket();
  socket.emit('game:message', { content });
}

export function submitGuess(guess: string) {
  const socket = getSocket();
  socket.emit('game:guess', { guess });
}

export function submitWord(word: string) {
  const socket = getSocket();
  socket.emit('game:word', { word });
}

export function startGame() {
  const socket = getSocket();
  const roomId = useGameStore.getState().roomId;
  if (roomId) {
    socket.emit('start_game', { roomId });
  }
} 