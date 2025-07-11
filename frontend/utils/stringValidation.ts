/**
 * Calculate Levenshtein distance between two strings (case-insensitive)
 * @param str1 First string
 * @param str2 Second string
 * @returns The minimum number of edits (insertions, deletions, substitutions) needed to transform str1 into str2
 */
export function levenshteinDistance(str1: string, str2: string): number {
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
 * Check if message is too similar to secret word
 * @param message The message to validate
 * @param secretWord The secret word to check against
 * @param maxDistance Maximum allowed Levenshtein distance (default: 2)
 * @returns True if the message is too similar to the secret word
 */
export function isMessageTooSimilar(message: string, secretWord: string, maxDistance: number = 2): boolean {
    if (!secretWord || !message.trim()) return false;
    
    // Check Levenshtein distance between the entire message and the secret word
    const distance = levenshteinDistance(message.trim().toLowerCase(), secretWord.toLowerCase());
    return distance <= maxDistance;
} 