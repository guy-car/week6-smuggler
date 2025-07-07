"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class WordManager {
    constructor(dataDir = path.join(__dirname, '../../data')) {
        this.words = [];
        this.lastUsedWords = [];
        this.MAX_REUSE_COUNT = 3;
        this.wordsFilePath = path.join(dataDir, 'words.json');
        this.loadWords();
    }
    loadWords() {
        try {
            if (!fs.existsSync(this.wordsFilePath)) {
                throw new Error(`Words file not found: ${this.wordsFilePath}`);
            }
            const fileContent = fs.readFileSync(this.wordsFilePath, 'utf-8');
            const parsedWords = JSON.parse(fileContent);
            if (!Array.isArray(parsedWords)) {
                throw new Error('Words file must contain an array of strings');
            }
            this.words = parsedWords
                .filter(word => typeof word === 'string' && word.trim().length > 0)
                .map(word => word.trim());
            if (this.words.length === 0) {
                throw new Error('No valid words found in words file');
            }
            console.log(`Loaded ${this.words.length} words from ${this.wordsFilePath}`);
        }
        catch (error) {
            console.error('Error loading words:', error);
            this.words = ['Protest', 'PipeBomb', 'Rations'];
        }
    }
    selectRandomWord() {
        if (this.words.length === 0) {
            throw new Error('No words available');
        }
        const availableWords = this.words.filter(word => !this.lastUsedWords.includes(word));
        if (availableWords.length === 0) {
            this.lastUsedWords = [];
            return this.selectRandomWord();
        }
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        const selectedWord = availableWords[randomIndex];
        this.lastUsedWords.push(selectedWord);
        if (this.lastUsedWords.length > this.MAX_REUSE_COUNT) {
            this.lastUsedWords = this.lastUsedWords.slice(-this.MAX_REUSE_COUNT);
        }
        return selectedWord;
    }
    getAllWords() {
        return [...this.words];
    }
    getWordCount() {
        return this.words.length;
    }
    isValidWord(word) {
        return this.words.some(w => w.toLowerCase() === word.toLowerCase());
    }
    reloadWords() {
        this.loadWords();
    }
    getRecentlyUsedWords() {
        return [...this.lastUsedWords];
    }
    clearRecentlyUsedWords() {
        this.lastUsedWords = [];
    }
}
exports.WordManager = WordManager;
//# sourceMappingURL=wordManager.js.map