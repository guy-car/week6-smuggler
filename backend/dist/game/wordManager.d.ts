export declare class WordManager {
    private words;
    private readonly wordsFilePath;
    private lastUsedWords;
    private readonly MAX_REUSE_COUNT;
    constructor(dataDir?: string);
    private loadWords;
    selectRandomWord(): string;
    getAllWords(): string[];
    getWordCount(): number;
    isValidWord(word: string): boolean;
    reloadWords(): void;
    getRecentlyUsedWords(): string[];
    clearRecentlyUsedWords(): void;
}
//# sourceMappingURL=wordManager.d.ts.map