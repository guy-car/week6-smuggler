import { GameState, RoleAssignment } from '../types';
export declare class GameValidator {
    private readonly MAX_MESSAGE_LENGTH;
    private readonly MIN_MESSAGE_LENGTH;
    private readonly MAX_GUESS_LENGTH;
    validatePlayer(player: any): {
        valid: boolean;
        errors: string[];
    };
    validateGameState(gameState: any): {
        valid: boolean;
        errors: string[];
    };
    validateMessage(message: any): {
        valid: boolean;
        errors: string[];
    };
    validateAIGuess(aiGuess: any): {
        valid: boolean;
        errors: string[];
    };
    validateRoleAssignment(roles: any): {
        valid: boolean;
        errors: string[];
    };
    validatePlayerGuess(guess: any): {
        valid: boolean;
        errors: string[];
    };
    validateRoomId(roomId: any): {
        valid: boolean;
        errors: string[];
    };
    validateGameAction(gameState: GameState, playerId: string, action: 'send_message' | 'guess', roles: RoleAssignment): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=validation.d.ts.map