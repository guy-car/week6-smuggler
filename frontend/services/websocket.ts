import io from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

// You can use an environment variable or hardcode for now
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Debug logging
console.log('[WebSocket] Attempting to connect to:', BACKEND_URL);

let socket: ReturnType<typeof io> | null = null;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export function getSocket() {
  if (!socket) {
    console.log('[WebSocket] Creating new socket connection to:', BACKEND_URL);
    socket = io(BACKEND_URL, {
      transports: ['websocket'],
      autoConnect: true,
      timeout: 10000, // 10 second timeout
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: MAX_RETRIES,
      reconnectionDelay: RETRY_DELAY,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('[WebSocket] Connected:', socket?.id);
      retryCount = 0; // Reset retry count on successful connection
      useGameStore.getState().setConnected(true);
      useGameStore.getState().setSocketId(socket?.id || null);
      useGameStore.getState().setError(null);
    });

    socket.on('disconnect', (reason: any) => {
      console.log('[WebSocket] Disconnected:', reason);
      useGameStore.getState().setConnected(false);
      useGameStore.getState().setSocketId(null);

      // Set appropriate error message based on disconnect reason
      if (reason === 'io server disconnect') {
        useGameStore.getState().setError('Server disconnected. Please try reconnecting.');
      } else if (reason === 'io client disconnect') {
        useGameStore.getState().setError('Connection was closed by the client.');
      } else if (reason === 'transport close') {
        useGameStore.getState().setError('Network connection was lost. Check your internet connection.');
      } else {
        useGameStore.getState().setError(`Connection lost: ${reason}`);
      }
    });

    socket.on('connect_error', (err: any) => {
      console.error('[WebSocket] Connection error:', err);
      console.error('[WebSocket] Error details:', {
        message: err.message,
        description: err.description,
        context: err.context,
        type: err.type,
        stack: err.stack
      });
      console.error('[WebSocket] Full error object:', JSON.stringify(err, null, 2));

      retryCount++;
      useGameStore.getState().setConnected(false);
      useGameStore.getState().setSocketId(null);

      // Provide more specific error messages for mobile connection issues
      let errorMessage = 'Failed to connect to server';

      if (err.message?.includes('Failed to connect to')) {
        errorMessage = `Cannot reach server at ${BACKEND_URL}. Check if the server is running and your device is on the same network.`;
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Connection timed out. The server may be overloaded or unreachable.';
      } else if (err.message?.includes('CORS') || err.message?.includes('cors')) {
        errorMessage = 'CORS policy error. The server rejected the connection due to security restrictions.';
      } else if (err.type === 'TransportError') {
        errorMessage = `Network transport error: ${err.message || 'Cannot establish connection to server'}`;
      } else if (retryCount >= MAX_RETRIES) {
        errorMessage = `Connection failed after ${MAX_RETRIES} attempts. Please check your network and try again.`;
      } else {
        errorMessage = `Connection error: ${err.message || 'Unknown error occurred'}`;
      }

      useGameStore.getState().setError(errorMessage);

      // Log retry information
      if (retryCount < MAX_RETRIES) {
        console.log(`[WebSocket] Retry attempt ${retryCount}/${MAX_RETRIES} in ${RETRY_DELAY}ms`);
      } else {
        console.log('[WebSocket] Max retries reached, giving up');
      }
    });

    socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`[WebSocket] Reconnection attempt ${attemptNumber}`);
      useGameStore.getState().setError(`Reconnecting... (attempt ${attemptNumber}/${MAX_RETRIES})`);
    });

    socket.on('reconnect_failed', () => {
      console.log('[WebSocket] Reconnection failed');
      useGameStore.getState().setError('Failed to reconnect after multiple attempts. Please check your connection and try again.');
    });

    socket.on('reconnect', (attemptNumber: number) => {
      console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
      retryCount = 0;
      useGameStore.getState().setConnected(true);
      useGameStore.getState().setError(null);
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
      const temporaryRole = playerIndex === 0 ? 'encoder' : 'decoder';
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

      // Set initial score to 3 (neutral) - matches backend INITIAL_SCORE
      useGameStore.getState().setScore(3);

      // Set current player's actual role from backend
      const currentPlayer = useGameStore.getState().player;
      if (currentPlayer) {
        // Find the player in the updated players list to get their role
        const updatedPlayer = data.players.find(p => p.id === currentPlayer.id);
        if (updatedPlayer && updatedPlayer.role) {
          useGameStore.getState().setPlayerRole(updatedPlayer.role);
        }
      }

      // Set the initial turn to encoder
      useGameStore.getState().setCurrentTurn('encoder');

      // Navigate to appropriate game screen
      const playerRole = useGameStore.getState().playerRole;
      if (playerRole === 'encoder') {
        useGameStore.getState().setCurrentScreen('encoder-game');
      } else if (playerRole === 'decoder') {
        useGameStore.getState().setCurrentScreen('decoder-game');
      }
    });

    socket.on('game:started', (data: { players: any[]; roles: any; secretWord: string }) => {
      console.log('[WebSocket] Game started:', data);
      useGameStore.getState().setGameStatus('active');
      useGameStore.getState().setPlayers(data.players);
      useGameStore.getState().setSecretWord(data.secretWord);

      // Set initial score to 3 (neutral) - matches backend INITIAL_SCORE
      useGameStore.getState().setScore(3);

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
      if (playerRole === 'encoder') {
        useGameStore.getState().setCurrentScreen('encoder-game');
      } else if (playerRole === 'decoder') {
        useGameStore.getState().setCurrentScreen('decoder-game');
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
      useGameStore.getState().setPlayerRole(data.role as 'encoder' | 'decoder' | null);
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
    socket.on('game:turnStart', (data: { turn: 'encoder' | 'ai' | 'decoder' }) => {
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
    socket.on('ai_response', (data: {
      turn: {
        thinking: string[],
        guess: string
      },
      currentTurn: string
    }) => {
      console.log('[WebSocket] AI response:', data);
      const formattedContent = `Thinking: ${data.turn.thinking.join(' ')}\n\nGuess: ${data.turn.guess}`;
      const turn = {
        id: `ai-response-${Date.now()}`,
        type: 'ai' as const,
        content: formattedContent,
        timestamp: new Date().toISOString(),
      };
      // Add to conversation history (will be filtered out in display)
      useGameStore.getState().addTurn(turn);
      // Store the AI guess for the modal
      useGameStore.getState().setLastAIGuess(data.turn.guess);
      useGameStore.getState().setCurrentTurn(data.currentTurn as 'encoder' | 'ai' | 'decoder' | null);
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

      // Calculate points change and winner for modal
      const currentScore = useGameStore.getState().score;
      const pointsChange = data.score - currentScore;
      const winner = data.humansWon ? 'humans' : 'ai';

      // Get the correct guess for the modal
      let correctGuess = '';
      if (data.humansWon) {
        // Human win - get the last decoder guess
        const conversationHistory = useGameStore.getState().conversationHistory;
        const lastDecoderTurn = conversationHistory
          .filter(turn => turn.type === 'decoder')
          .pop();
        if (lastDecoderTurn) {
          correctGuess = lastDecoderTurn.content;
        }
      } else {
        // AI win - use the last AI guess
        correctGuess = useGameStore.getState().lastAIGuess || '';
      }

      // Show the modal with round end data
      useGameStore.getState().setRoundModalData({
        winner,
        correctGuess,
        pointsChange,
        secretWord: useGameStore.getState().secretWord || '',
        reason: data.reason || (data.humansWon ? 'humans_guessed' : 'ai_guessed')
      });
      useGameStore.getState().setShowRoundModal(true);

      // Update score if provided (important for timer expiration)
      if (data.score !== undefined) {
        console.log('[WebSocket] Updating score from round_end:', data.score);
        useGameStore.getState().setScore(data.score);
      }

      // Update round number
      useGameStore.getState().setRound(data.round || 1);

      // Update current turn for next round
      if (data.currentTurn) {
        useGameStore.getState().setCurrentTurn(data.currentTurn);
      }

      // Update secret word for next round
      if (data.newSecretWord) {
        useGameStore.getState().setSecretWord(data.newSecretWord);
      }

      // Handle role changes
      if (data.roles) {
        const currentPlayer = useGameStore.getState().player;
        if (currentPlayer) {
          const newRole = data.roles.encoder === currentPlayer.id ? 'encoder' : 'decoder';
          useGameStore.getState().setPlayerRole(newRole);

          // Switch to appropriate game screen based on new role
          if (newRole === 'encoder') {
            useGameStore.getState().setCurrentScreen('encoder-game');
          } else if (newRole === 'decoder') {
            useGameStore.getState().setCurrentScreen('decoder-game');
          }
        }
      }

      // Clear conversation history and AI analysis for new round
      // (Do this last, after the modal has had a chance to access the data)
      setTimeout(() => {
        console.log('[WebSocket] Clearing conversation history after round end');
        useGameStore.getState().setConversationHistory([]);
        useGameStore.getState().setLastAIGuess(null);
      }, 2000); // Increased from 100ms to 2 seconds to give modal time to process
    });

    // Guess result event
    socket.on('guess_result', (data: any) => {
      console.log('[WebSocket] Guess result:', data);
      // Optionally update score
      if (data.score !== undefined) {
        console.log('[WebSocket] Updating score from guess_result:', data.score);
        useGameStore.getState().setScore(data.score);
      }
    });

    // Timer update event
    socket.on('timer_update', (data: { roomId: string; remainingTime: number; currentTurn: string }) => {
      useGameStore.getState().setRemainingTime(data.remainingTime);
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

    // Listen for typing:indicator events from the server
    if (socket) {
      socket.on('typing:indicator', (data: { role: 'encoder' | 'decoder'; isTyping: boolean }) => {
        useGameStore.getState().setTypingIndicator(data);
      });
    }
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
  const response = await fetch(`${BACKEND_URL}/api/rooms`, {
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
  // Backend expects 'player_guess' with { roomId, guess, type: 'decoder' }
  socket.emit('player_guess', { roomId, guess, type: 'decoder' });
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

export function emitTypingStart(role: 'encoder' | 'decoder') {
  const socket = getSocket();
  const roomId = useGameStore.getState().roomId;
  if (!roomId) return;
  socket.emit('typing:start', { roomId, role });
}

export function emitTypingStop(role: 'encoder' | 'decoder') {
  const socket = getSocket();
  const roomId = useGameStore.getState().roomId;
  if (!roomId) return;
  socket.emit('typing:stop', { roomId, role });
} 