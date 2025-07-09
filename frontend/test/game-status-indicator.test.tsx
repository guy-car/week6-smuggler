import { render, screen } from '@testing-library/react-native';
import React from 'react';
import GameStatusIndicator from '../app/components/GameStatusIndicator';
import { GameStatus } from '../store/gameStore';

describe('GameStatusIndicator', () => {
    const defaultProps = {
        gameStatus: 'waiting' as GameStatus,
        currentTurn: null as 'encryptor' | 'ai' | 'decryptor' | null,
        playerRole: null as 'encryptor' | 'decryptor' | null,
        round: 1,
        maxRounds: 5,
    };

    it('renders waiting status correctly', () => {
        render(<GameStatusIndicator {...defaultProps} />);

        expect(screen.getByText('Waiting for players...')).toBeTruthy();
        expect(screen.getByText('Round 1/5')).toBeTruthy();
    });

    it('renders active status with no current turn', () => {
        render(<GameStatusIndicator {...defaultProps} gameStatus="active" />);

        expect(screen.getByText('Game in progress...')).toBeTruthy();
        expect(screen.getByText('Round 1/5')).toBeTruthy();
    });

    it('renders encryptor turn for encryptor player', () => {
        render(
            <GameStatusIndicator
                {...defaultProps}
                gameStatus="active"
                currentTurn="encryptor"
                playerRole="encryptor"
            />
        );

        expect(screen.getByText('Your turn - give a hint!')).toBeTruthy();
        expect(screen.getByText('Encryptor Turn')).toBeTruthy();
        expect(screen.getByText("It's your turn!")).toBeTruthy();
    });

    it('renders encryptor turn for decryptor player', () => {
        render(
            <GameStatusIndicator
                {...defaultProps}
                gameStatus="active"
                currentTurn="encryptor"
                playerRole="decryptor"
            />
        );

        expect(screen.getByText('Encryptor is thinking...')).toBeTruthy();
        expect(screen.getByText('Encryptor Turn')).toBeTruthy();
    });

    it('renders AI turn', () => {
        render(
            <GameStatusIndicator
                {...defaultProps}
                gameStatus="active"
                currentTurn="ai"
                playerRole="encryptor"
            />
        );

        expect(screen.getByText('AI is thinking...')).toBeTruthy();
        expect(screen.getByText('AI Turn')).toBeTruthy();
    });

    it('renders decryptor turn for decryptor player', () => {
        render(
            <GameStatusIndicator
                {...defaultProps}
                gameStatus="active"
                currentTurn="decryptor"
                playerRole="decryptor"
            />
        );

        expect(screen.getByText('Your turn - make a guess!')).toBeTruthy();
        expect(screen.getByText('Decryptor Turn')).toBeTruthy();
        expect(screen.getByText("It's your turn!")).toBeTruthy();
    });

    it('renders decryptor turn for encryptor player', () => {
        render(
            <GameStatusIndicator
                {...defaultProps}
                gameStatus="active"
                currentTurn="decryptor"
                playerRole="encryptor"
            />
        );

        expect(screen.getByText('Decryptor is thinking...')).toBeTruthy();
        expect(screen.getByText('Decryptor Turn')).toBeTruthy();
    });

    it('renders ended status', () => {
        render(<GameStatusIndicator {...defaultProps} gameStatus="ended" />);

        expect(screen.getByText('Game ended')).toBeTruthy();
        expect(screen.getByText('Round 1/5')).toBeTruthy();
    });

    it('renders loading state', () => {
        render(<GameStatusIndicator {...defaultProps} isLoading={true} />);

        expect(screen.getByText('Loading...')).toBeTruthy();
    });

    it('renders different round numbers', () => {
        render(<GameStatusIndicator {...defaultProps} round={3} maxRounds={10} />);

        expect(screen.getByText('Round 3/10')).toBeTruthy();
    });

    it('does not show turn indicator when game is not active', () => {
        render(
            <GameStatusIndicator
                {...defaultProps}
                gameStatus="waiting"
                currentTurn="encryptor"
                playerRole="encryptor"
            />
        );

        expect(screen.queryByText('Encryptor Turn')).toBeFalsy();
        expect(screen.queryByText("It's your turn!")).toBeFalsy();
    });

    it('does not show my turn indicator when it is not my turn', () => {
        render(
            <GameStatusIndicator
                {...defaultProps}
                gameStatus="active"
                currentTurn="encryptor"
                playerRole="decryptor"
            />
        );

        expect(screen.queryByText("It's your turn!")).toBeFalsy();
    });

    it('handles null player role', () => {
        render(
            <GameStatusIndicator
                {...defaultProps}
                gameStatus="active"
                currentTurn="encryptor"
                playerRole={null}
            />
        );

        expect(screen.getByText('Encryptor is thinking...')).toBeTruthy();
    });

    it('handles edge case round numbers', () => {
        render(<GameStatusIndicator {...defaultProps} round={0} maxRounds={1} />);

        expect(screen.getByText('Round 0/1')).toBeTruthy();
    });

    it('handles large round numbers', () => {
        render(<GameStatusIndicator {...defaultProps} round={999} maxRounds={1000} />);

        expect(screen.getByText('Round 999/1000')).toBeTruthy();
    });
}); 