import { Player, Room, RoomJoinResult } from '../types';
export declare class RoomManager {
    private rooms;
    private readonly MAX_PLAYERS_PER_ROOM;
    private readonly ROOM_CLEANUP_INTERVAL;
    private readonly ROOM_TIMEOUT;
    constructor();
    joinRoom(roomId: string, player: Player): RoomJoinResult;
    setPlayerReady(roomId: string, playerId: string): boolean;
    removePlayer(roomId: string, playerId: string): boolean;
    getRoom(roomId: string): Room | undefined;
    getAllRooms(): Room[];
    getAvailableRooms(): Room[];
    isRoomAvailable(roomId: string): boolean;
    isRoomReady(roomId: string): boolean;
    validateRoom(roomId: string): {
        valid: boolean;
        errors: string[];
    };
    getPlayerCount(roomId: string): number;
    getRoomCount(): number;
    private createRoom;
    private startCleanupInterval;
    private cleanupInactiveRooms;
    forceCleanupRoom(roomId: string): boolean;
}
//# sourceMappingURL=manager.d.ts.map