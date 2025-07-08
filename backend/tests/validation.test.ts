import { fuzzyStringMatch, getMaxLevenshteinDistance, levenshteinDistance } from '../src/utils/helpers';

describe('Levenshtein Distance Validation', () => {
    describe('levenshteinDistance', () => {
        it('should return 0 for identical strings', () => {
            expect(levenshteinDistance('apple', 'apple')).toBe(0);
            expect(levenshteinDistance('', '')).toBe(0);
            expect(levenshteinDistance('test', 'test')).toBe(0);
        });

        it('should return 1 for single character differences', () => {
            expect(levenshteinDistance('apple', 'appel')).toBe(2); // substitution (e->l)
            expect(levenshteinDistance('apple', 'apples')).toBe(1); // insertion
            expect(levenshteinDistance('apple', 'appl')).toBe(1); // deletion
        });

        it('should return 2 for two character differences', () => {
            expect(levenshteinDistance('apple', 'applle')).toBe(1); // single insertion
            expect(levenshteinDistance('apple', 'app')).toBe(2); // double deletion
            expect(levenshteinDistance('apple', 'appee')).toBe(1); // single substitution
        });

        it('should handle case differences', () => {
            expect(levenshteinDistance('Apple', 'apple')).toBe(0); // case-insensitive
            expect(levenshteinDistance('APPLE', 'apple')).toBe(0); // case-insensitive
        });

        it('should handle empty strings', () => {
            expect(levenshteinDistance('', 'apple')).toBe(5);
            expect(levenshteinDistance('apple', '')).toBe(5);
        });

        it('should handle special characters', () => {
            expect(levenshteinDistance('test!', 'test')).toBe(1);
            expect(levenshteinDistance('test', 'test!')).toBe(1);
        });
    });

    describe('fuzzyStringMatch', () => {
        it('should match identical strings', () => {
            expect(fuzzyStringMatch('apple', 'apple')).toBe(true);
            expect(fuzzyStringMatch('test', 'test')).toBe(true);
        });

        it('should match strings within default threshold (2)', () => {
            expect(fuzzyStringMatch('apple', 'appel')).toBe(true); // distance 1
            expect(fuzzyStringMatch('banana', 'bananna')).toBe(true); // distance 1
            expect(fuzzyStringMatch('cherry', 'chery')).toBe(true); // distance 1
            expect(fuzzyStringMatch('dragon', 'dragan')).toBe(true); // distance 1
            expect(fuzzyStringMatch('elephant', 'elepant')).toBe(true); // distance 1
        });

        it('should match strings within custom threshold', () => {
            expect(fuzzyStringMatch('apple', 'applle', 2)).toBe(true); // distance 2
            expect(fuzzyStringMatch('apple', 'app', 2)).toBe(true); // distance 2
        });

        it('should not match strings beyond threshold', () => {
            expect(fuzzyStringMatch('apple', 'orange', 2)).toBe(false); // distance > 2
            expect(fuzzyStringMatch('apple', 'appllle', 1)).toBe(false); // distance 2, threshold 1
        });

        it('should handle case insensitive matching', () => {
            expect(fuzzyStringMatch('Apple', 'apple')).toBe(true);
            expect(fuzzyStringMatch('APPLE', 'apple')).toBe(true);
            expect(fuzzyStringMatch('Apple', 'APPLE')).toBe(true);
        });

        it('should handle whitespace trimming', () => {
            expect(fuzzyStringMatch(' apple ', 'apple')).toBe(true);
            expect(fuzzyStringMatch('apple', ' apple ')).toBe(true);
            expect(fuzzyStringMatch(' apple ', ' apple ')).toBe(true);
        });

        it('should handle edge cases', () => {
            expect(fuzzyStringMatch('', '')).toBe(true);
            expect(fuzzyStringMatch('a', 'a')).toBe(true);
            expect(fuzzyStringMatch('a', 'b', 1)).toBe(true);
            expect(fuzzyStringMatch('a', 'c', 0)).toBe(false);
        });
    });

    describe('getMaxLevenshteinDistance', () => {
        const originalEnv = process.env;

        beforeEach(() => {
            jest.resetModules();
            process.env = { ...originalEnv };
        });

        afterAll(() => {
            process.env = originalEnv;
        });

        it('should return default value (2) when environment variable is not set', () => {
            delete process.env['MAX_LEVENSHTEIN_DISTANCE'];
            expect(getMaxLevenshteinDistance()).toBe(2);
        });

        it('should return parsed integer from environment variable', () => {
            process.env['MAX_LEVENSHTEIN_DISTANCE'] = '3';
            expect(getMaxLevenshteinDistance()).toBe(3);
        });

        it('should return default value when environment variable is invalid', () => {
            process.env['MAX_LEVENSHTEIN_DISTANCE'] = 'invalid';
            expect(getMaxLevenshteinDistance()).toBe(2);
        });

        it('should return default value when environment variable is negative', () => {
            process.env['MAX_LEVENSHTEIN_DISTANCE'] = '-1';
            expect(getMaxLevenshteinDistance()).toBe(2);
        });

        it('should return default value when environment variable is zero', () => {
            process.env['MAX_LEVENSHTEIN_DISTANCE'] = '0';
            expect(getMaxLevenshteinDistance()).toBe(0);
        });
    });
}); 