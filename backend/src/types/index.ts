// Import Zod schemas from openai types
import {
    AIResponseSchema,
    AITurnSchema,
    AnalyzeRequestSchema,
    InsiderTurnSchema,
    OutsiderTurnSchema,
    TurnSchema,
    TurnTypeSchema,
    type AIResponse,
    type AITurn,
    type AnalyzeRequest,
    type InsiderTurn,
    type OutsiderTurn,
    type Turn,
    type TurnType
} from '../../openai/types/game';

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

// Re-export Zod schemas and types
export {
    AIResponseSchema, AITurnSchema, AnalyzeRequestSchema, InsiderTurnSchema, OutsiderTurnSchema, TurnSchema, TurnTypeSchema, type AIResponse, type AITurn, type AnalyzeRequest, type InsiderTurn, type OutsiderTurn, type Turn, type TurnType
};

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