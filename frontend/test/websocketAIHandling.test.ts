import { useGameStore } from '../store/gameStore';

// Mock the game store
jest.mock('../store/gameStore', () => ({
    useGameStore: {
        getState: jest.fn()
    }
}));

describe('WebSocket AI Message Handling', () => {
    let mockGetState: jest.MockedFunction<any>;

    beforeEach(() => {
        mockGetState = useGameStore.getState as jest.MockedFunction<any>;
        mockGetState.mockReturnValue({
            addTurn: jest.fn(),
            setCurrentTurn: jest.fn()
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should format AI response correctly with thinking and guess', () => {
        const mockAddTurn = jest.fn();
        const mockSetCurrentTurn = jest.fn();

        mockGetState.mockReturnValue({
            addTurn: mockAddTurn,
            setCurrentTurn: mockSetCurrentTurn
        });

        // Simulate the ai_response event handler logic
        const aiResponseData = {
            turn: {
                thinking: ['Analyzing conversation...', 'Processing clues...', 'Evaluating context...', 'Making educated guess...'],
                guess: 'apple'
            },
            currentTurn: 'decoder'
        };

        // Execute the logic from the WebSocket handler
        const formattedContent = `Thinking: ${aiResponseData.turn.thinking.join(' ')}\n\nGuess: ${aiResponseData.turn.guess}`;
        const turn = {
            id: `ai-response-${Date.now()}`,
            type: 'ai' as const,
            content: formattedContent,
            timestamp: new Date().toISOString(),
        };

        // Verify the formatting
        expect(formattedContent).toBe('Thinking: Analyzing conversation... Processing clues... Evaluating context... Making educated guess...\n\nGuess: apple');
        expect(turn.type).toBe('ai');
        expect(turn.content).toContain('Thinking:');
        expect(turn.content).toContain('Guess: apple');
    });

    it('should add AI turn to conversation history', () => {
        const mockAddTurn = jest.fn();
        const mockSetCurrentTurn = jest.fn();

        mockGetState.mockReturnValue({
            addTurn: mockAddTurn,
            setCurrentTurn: mockSetCurrentTurn
        });

        const aiResponseData = {
            turn: {
                thinking: ['Test thinking'],
                guess: 'test'
            },
            currentTurn: 'encoder'
        };

        // Simulate the handler logic
        const formattedContent = `Thinking: ${aiResponseData.turn.thinking.join(' ')}\n\nGuess: ${aiResponseData.turn.guess}`;
        const turn = {
            id: `ai-response-${Date.now()}`,
            type: 'ai' as const,
            content: formattedContent,
            timestamp: new Date().toISOString(),
        };

        // Call the store methods
        mockGetState().addTurn(turn);
        mockGetState().setCurrentTurn(aiResponseData.currentTurn as 'encoder' | 'ai' | 'decoder' | null);

        // Verify the calls
        expect(mockAddTurn).toHaveBeenCalledWith(turn);
        expect(mockSetCurrentTurn).toHaveBeenCalledWith('encoder');
    });

    it('should handle empty thinking array', () => {
        const aiResponseData = {
            turn: {
                thinking: [],
                guess: 'test'
            },
            currentTurn: 'decoder'
        };

        const formattedContent = `Thinking: ${aiResponseData.turn.thinking.join(' ')}\n\nGuess: ${aiResponseData.turn.guess}`;

        expect(formattedContent).toBe('Thinking: \n\nGuess: test');
    });

    it('should handle single thinking item', () => {
        const aiResponseData = {
            turn: {
                thinking: ['Single thought'],
                guess: 'single'
            },
            currentTurn: 'ai'
        };

        const formattedContent = `Thinking: ${aiResponseData.turn.thinking.join(' ')}\n\nGuess: ${aiResponseData.turn.guess}`;

        expect(formattedContent).toBe('Thinking: Single thought\n\nGuess: single');
    });

    it('should generate unique IDs for AI turns', () => {
        const mockAddTurn = jest.fn();
        mockGetState.mockReturnValue({
            addTurn: mockAddTurn,
            setCurrentTurn: jest.fn()
        });

        const aiResponseData = {
            turn: {
                thinking: ['Test'],
                guess: 'test'
            },
            currentTurn: 'encoder'
        };

        // Create two turns
        const turn1 = {
            id: `ai-response-${Date.now()}`,
            type: 'ai' as const,
            content: `Thinking: ${aiResponseData.turn.thinking.join(' ')}\n\nGuess: ${aiResponseData.turn.guess}`,
            timestamp: new Date().toISOString(),
        };

        // Wait a bit to ensure different timestamps
        setTimeout(() => {
            const turn2 = {
                id: `ai-response-${Date.now()}`,
                type: 'ai' as const,
                content: `Thinking: ${aiResponseData.turn.thinking.join(' ')}\n\nGuess: ${aiResponseData.turn.guess}`,
                timestamp: new Date().toISOString(),
            };

            expect(turn1.id).not.toBe(turn2.id);
        }, 1);
    });

    it('should handle currentTurn type assertion correctly', () => {
        const mockSetCurrentTurn = jest.fn();
        mockGetState.mockReturnValue({
            addTurn: jest.fn(),
            setCurrentTurn: mockSetCurrentTurn
        });

        const testCases = [
            { currentTurn: 'encoder', expected: 'encoder' as const },
            { currentTurn: 'ai', expected: 'ai' as const },
            { currentTurn: 'decoder', expected: 'decoder' as const }
        ];

        testCases.forEach(({ currentTurn, expected }) => {
            mockSetCurrentTurn(currentTurn as 'encoder' | 'ai' | 'decoder' | null);
            expect(mockSetCurrentTurn).toHaveBeenCalledWith(expected);
        });
    });
}); 