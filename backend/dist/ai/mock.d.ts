import { Message } from '../types';
export interface GameContext {
    currentRound: number;
    score: number;
    gameStatus: 'waiting' | 'active' | 'ended';
    previousGuesses?: string[];
}
export interface AIResponse {
    thinking: string[];
    guess: string;
}
export interface AIHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    version: string;
    features: string[];
}
export declare class MockAIService {
    private readonly serviceStartTime;
    private readonly version;
    private readonly thinkingTemplates;
    constructor();
    analyzeConversation(conversationHistory: Message[], secretWord: string, gameContext?: GameContext): Promise<AIResponse>;
    generateThinkingProcess(conversationHistory: Message[], gameContext?: GameContext): Promise<string[]>;
    generateGuess(conversationHistory: Message[], availableWords: string[], gameContext?: GameContext): Promise<string>;
    private hasSemanticConnection;
    private getMockAvailableWords;
    getHealth(): Promise<AIHealth>;
    simulateResponseDelay(minDelay?: number, maxDelay?: number): Promise<void>;
}
//# sourceMappingURL=mock.d.ts.map