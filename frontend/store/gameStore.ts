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
};

export type Room = {
  id: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: string;
};

export type GameStatus = 'waiting' | 'active' | 'ended';

interface GameState {
  connected: boolean;
  roomId: string | null;
  player: Player | null;
  players: Player[];
  messages: Message[];
  score: number;
  round: number;
  role: 'encryptor' | 'decryptor' | null;
  gameStatus: GameStatus;
  availableRooms: Room[];

  setConnected: (connected: boolean) => void;
  setRoomId: (roomId: string | null) => void;
  setPlayer: (player: Player | null) => void;
  setPlayers: (players: Player[]) => void;
  addMessage: (msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
  setScore: (score: number) => void;
  setRound: (round: number) => void;
  setRole: (role: 'encryptor' | 'decryptor' | null) => void;
  setGameStatus: (status: GameStatus) => void;
  setAvailableRooms: (rooms: Room[]) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  connected: false,
  roomId: null,
  player: null,
  players: [],
  messages: [],
  score: 0,
  round: 1,
  role: null,
  gameStatus: 'waiting',
  availableRooms: [],

  setConnected: (connected) => set({ connected }),
  setRoomId: (roomId) => set({ roomId }),
  setPlayer: (player) => set({ player }),
  setPlayers: (players) => set({ players }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  setScore: (score) => set({ score }),
  setRound: (round) => set({ round }),
  setRole: (role) => set({ role }),
  setGameStatus: (status) => set({ gameStatus: status }),
  setAvailableRooms: (rooms) => set({ availableRooms: rooms }),
  reset: () => set({
    connected: false,
    roomId: null,
    player: null,
    players: [],
    messages: [],
    score: 0,
    round: 1,
    role: null,
    gameStatus: 'waiting',
    availableRooms: [],
  }),
})); 