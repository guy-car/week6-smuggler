import { AIGuess, GameState, Message, Player, RoleAssignment } from '../types';
export declare class GameLogic {
    private gameStateManager;
    private wordManager;
    constructor();
    startGame(players: Player[]): {
        gameState: GameState;
        roles: RoleAssignment;
        secretWord: string;
    };
    handleEncryptorMessage(gameState: GameState, message: Omit<Message, 'id' | 'timestamp'>, roles: RoleAssignment): {
        newGameState: GameState;
        shouldAdvanceTurn: boolean;
    };
    handleAIGuess(gameState: GameState, aiGuess: Omit<AIGuess, 'id' | 'timestamp'>): {
        newGameState: GameState;
        isCorrect: boolean;
        shouldAdvanceTurn: boolean;
    };
    handleDecryptorGuess(gameState: GameState, guess: string, playerId: string, roles: RoleAssignment): {
        newGameState: GameState;
        isCorrect: boolean;
        shouldAdvanceTurn: boolean;
    };
    getGameStatus(gameState: GameState): {
        isGameEnded: boolean;
        winner: 'players' | 'ai' | null;
        currentTurn: 'encryptor' | 'ai' | 'decryptor';
        score: number;
        round: number;
    };
    canPlayerAct(gameState: GameState, playerId: string, action: 'send_message' | 'guess', roles: RoleAssignment): boolean;
    getPlayerRole(playerId: string, roles: RoleAssignment): 'encryptor' | 'decryptor' | null;
    switchRolesForNextRound(roles: RoleAssignment): RoleAssignment;
    getConversationHistory(gameState: GameState): Message[];
    getAIGuesses(gameState: GameState): AIGuess[];
    getSecretWord(gameState: GameState): string;
}
//# sourceMappingURL=logic.d.ts.map