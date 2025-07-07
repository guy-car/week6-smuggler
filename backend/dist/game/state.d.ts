import { AIGuess, GameState, Message, Player, RoleAssignment } from '../types';
export declare class GameStateManager {
    private readonly INITIAL_SCORE;
    private readonly MAX_SCORE;
    private readonly MIN_SCORE;
    private readonly WIN_SCORE;
    private readonly LOSE_SCORE;
    createGameState(secretWord: string, players: Player[]): GameState;
    assignRoles(players: Player[]): RoleAssignment;
    addMessage(gameState: GameState, message: Omit<Message, 'id' | 'timestamp'>): GameState;
    addAIGuess(gameState: GameState, guess: Omit<AIGuess, 'id' | 'timestamp'>): GameState;
    updateScore(gameState: GameState, correct: boolean): GameState;
    advanceRound(gameState: GameState): GameState;
    switchRoles(players: Player[], roles: RoleAssignment): RoleAssignment;
    isGameEnded(gameState: GameState): boolean;
    getGameWinner(gameState: GameState): 'players' | 'ai' | null;
    validateGuess(guess: string, secretWord: string): boolean;
    getCurrentTurn(gameState: GameState): 'encryptor' | 'ai' | 'decryptor';
    advanceTurn(gameState: GameState): GameState;
    isPlayerTurn(gameState: GameState, playerId: string, roles: RoleAssignment): boolean;
    isAITurn(gameState: GameState): boolean;
    getPlayerRole(playerId: string, roles: RoleAssignment): 'encryptor' | 'decryptor' | null;
    endGame(gameState: GameState): GameState;
    private generateId;
}
//# sourceMappingURL=state.d.ts.map