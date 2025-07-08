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

/**
 * Calculate Levenshtein distance between two strings (case-insensitive)
 * @param str1 First string
 * @param str2 Second string
 * @returns The minimum number of edits (insertions, deletions, substitutions) needed to transform str1 into str2
 */
export function levenshteinDistance(str1: string, str2: string): number {
    // Convert to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= s2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
        matrix[0]![j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= s2.length; i++) {
        for (let j = 1; j <= s1.length; j++) {
            const substitution = matrix[i - 1]![j - 1]!;
            const insertion = matrix[i]![j - 1]!;
            const deletion = matrix[i - 1]![j]!;

            if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                matrix[i]![j] = substitution;
            } else {
                matrix[i]![j] = Math.min(
                    substitution + 1, // substitution
                    insertion + 1,    // insertion
                    deletion + 1      // deletion
                );
            }
        }
    }

    return matrix[s2.length]![s1.length]!;
}

/**
 * Check if two strings match using Levenshtein distance with a threshold
 * @param str1 First string
 * @param str2 Second string
 * @param maxDistance Maximum allowed Levenshtein distance (default: 2)
 * @returns True if the strings match within the threshold
 */
export function fuzzyStringMatch(str1: string, str2: string, maxDistance: number = 2): boolean {
    const distance = levenshteinDistance(str1.trim(), str2.trim());
    return distance <= maxDistance;
}

/**
 * Get the maximum Levenshtein distance from environment variable or use default
 * @returns Maximum allowed Levenshtein distance for guess validation
 */
export function getMaxLevenshteinDistance(): number {
    const envValue = process.env['MAX_LEVENSHTEIN_DISTANCE'];
    if (envValue) {
        const parsed = parseInt(envValue, 10);
        if (!isNaN(parsed) && parsed >= 0) {
            return parsed;
        }
    }
    return 2; // Default value
} 