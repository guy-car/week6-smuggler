import { create } from 'zustand';

export type Player = {
  id: string;
  name: string;
  ready: boolean;
  role: 'encryptor' | 'decryptor' | null;
  socketId: string;
};

export type Message = {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  type?: 'hint' | 'guess' | 'ai_guess' | 'ai_thinking';
};

export type Turn = {
  id: string;
  type: 'encryptor' | 'ai' | 'decryptor';
  content: string;
  timestamp: string;
  playerId?: string;
};

export type Room = {
  id: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: string;
};

export type GameStatus = 'waiting' | 'active' | 'ended';

export type GameScreen = 'lobby' | 'room' | 'encryptor-game' | 'decryptor-game' | 'game-end';

interface GameState {
  // Connection state
  connected: boolean;
  socketId: string | null;

  // Player state
  player: Player | null;
  playerRole: 'encryptor' | 'decryptor' | null;

  // Room state
  roomId: string | null;
  players: Player[];
  isReady: boolean;

  // Game state
  gameStatus: GameStatus;
  conversationHistory: Turn[];
  currentTurn: 'encryptor' | 'ai' | 'decryptor' | null;
  secretWord: string | null;
  score: number;
  round: number;
  maxRounds: number;

  // UI state
  currentScreen: GameScreen;
  isLoading: boolean;
  error: string | null;
  showGuessesModal: boolean;
  showCluesModal: boolean;
  showSecretModal: boolean;
  showQuitConfirm: boolean;

  // Available rooms for lobby
  availableRooms: Room[];

  // Actions
  setConnected: (connected: boolean) => void;
  setSocketId: (socketId: string | null) => void;
  setPlayer: (player: Player | null) => void;
  setPlayerRole: (role: 'encryptor' | 'decryptor' | null) => void;
  setRoomId: (roomId: string | null) => void;
  setPlayers: (players: Player[]) => void;
  setIsReady: (ready: boolean) => void;
  setGameStatus: (status: GameStatus) => void;
  setConversationHistory: (history: Turn[]) => void;
  addTurn: (turn: Turn) => void;
  setCurrentTurn: (turn: 'encryptor' | 'ai' | 'decryptor' | null) => void;
  setSecretWord: (word: string | null) => void;
  setScore: (score: number) => void;
  setRound: (round: number) => void;
  setMaxRounds: (maxRounds: number) => void;
  setCurrentScreen: (screen: GameScreen) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setShowGuessesModal: (show: boolean) => void;
  setShowCluesModal: (show: boolean) => void;
  setShowSecretModal: (show: boolean) => void;
  setShowQuitConfirm: (show: boolean) => void;
  setAvailableRooms: (rooms: Room[]) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Connection state
  connected: false,
  socketId: null,

  // Player state
  player: null,
  playerRole: null,

  // Room state
  roomId: null,
  players: [],
  isReady: false,

  // Game state
  gameStatus: 'waiting',
  conversationHistory: [],
  currentTurn: null,
  secretWord: null,
  score: 0,
  round: 1,
  maxRounds: 5,

  // UI state
  currentScreen: 'lobby',
  isLoading: false,
  error: null,
  showGuessesModal: false,
  showCluesModal: false,
  showSecretModal: false,
  showQuitConfirm: false,

  // Available rooms
  availableRooms: [],

  // Actions
  setConnected: (connected) => set({ connected }),
  setSocketId: (socketId) => set({ socketId }),
  setPlayer: (player) => set({ player }),
  setPlayerRole: (role) => set({ playerRole: role }),
  setRoomId: (roomId) => set({ roomId }),
  setPlayers: (players) => set({ players }),
  setIsReady: (ready) => set({ isReady: ready }),
  setGameStatus: (status) => set({ gameStatus: status }),
  setConversationHistory: (history) => set({ conversationHistory: history }),
  addTurn: (turn) => set((state) => ({
    conversationHistory: [...state.conversationHistory, turn]
  })),
  setCurrentTurn: (turn) => set({ currentTurn: turn }),
  setSecretWord: (word) => set({ secretWord: word }),
  setScore: (score) => set({ score }),
  setRound: (round) => set({ round }),
  setMaxRounds: (maxRounds) => set({ maxRounds }),
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setShowGuessesModal: (show) => set({ showGuessesModal: show }),
  setShowCluesModal: (show) => set({ showCluesModal: show }),
  setShowSecretModal: (show) => set({ showSecretModal: show }),
  setShowQuitConfirm: (show) => set({ showQuitConfirm: show }),
  setAvailableRooms: (rooms) => set({ availableRooms: rooms }),
  reset: () => set((state) => ({
    // Do NOT reset connected or socketId
    player: null,
    playerRole: null,
    roomId: null,
    players: [],
    isReady: false,
    gameStatus: 'waiting',
    conversationHistory: [],
    currentTurn: null,
    secretWord: null,
    score: 0,
    round: 1,
    maxRounds: 5,
    currentScreen: 'lobby',
    isLoading: false,
    error: null,
    showGuessesModal: false,
    showCluesModal: false,
    showSecretModal: false,
    showQuitConfirm: false,
    availableRooms: [],
    // Keep connected and socketId as they are
    connected: state.connected,
    socketId: state.socketId,
  })),
})); 