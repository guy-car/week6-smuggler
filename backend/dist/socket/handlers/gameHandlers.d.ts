import { Socket } from 'socket.io';
import { RoomManager } from '../../rooms/manager';
export declare class GameHandlers {
    private roomManager;
    private gameStateManager;
    private wordManager;
    private aiService;
    private io;
    constructor(roomManager: RoomManager, io: any);
    handleStartGame: (socket: Socket, data: {
        roomId: string;
    }) => void;
    handleSendMessage: (socket: Socket, data: {
        roomId: string;
        message: string;
    }) => void;
    handlePlayerGuess: (socket: Socket, data: {
        roomId: string;
        guess: string;
    }) => void;
    private handleAIResponse;
    private handleAIFallback;
}
//# sourceMappingURL=gameHandlers.d.ts.map