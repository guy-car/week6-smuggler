export interface Player {
    id: string; // socket.id for now
    name: string;
    ready: boolean;
    role: 'encryptor' | 'decryptor' | null;
    socketId: string;
}

export interface Room {
    id: string;
    players: Player[];
    gameState: GameState | null;
    createdAt: Date;
    lastActivity: Date;
}

export interface GameState {
    score: number;
    currentRound: number;
    secretWord: string;
    conversationHistory: Message[];
    aiGuesses: AIGuess[];
    currentTurn: 'encryptor' | 'ai' | 'decryptor';
    gameStatus: 'waiting' | 'active' | 'ended';
}

export interface Message {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
}

export interface AIGuess {
    id: string;
    thinking: string[];
    guess: string;
    confidence: number;
    timestamp: Date;
}

export interface RoleAssignment {
    encryptor: string;
    decryptor: string;
}

export interface RoomJoinResult {
    success: boolean;
    roomId: string;
    players: Player[];
    error?: string;
}

export interface GameStartData {
    roomId: string;
    players: Player[];
    roles: RoleAssignment;
    secretWord: string;
}

export interface CreateRoomRequest {
    // Empty for now, no parameters required
}

export interface CreateRoomResponse {
    success: boolean;
    roomId: string;
    playerId: string;
    message?: string;
}

export interface CreateRoomWithPlayerResult {
    success: boolean;
    roomId: string;
    player: Player;
    error?: string;
} 