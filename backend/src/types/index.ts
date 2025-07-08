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
    conversationHistory: Turn[];  // Updated to use Turn[] instead of Message[]
    currentTurn: 'encryptor' | 'ai' | 'decryptor';
    gameStatus: 'waiting' | 'active' | 'ended';
}

// New Zod-based Turn types
type TurnType = 'outsider_hint' | 'ai_analysis' | 'insider_guess';

export interface OutsiderTurn {
    type: 'outsider_hint';
    content: string;
    turnNumber: number;
}

export interface AITurn {
    type: 'ai_analysis';
    thinking: string[];  // Exactly 4 sentences
    guess: string;       // Single word, 3-12 characters
    turnNumber: number;
}

export interface InsiderTurn {
    type: 'insider_guess';
    guess: string;       // Single word, 3-12 characters
    turnNumber: number;
}

export type Turn = OutsiderTurn | AITurn | InsiderTurn;

export interface AnalyzeRequest {
    gameId: string;
    conversationHistory: Turn[];
}

export interface AIResponse {
    thinking: string[];  // Exactly 4 sentences
    guess: string;       // Single word, 3-12 characters
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