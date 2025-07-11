// Import Zod schemas from openai types
import {
    AIResponseSchema,
    AITurnSchema,
    AnalyzeRequestSchema,
    DecoderTurnSchema,
    EncoderTurnSchema,
    TurnSchema,
    TurnTypeSchema,
    type AIResponse,
    type AITurn,
    type AnalyzeRequest,
    type DecoderTurn,
    type EncoderTurn,
    type Turn,
    type TurnType
} from '../../openai/types/game';

export interface Player {
    id: string; // socket.id for now
    name: string;
    ready: boolean;
    role: 'encoder' | 'decoder' | null;
    socketId: string;
}

export interface Room {
    id: string;
    players: Player[];
    gameState: GameState | null;
    roles: RoleAssignment | null; // Add this for role switching
    createdAt: Date;
    lastActivity: Date;
}

export interface GameState {
    score: number;
    currentRound: number;
    secretWord: string;
    conversationHistory: Turn[];  // Updated to use Turn[] instead of Message[]
    /** Accumulated one-sentence pattern notes from previous rounds */
    previousRoundsAnalysis: string[];
    currentTurn: 'encoder' | 'ai' | 'decoder';
    gameStatus: 'waiting' | 'active' | 'ended';
    /** Unix timestamp when current round expires (null when paused) */
    roundExpiresAt?: number;
    /** Remaining time in seconds when timer is paused (null when timer is running) */
    pausedRemainingTime?: number;
}

// Re-export Zod schemas and types
export {
    AIResponseSchema, AITurnSchema, AnalyzeRequestSchema, DecoderTurnSchema, EncoderTurnSchema, TurnSchema, TurnTypeSchema, type AIResponse, type AITurn, type AnalyzeRequest, type DecoderTurn, type EncoderTurn, type Turn, type TurnType
};

export interface RoleAssignment {
    encoder: string;
    decoder: string;
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