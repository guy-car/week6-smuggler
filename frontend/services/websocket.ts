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

    socket.on('player_ready', (data: { roomId: string; playerId: string; players: any[] }) => {
      console.log('[WebSocket] Player ready:', data.playerId, data.players);
      // Update players list with the latest state from backend
      useGameStore.getState().setPlayers(data.players);

      // Update current player's ready status based on the updated players list
      const currentPlayer = useGameStore.getState().player;
      if (currentPlayer) {
        const updatedPlayer = data.players.find(p => p.id === currentPlayer.id);
        if (updatedPlayer) {
          useGameStore.getState().setIsReady(updatedPlayer.ready);
        }
      }
    });

    // Add listeners for player_ready_success and player_ready_error
    socket.on('player_ready_success', (data: { roomId: string; players: any[] }) => {
      console.log('[WebSocket] Player ready success:', data);
      // Update players list with the latest state from backend
      useGameStore.getState().setPlayers(data.players);

      // Update current player's ready status based on the updated players list
      const currentPlayer = useGameStore.getState().player;
      if (currentPlayer) {
        const updatedPlayer = data.players.find(p => p.id === currentPlayer.id);
        if (updatedPlayer) {
          useGameStore.getState().setIsReady(updatedPlayer.ready);
        }
      }
    });
    socket.on('player_ready_error', (data: { message: string }) => {
      useGameStore.getState().setError(data.message);
    });

    // Add listener for room_ready event (when both players are ready)
    socket.on('room_ready', (data: { roomId: string; players: any[] }) => {
      console.log('[WebSocket] Room ready, starting game automatically:', data.roomId);
      // Only the first player should start the game to prevent double starts
      const currentPlayer = useGameStore.getState().player;
      if (currentPlayer && data.players.length > 0 && currentPlayer.id === data.players[0].id) {
        const roomId = useGameStore.getState().roomId;
        if (roomId && socket) {
          socket!.emit('start_game', { roomId });
        }
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
      if (currentPlayer) {
        // Find the player in the updated players list to get their role
        const updatedPlayer = data.players.find(p => p.id === currentPlayer.id);
        if (updatedPlayer && updatedPlayer.role) {
          useGameStore.getState().setPlayerRole(updatedPlayer.role);
        }
      }

      // Set the initial turn to encryptor
      useGameStore.getState().setCurrentTurn('encryptor');

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
      if (currentPlayer) {
        // Find the player in the updated players list to get their role
        const updatedPlayer = data.players.find(p => p.id === currentPlayer.id);
        if (updatedPlayer && updatedPlayer.role) {
          useGameStore.getState().setPlayerRole(updatedPlayer.role);
        }
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

    // AI response event: update turn and optionally conversation
    socket.on('ai_response', (data: any) => {
      console.log('[WebSocket] AI response:', data);
      useGameStore.getState().setCurrentTurn(data.currentTurn);
    });

    // Message received (from other player)
    socket.on('message_received', (data: any) => {
      console.log('[WebSocket] Message received:', data);
      // Add to conversation history
      useGameStore.getState().addTurn({
        id: data.message.id || `${data.message.senderId}-${Date.now()}`,
        type: data.message.type || 'hint',
        content: data.message.content,
        timestamp: data.message.timestamp,
        playerId: data.message.senderId
      });
      // Update turn if included
      if (data.currentTurn) {
        useGameStore.getState().setCurrentTurn(data.currentTurn);
      }
    });

    // Message sent (confirmation to sender)
    socket.on('message_sent', (data: any) => {
      console.log('[WebSocket] Message sent:', data);
      useGameStore.getState().addTurn({
        id: data.message.id || `${data.message.senderId}-${Date.now()}`,
        type: data.message.type || 'hint',
        content: data.message.content,
        timestamp: data.message.timestamp,
        playerId: data.message.senderId
      });
      if (data.currentTurn) {
        useGameStore.getState().setCurrentTurn(data.currentTurn);
      }
    });

    // Game end event
    socket.on('game_end', (data: any) => {
      console.log('[WebSocket] Game end:', data);
      useGameStore.getState().setGameStatus('ended');
      useGameStore.getState().setCurrentScreen('game-end');
      if (data.finalScore !== undefined) {
        useGameStore.getState().setScore(data.finalScore);
      }
    });

    // Round end event
    socket.on('round_end', (data: any) => {
      console.log('[WebSocket] Round end:', data);
      useGameStore.getState().setRound(data.round || 1);
      if (data.score !== undefined) {
        useGameStore.getState().setScore(data.score);
      }
      // Optionally update secret word for next round
      if (data.newSecretWord) {
        useGameStore.getState().setSecretWord(data.newSecretWord);
      }
    });

    // Guess result event
    socket.on('guess_result', (data: any) => {
      console.log('[WebSocket] Guess result:', data);
      // Optionally update score
      if (data.score !== undefined) {
        useGameStore.getState().setScore(data.score);
      }
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

    // Leave room events
    socket.on('leave_room_success', (data: { roomId: string; playerId: string }) => {
      console.log('[WebSocket] Leave room success:', data);
      useGameStore.getState().setRoomId(null);
      useGameStore.getState().setPlayers([]);
      useGameStore.getState().setCurrentScreen('lobby');
      useGameStore.getState().reset();
      // Note: Navigation is now handled by the component itself for better UX
    });

    socket.on('leave_room_error', (data: { roomId: string; error: string }) => {
      console.error('[WebSocket] Leave room error:', data.error);
      useGameStore.getState().setError(data.error);
    });

    socket.on('player_left', (data: { roomId: string; playerId: string; players: any[] }) => {
      console.log('[WebSocket] Player left:', data.playerId);
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
  console.log('[WebSocket] leaveRoom() called');
  const socket = getSocket();
  const roomId = useGameStore.getState().roomId;
  console.log('[WebSocket] Current roomId:', roomId);
  console.log('[WebSocket] Socket connected:', socket?.connected);

  if (!roomId) {
    console.error('[WebSocket] No room ID found');
    useGameStore.getState().setError('No room ID found');
    return;
  }

  console.log('[WebSocket] Emitting room:leave with roomId:', roomId);
  socket.emit('room:leave', { roomId });
  console.log('[WebSocket] room:leave event emitted');
}

export function setPlayerReady(ready: boolean) {
  const socket = getSocket();
  const roomId = useGameStore.getState().roomId;
  if (!roomId) {
    useGameStore.getState().setError('No room ID found');
    return;
  }
  socket.emit('player_ready', { roomId, ready });
}

export function getAvailableRooms() {
  const socket = getSocket();
  socket.emit('list_rooms');
}

export function sendMessage(content: string) {
  const socket = getSocket();
  const roomId = useGameStore.getState().roomId;
  if (!roomId) {
    useGameStore.getState().setError('No room ID found');
    return;
  }
  // Backend expects 'send_message' with { roomId, message }
  socket.emit('send_message', { roomId, message: content });
}

export function submitGuess(guess: string) {
  const socket = getSocket();
  const roomId = useGameStore.getState().roomId;
  if (!roomId) {
    useGameStore.getState().setError('No room ID found');
    return;
  }
  // Backend expects 'player_guess' with { roomId, guess }
  socket.emit('player_guess', { roomId, guess });
}

// The backend does not use 'game:word', so we comment this out for now
// export function submitWord(word: string) {
//   const socket = getSocket();
//   socket.emit('game:word', { word });
// }

export function startGame() {
  const socket = getSocket();
  const roomId = useGameStore.getState().roomId;
  if (roomId) {
    socket.emit('start_game', { roomId });
  }
} 