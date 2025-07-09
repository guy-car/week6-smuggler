import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ScoreProgressBarProps {
    score: number;
    maxScore: number;
    aiWinsScore: number;
    humansWinScore: number;
}

const ScoreProgressBar: React.FC<ScoreProgressBarProps> = ({
    score,
    maxScore,
    aiWinsScore,
    humansWinScore,
}) => {
    // Calculate the position of the score indicator
    const totalRange = humansWinScore - aiWinsScore;
    const currentPosition = ((score - aiWinsScore) / totalRange) * 100;
    const clampedPosition = Math.max(0, Math.min(100, currentPosition));

    return (
        <View style={styles.container}>
            <View style={styles.endpointsContainer}>
                <Text style={styles.endpointLabel}>AI Wins</Text>
                <Text style={styles.endpointLabel}>Humans Win</Text>
            </View>

            <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                    {/* Score indicator dot */}
                    <View
                        style={[
                            styles.scoreIndicator,
                            { left: `${clampedPosition}%` }
                        ]}
                    />

                    {/* Center line (neutral position) */}
                    <View style={styles.centerLine} />

                    {/* Score labels */}
                    <View style={styles.scoreLabels}>
                        <Text style={styles.scoreLabel}>{aiWinsScore}</Text>
                        <Text style={styles.scoreLabel}>5</Text>
                        <Text style={styles.scoreLabel}>{humansWinScore}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.currentScoreContainer}>
                <Text style={styles.currentScoreLabel}>Current Score:</Text>
                <Text style={styles.currentScoreValue}>{score}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 6, // reduced from 16
        backgroundColor: '#FFFFFF',
        borderRadius: 8, // reduced from 12
        marginHorizontal: 8, // reduced from 16
        marginVertical: 4, // reduced from 8
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1, // reduced from 2
        },
        shadowOpacity: 0.08, // reduced
        shadowRadius: 2, // reduced from 4
        elevation: 1, // reduced from 3
    },
    endpointsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2, // reduced from 8
    },
    endpointLabel: {
        fontSize: 11, // reduced from 14
        fontWeight: '600',
        color: '#007AFF',
    },
    progressBarContainer: {
        position: 'relative',
        height: 18, // reduced from 40
        marginBottom: 2, // reduced from 8
    },
    progressBar: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        borderRadius: 9, // reduced from 20
        position: 'relative',
        overflow: 'hidden',
    },
    scoreIndicator: {
        position: 'absolute',
        top: 2, // reduced from 8
        width: 12, // reduced from 24
        height: 12, // reduced from 24
        borderRadius: 6, // reduced from 12
        backgroundColor: '#FF3B30',
        borderWidth: 2, // reduced from 3
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1, // reduced from 2
        },
        shadowOpacity: 0.15, // reduced
        shadowRadius: 2, // reduced from 4
        elevation: 1, // reduced from 4
        transform: [{ translateX: -6 }], // Center the dot
    },
    centerLine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        width: 1, // reduced from 2
        backgroundColor: '#007AFF',
        transform: [{ translateX: -0.5 }],
    },
    scoreLabels: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4, // reduced from 8
    },
    scoreLabel: {
        fontSize: 10, // reduced from 12
        fontWeight: '500',
        color: '#8E8E93',
    },
    currentScoreContainer: {
        display: 'none', // hide current score
    },
    currentScoreLabel: {
        fontSize: 12, // reduced from 14
        fontWeight: '500',
        color: '#8E8E93',
        marginRight: 4, // reduced from 8
    },
    currentScoreValue: {
        fontSize: 14, // reduced from 18
        fontWeight: 'bold',
        color: '#007AFF',
    },
});

export default ScoreProgressBar; 