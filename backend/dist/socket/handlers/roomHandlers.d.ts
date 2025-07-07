import { Socket } from 'socket.io';
import { RoomManager } from '../../rooms/manager';
export declare class RoomHandlers {
    private roomManager;
    constructor(roomManager: RoomManager);
    handleJoinRoom: (socket: Socket, data: {
        roomId: string;
        playerName: string;
    }) => void;
    handlePlayerReady: (socket: Socket, data: {
        roomId: string;
    }) => void;
    handleDisconnect: (socket: Socket) => void;
    handleListRooms: (socket: Socket) => void;
    handleCheckRoomAvailability: (socket: Socket, data: {
        roomId: string;
    }) => void;
}
//# sourceMappingURL=roomHandlers.d.ts.map