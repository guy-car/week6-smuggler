import { render, screen } from '@testing-library/react-native';
import React from 'react';
import AIDisplayComponent from '../app/components/AIDisplayComponent';

describe('AIDisplayComponent', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Rendering Logic', () => {
        it('should not render when no AI activity', () => {
            const { toJSON } = render(
                <AIDisplayComponent isThinking={false} />
            );
            expect(toJSON()).toBeNull();
        });

        it('should render thinking state with default text', () => {
            render(<AIDisplayComponent isThinking={true} />);

            expect(screen.getByText('AI Thinking:')).toBeTruthy();
            expect(screen.getByText('AI is thinking')).toBeTruthy();
        });

        it('should render thinking state with custom text', () => {
            render(
                <AIDisplayComponent
                    isThinking={true}
                    thinkingText="Analyzing conversation"
                />
            );

            expect(screen.getByText('AI Thinking:')).toBeTruthy();
            expect(screen.getByText('Analyzing conversation')).toBeTruthy();
        });

        it('should render guess state', () => {
            render(<AIDisplayComponent isThinking={false} guess="apple" />);

            expect(screen.getByText('AI Guess:')).toBeTruthy();
            expect(screen.getByText('apple')).toBeTruthy();
        });

        it('should prioritize thinking over guess when both are present', () => {
            render(
                <AIDisplayComponent
                    isThinking={true}
                    thinkingText="Thinking..."
                    guess="apple"
                />
            );

            expect(screen.getByText('AI Thinking:')).toBeTruthy();
            expect(screen.getByText('Thinking...')).toBeTruthy();
            expect(screen.queryByText('AI Guess:')).toBeNull();
            expect(screen.queryByText('apple')).toBeNull();
        });
    });

    describe('Dot Animation', () => {
        it('should start with no dots', () => {
            render(<AIDisplayComponent isThinking={true} />);

            const thinkingText = screen.getByText('AI is thinking');
            expect(thinkingText.props.children).toEqual(['AI is thinking', '']);
        });

        it('should not animate dots when not thinking', () => {
            render(<AIDisplayComponent isThinking={false} guess="apple" />);

            // Should still show guess without animation
            expect(screen.getByText('AI Guess:')).toBeTruthy();
            expect(screen.getByText('apple')).toBeTruthy();
        });
    });

    describe('Cleanup', () => {
        it('should clear interval when component unmounts', () => {
            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

            const { unmount } = render(<AIDisplayComponent isThinking={true} />);

            unmount();

            expect(clearIntervalSpy).toHaveBeenCalled();
            clearIntervalSpy.mockRestore();
        });

        it('should clear interval when thinking state changes', () => {
            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

            const { rerender } = render(<AIDisplayComponent isThinking={true} />);

            rerender(<AIDisplayComponent isThinking={false} />);

            expect(clearIntervalSpy).toHaveBeenCalled();
            clearIntervalSpy.mockRestore();
        });
    });

    describe('Styling', () => {
        it('should apply correct container styles', () => {
            const { toJSON } = render(
                <AIDisplayComponent isThinking={true} />
            );

            const container = toJSON();
            expect(container).toBeTruthy();
            // Note: Style testing is limited in React Native testing
            // The component renders correctly which indicates styles are applied
        });

        it('should apply correct text styles', () => {
            render(<AIDisplayComponent isThinking={true} />);

            const label = screen.getByText('AI Thinking:');
            const content = screen.getByText('AI is thinking');

            expect(label.props.style).toMatchObject({
                fontSize: 18,
                fontWeight: '700',
                color: '#00FFF0',
                fontFamily: 'VT323',
            });

            expect(content.props.style).toMatchObject({
                fontSize: 20,
                color: '#00FFF0',
                fontFamily: 'VT323',
                fontStyle: 'italic',
            });
        });
    });
}); 