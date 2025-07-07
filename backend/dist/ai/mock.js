"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAIService = void 0;
class MockAIService {
    constructor() {
        this.version = '1.0.0-mock';
        this.thinkingTemplates = [
            [
                "Analyzing conversation patterns for clues.",
                "Looking for word associations and themes.",
                "Evaluating communication strategies used.",
                "Processing semantic connections in context."
            ],
            [
                "Examining linguistic patterns in messages.",
                "Identifying potential word relationships.",
                "Analyzing tone and style of communication.",
                "Processing contextual information carefully."
            ],
            [
                "Studying message structure and content.",
                "Looking for hidden meanings or codes.",
                "Analyzing frequency of certain words.",
                "Considering cultural references present."
            ],
            [
                "Processing conversation flow and themes.",
                "Identifying key topics and subjects.",
                "Analyzing complexity of messages sent.",
                "Evaluating word associations found."
            ]
        ];
        this.serviceStartTime = Date.now();
    }
    async analyzeConversation(conversationHistory, secretWord, gameContext) {
        try {
            const thinking = await this.generateThinkingProcess(conversationHistory, gameContext);
            const availableWords = this.getMockAvailableWords();
            const guess = await this.generateGuess(conversationHistory, availableWords, gameContext);
            return {
                thinking,
                guess
            };
        }
        catch (error) {
            console.error('Error in analyzeConversation:', error);
            throw new Error('Failed to analyze conversation');
        }
    }
    async generateThinkingProcess(conversationHistory, gameContext) {
        try {
            const templateIndex = Math.floor(Math.random() * this.thinkingTemplates.length);
            const baseThinking = this.thinkingTemplates[templateIndex];
            const validatedThinking = baseThinking.map(sentence => {
                const words = sentence.split(' ');
                if (words.length > 12) {
                    return words.slice(0, 12).join(' ');
                }
                return sentence;
            });
            while (validatedThinking.length < 4) {
                validatedThinking.push("Processing available information.");
            }
            if (validatedThinking.length > 4) {
                validatedThinking.splice(4);
            }
            return validatedThinking;
        }
        catch (error) {
            console.error('Error in generateThinkingProcess:', error);
            return [
                "Analyzing conversation patterns.",
                "Looking for contextual clues.",
                "Processing available information.",
                "Evaluating potential matches."
            ];
        }
    }
    async generateGuess(conversationHistory, availableWords, gameContext) {
        try {
            if (!availableWords || availableWords.length === 0) {
                throw new Error('No available words provided');
            }
            let selectedWord;
            if (conversationHistory.length === 0) {
                selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
            }
            else {
                const conversationText = conversationHistory
                    .map(msg => msg.content.toLowerCase())
                    .join(' ');
                const relatedWords = availableWords.filter(word => conversationText.includes(word.toLowerCase()) ||
                    this.hasSemanticConnection(word, conversationText));
                if (relatedWords.length > 0) {
                    selectedWord = relatedWords[Math.floor(Math.random() * relatedWords.length)];
                }
                else {
                    selectedWord = availableWords[Math.floor(Math.random() * availableWords.length)];
                }
            }
            if (selectedWord.length > 12) {
                selectedWord = selectedWord.substring(0, 12);
            }
            return selectedWord;
        }
        catch (error) {
            console.error('Error in generateGuess:', error);
            const fallback = availableWords[0] || 'unknown';
            return fallback.length > 12 ? fallback.substring(0, 12) : fallback;
        }
    }
    hasSemanticConnection(word, conversationText) {
        const wordLower = word.toLowerCase();
        const commonAssociations = {
            'animal': ['pet', 'wild', 'nature', 'zoo', 'farm'],
            'food': ['eat', 'cook', 'restaurant', 'meal', 'hungry'],
            'color': ['paint', 'art', 'bright', 'dark', 'rainbow'],
            'emotion': ['feel', 'happy', 'sad', 'angry', 'love'],
            'weather': ['sun', 'rain', 'storm', 'cloud', 'wind'],
            'technology': ['computer', 'phone', 'internet', 'digital', 'screen']
        };
        for (const [category, associations] of Object.entries(commonAssociations)) {
            if (wordLower.includes(category) || associations.some(assoc => wordLower.includes(assoc))) {
                if (associations.some(assoc => conversationText.includes(assoc))) {
                    return true;
                }
            }
        }
        return false;
    }
    getMockAvailableWords() {
        return [
            'elephant', 'pizza', 'sunshine', 'mountain', 'ocean',
            'butterfly', 'chocolate', 'rainbow', 'forest', 'castle',
            'dragon', 'guitar', 'diamond', 'volcano', 'telescope',
            'waterfall', 'fireworks', 'treasure', 'pirate', 'wizard'
        ];
    }
    async getHealth() {
        try {
            const uptime = Date.now() - this.serviceStartTime;
            return {
                status: 'healthy',
                uptime,
                version: this.version,
                features: [
                    'conversation-analysis',
                    'thinking-process-generation',
                    'guess-generation',
                    'semantic-analysis'
                ]
            };
        }
        catch (error) {
            console.error('Error in getHealth:', error);
            return {
                status: 'unhealthy',
                uptime: 0,
                version: this.version,
                features: []
            };
        }
    }
    async simulateResponseDelay(minDelay = 500, maxDelay = 2000) {
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}
exports.MockAIService = MockAIService;
//# sourceMappingURL=mock.js.map