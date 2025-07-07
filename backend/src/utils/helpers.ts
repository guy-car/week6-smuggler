/**
 * Generate a unique ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a room ID
 */
export function generateRoomId(): string {
    return `room_${generateId()}`;
}

/**
 * Validate room ID format
 */
export function isValidRoomId(roomId: string): boolean {
    return typeof roomId === 'string' && roomId.length > 0 && roomId.startsWith('room_');
}

/**
 * Validate player name
 */
export function isValidPlayerName(name: string): boolean {
    return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 50;
}

/**
 * Sanitize player name
 */
export function sanitizePlayerName(name: string): string {
    return name.trim().substring(0, 50);
}

/**
 * Get current timestamp
 */
export function getCurrentTimestamp(): Date {
    return new Date();
}

/**
 * Check if a date is older than specified milliseconds
 */
export function isOlderThan(date: Date, milliseconds: number): boolean {
    return Date.now() - date.getTime() > milliseconds;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
} 