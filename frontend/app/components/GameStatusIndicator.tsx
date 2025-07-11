import React from 'react';
import { StyleSheet } from 'react-native';
import { GameStatus } from '../../store/gameStore';

interface GameStatusIndicatorProps {
    gameStatus: GameStatus;
    currentTurn: 'encoder' | 'ai' | 'decoder' | null;
    playerRole: 'encoder' | 'decoder' | null;
    round: number;
    maxRounds: number;
    isLoading?: boolean;
}

const GameStatusIndicator: React.FC<GameStatusIndicatorProps> = ({
    gameStatus,
    currentTurn,
    playerRole,
    round,
    maxRounds,
    isLoading = false,
}) => {
    const getStatusText = () => {
        if (isLoading) {
            return 'Loading...';
        }

        switch (gameStatus) {
            case 'waiting':
                return 'Waiting for players...';
            case 'active':
                return 'Game in progress...';
            case 'ended':
                return 'Game ended';
            default:
                return 'Unknown status';
        }
    };

    const getStatusColor = () => {
        if (isLoading) {
            return '#007AFF';
        }

        switch (gameStatus) {
            case 'waiting':
                return '#FF9500';
            case 'active':
                if (currentTurn === playerRole) {
                    return '#34C759';
                } else if (currentTurn === 'ai') {
                    return '#5856D6';
                } else {
                    return '#007AFF';
                }
            case 'ended':
                return '#FF3B30';
            default:
                return '#8E8E93';
        }
    };

    const isMyTurn = currentTurn === playerRole;

    return (
        <></>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    loadingIndicator: {
        marginRight: 8,
    },
    statusText: {
        fontSize: 16,
    },
    roundContainer: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    roundText: {
        fontSize: 14,
        color: '#8E8E93',
    },
});

export default GameStatusIndicator; 