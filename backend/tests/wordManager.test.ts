import * as fs from 'fs';
import * as path from 'path';
import { WordManager } from '../src/game/wordManager';

describe('WordManager', () => {
    let wordManager: WordManager;
    let tempWordsPath: string;

    beforeEach(() => {
        // Create a temporary data directory for testing
        const tempDataDir = path.join(__dirname, 'temp-data');
        tempWordsPath = path.join(tempDataDir, 'words.json');

        // Create directory if it doesn't exist
        if (!fs.existsSync(tempDataDir)) {
            fs.mkdirSync(tempDataDir, { recursive: true });
        }

        const testWords = ['Cat', 'Dog', 'Bird', 'Tiger', 'Elephant'];
        fs.writeFileSync(tempWordsPath, JSON.stringify(testWords));

        wordManager = new WordManager(tempDataDir);
    });

    afterEach(() => {
        // Clean up temporary directory and files
        const tempDataDir = path.dirname(tempWordsPath);
        if (fs.existsSync(tempWordsPath)) {
            fs.unlinkSync(tempWordsPath);
        }
        if (fs.existsSync(tempDataDir)) {
            fs.rmdirSync(tempDataDir);
        }
    });

    describe('Basic Functionality', () => {
        it('should load words from JSON file', () => {
            const allWords = wordManager.getAllWords();
            expect(allWords).toContain('Cat');
            expect(allWords).toContain('Dog');
            expect(allWords).toContain('Elephant');
        });

        it('should return correct word count', () => {
            expect(wordManager.getWordCount()).toBe(5);
        });

        it('should validate words correctly', () => {
            expect(wordManager.isValidWord('Cat')).toBe(true);
            expect(wordManager.isValidWord('cat')).toBe(true); // case insensitive
            expect(wordManager.isValidWord('Invalid')).toBe(false);
        });
    });

    describe('Word Selection', () => {
        it('should select random word from available words', () => {
            const word = wordManager.selectRandomWord();
            const allWords = wordManager.getAllWords();
            expect(allWords).toContain(word);
        });

        it('should avoid recently used words', () => {
            const word1 = wordManager.selectRandomWord();
            const word2 = wordManager.selectRandomWord();
            const word3 = wordManager.selectRandomWord();

            const recentlyUsed = wordManager.getRecentlyUsedWords();
            expect(recentlyUsed).toContain(word1);
            expect(recentlyUsed).toContain(word2);
            expect(recentlyUsed).toContain(word3);
        });

        it('should reset recently used list when all words are used', () => {
            // Select all words multiple times
            for (let i = 0; i < 10; i++) {
                wordManager.selectRandomWord();
            }

            // Should still be able to select words
            const word = wordManager.selectRandomWord();
            expect(wordManager.isValidWord(word)).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing words file', () => {
            // Delete the file
            fs.unlinkSync(tempWordsPath);

            // Should use fallback words
            const tempDataDir = path.dirname(tempWordsPath) as string;
            const fallbackWordManager = new WordManager(tempDataDir);
            expect(fallbackWordManager.getWordCount()).toBeGreaterThan(0);
        });

        it('should handle invalid JSON file', () => {
            // Write invalid JSON
            fs.writeFileSync(tempWordsPath, 'invalid json');

            // Should use fallback words
            const tempDataDir = path.dirname(tempWordsPath) as string;
            const fallbackWordManager = new WordManager(tempDataDir);
            expect(fallbackWordManager.getWordCount()).toBeGreaterThan(0);
        });

        it('should handle empty word list', () => {
            // Write empty array
            fs.writeFileSync(tempWordsPath, '[]');

            // Should use fallback words
            const tempDataDir = path.dirname(tempWordsPath) as string;
            const fallbackWordManager = new WordManager(tempDataDir);
            expect(fallbackWordManager.getWordCount()).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle words with whitespace', () => {
            const wordsWithWhitespace = ['  Cat  ', ' Dog ', 'Bird'];
            fs.writeFileSync(tempWordsPath, JSON.stringify(wordsWithWhitespace));

            const tempDataDir = path.dirname(tempWordsPath) as string;
            const newWordManager = new WordManager(tempDataDir);
            expect(newWordManager.isValidWord('Cat')).toBe(true);
            expect(newWordManager.isValidWord('Dog')).toBe(true);
            expect(newWordManager.isValidWord('Bird')).toBe(true);
        });

        it('should filter out empty words', () => {
            const wordsWithEmpty = ['Cat', '', 'Dog', '   ', 'Bird'];
            fs.writeFileSync(tempWordsPath, JSON.stringify(wordsWithEmpty));

            const tempDataDir = path.dirname(tempWordsPath) as string;
            const newWordManager = new WordManager(tempDataDir);
            expect(newWordManager.getWordCount()).toBe(3); // Only Cat, Dog, Bird
        });
    });

    describe('Integration with Game Logic', () => {
        it('should work with game logic integration', () => {
            // Simulate game usage
            const gameWords = [];
            for (let i = 0; i < 5; i++) {
                gameWords.push(wordManager.selectRandomWord());
            }

            // All words should be valid
            gameWords.forEach(word => {
                expect(wordManager.isValidWord(word)).toBe(true);
            });

            // Should have some variety (not all the same word)
            const uniqueWords = new Set(gameWords);
            expect(uniqueWords.size).toBeGreaterThan(1);
        });

        it('should maintain recently used words across multiple selections', () => {
            const selectedWords = [];
            for (let i = 0; i < 3; i++) {
                selectedWords.push(wordManager.selectRandomWord());
            }

            const recentlyUsed = wordManager.getRecentlyUsedWords();
            selectedWords.forEach(word => {
                expect(recentlyUsed).toContain(word);
            });
        });
    });
}); 