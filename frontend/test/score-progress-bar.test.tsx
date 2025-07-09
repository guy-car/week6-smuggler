import { render, screen } from '@testing-library/react-native';
import React from 'react';
import ScoreProgressBar from '../app/components/ScoreProgressBar';

describe('ScoreProgressBar', () => {
    const defaultProps = {
        score: 0,
        maxScore: 10,
        aiWinsScore: -5,
        humansWinScore: 5,
    };

    it('renders endpoint labels', () => {
        render(<ScoreProgressBar {...defaultProps} />);

        expect(screen.getByText('AI Wins')).toBeTruthy();
        expect(screen.getByText('Humans Win')).toBeTruthy();
    });

    it('renders current score', () => {
        render(<ScoreProgressBar {...defaultProps} />);

        expect(screen.getByText('Current Score:')).toBeTruthy();
        expect(screen.getByText('0')).toBeTruthy();
    });

    it('renders score labels on the bar', () => {
        render(<ScoreProgressBar {...defaultProps} />);

        expect(screen.getByText('-5')).toBeTruthy();
        expect(screen.getByText('5')).toBeTruthy();
    });

    it('handles positive score', () => {
        render(<ScoreProgressBar {...defaultProps} score={3} />);

        expect(screen.getByText('3')).toBeTruthy();
    });

    it('handles negative score', () => {
        render(<ScoreProgressBar {...defaultProps} score={-2} />);

        expect(screen.getByText('-2')).toBeTruthy();
    });

    it('handles score at AI wins endpoint', () => {
        render(<ScoreProgressBar {...defaultProps} score={-5} />);
        expect(screen.getAllByText('-5').length).toBeGreaterThan(0);
    });

    it('handles score at humans win endpoint', () => {
        render(<ScoreProgressBar {...defaultProps} score={5} />);
        expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    });

    it('handles score beyond AI wins endpoint', () => {
        render(<ScoreProgressBar {...defaultProps} score={-10} />);

        expect(screen.getByText('-10')).toBeTruthy();
    });

    it('handles score beyond humans win endpoint', () => {
        render(<ScoreProgressBar {...defaultProps} score={10} />);

        expect(screen.getByText('10')).toBeTruthy();
    });

    it('handles different score ranges', () => {
        const props = {
            score: 50,
            maxScore: 100,
            aiWinsScore: 0,
            humansWinScore: 100,
        };

        render(<ScoreProgressBar {...props} />);

        expect(screen.getByText('AI Wins')).toBeTruthy();
        expect(screen.getByText('Humans Win')).toBeTruthy();
        expect(screen.getByText('50')).toBeTruthy();
        expect(screen.getByText('0')).toBeTruthy();
        expect(screen.getByText('100')).toBeTruthy();
    });

    it('handles zero score range', () => {
        const props = {
            score: 0,
            maxScore: 10,
            aiWinsScore: 0,
            humansWinScore: 0,
        };

        render(<ScoreProgressBar {...props} />);
        expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });

    it('handles very small score range', () => {
        const props = {
            score: 0.5,
            maxScore: 1,
            aiWinsScore: 0,
            humansWinScore: 1,
        };

        render(<ScoreProgressBar {...props} />);

        expect(screen.getByText('0.5')).toBeTruthy();
    });

    it('handles very large score range', () => {
        const props = {
            score: 5000,
            maxScore: 10000,
            aiWinsScore: -5000,
            humansWinScore: 5000,
        };

        render(<ScoreProgressBar {...props} />);
        expect(screen.getAllByText('5000').length).toBeGreaterThan(0);
        expect(screen.getAllByText('-5000').length).toBeGreaterThan(0);
    });
}); 