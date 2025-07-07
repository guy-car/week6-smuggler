import * as fs from 'fs';
import * as path from 'path';

export class WordManager {
    private words: string[] = [];
    private readonly wordsFilePath: string;
    private lastUsedWords: string[] = [];
    private readonly MAX_REUSE_COUNT = 3; // Avoid reusing same words too frequently

    constructor(dataDir: string = path.join(__dirname, '../../data')) {
        this.wordsFilePath = path.join(dataDir, 'words.json');
        this.loadWords();
    }

    /**
     * Load words from JSON file
     */
    private loadWords(): void {
        try {
            if (!fs.existsSync(this.wordsFilePath)) {
                throw new Error(`Words file not found: ${this.wordsFilePath}`);
            }

            const fileContent = fs.readFileSync(this.wordsFilePath, 'utf-8');
            const parsedWords = JSON.parse(fileContent);

            if (!Array.isArray(parsedWords)) {
                throw new Error('Words file must contain an array of strings');
            }

            // Validate and sanitize words
            this.words = parsedWords
                .filter(word => typeof word === 'string' && word.trim().length > 0)
                .map(word => word.trim());

            if (this.words.length === 0) {
                throw new Error('No valid words found in words file');
            }

            console.log(`Loaded ${this.words.length} words from ${this.wordsFilePath}`);
        } catch (error) {
            console.error('Error loading words:', error);
            // Fallback to default words
            this.words = ['Protest', 'PipeBomb', 'Rations'];
        }
    }

    /**
     * Select a random word, avoiding recently used ones
     */
    public selectRandomWord(): string {
        if (this.words.length === 0) {
            throw new Error('No words available');
        }

        // Filter out recently used words
        const availableWords = this.words.filter(word =>
            !this.lastUsedWords.includes(word)
        );

        // If all words have been recently used, reset the list
        if (availableWords.length === 0) {
            this.lastUsedWords = [];
            return this.selectRandomWord();
        }

        // Select random word
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        const selectedWord = availableWords[randomIndex]!;

        // Add to recently used list
        this.lastUsedWords.push(selectedWord);

        // Keep only the last MAX_REUSE_COUNT words
        if (this.lastUsedWords.length > this.MAX_REUSE_COUNT) {
            this.lastUsedWords = this.lastUsedWords.slice(-this.MAX_REUSE_COUNT);
        }

        return selectedWord;
    }

    /**
     * Get all available words
     */
    public getAllWords(): string[] {
        return [...this.words];
    }

    /**
     * Get word count
     */
    public getWordCount(): number {
        return this.words.length;
    }

    /**
     * Validate a word exists in the word list
     */
    public isValidWord(word: string): boolean {
        return this.words.some(w => w.toLowerCase() === word.toLowerCase());
    }

    /**
     * Reload words from file
     */
    public reloadWords(): void {
        this.loadWords();
    }

    /**
     * Get recently used words
     */
    public getRecentlyUsedWords(): string[] {
        return [...this.lastUsedWords];
    }

    /**
     * Clear recently used words (for testing)
     */
    public clearRecentlyUsedWords(): void {
        this.lastUsedWords = [];
    }
} 