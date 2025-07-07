export declare function generateId(): string;
export declare function generateRoomId(): string;
export declare function isValidRoomId(roomId: string): boolean;
export declare function isValidPlayerName(name: string): boolean;
export declare function sanitizePlayerName(name: string): string;
export declare function getCurrentTimestamp(): Date;
export declare function isOlderThan(date: Date, milliseconds: number): boolean;
export declare function deepClone<T>(obj: T): T;
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=helpers.d.ts.map