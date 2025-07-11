import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ScoreProgressBarProps {
    score: number;
    maxScore?: number;
    aiWinsScore: number;
    humansWinScore: number;
    isInModal?: boolean;
}

const getCircleColor = (score: number, aiWinsScore: number, humansWinScore: number) => {
    if (score === aiWinsScore) return '#FF3B30'; // AI wins (red)
    if (score === humansWinScore) return '#30FF6A'; // Humans win (green)
    // Determine which side is winning
    const mid = (aiWinsScore + humansWinScore) / 2;
    if (score < mid) return '#FF3B30'; // AI side
    if (score > mid) return '#30FF6A'; // Human side
    return '#FFC300'; // Neutral (gold)
};

const ScoreProgressBar: React.FC<ScoreProgressBarProps> = ({
    score,
    maxScore,
    aiWinsScore = 0,
    humansWinScore = 6,
    isInModal = false,
}) => {
    // Dynamic range based on aiWinsScore and humansWinScore
    const minScore = Math.min(aiWinsScore, humansWinScore);
    const maxScoreVal = Math.max(aiWinsScore, humansWinScore);
    const totalSteps = (typeof maxScore === 'number' ? maxScore : Math.abs(humansWinScore - aiWinsScore)) + 1;
    const stepValues = Array.from({ length: totalSteps }, (_, i) => minScore + i);
    // Clamp score to range
    const clampedScore = Math.max(minScore, Math.min(score, maxScoreVal));
    // Find index of current score
    const currentStepIdx = stepValues.indexOf(clampedScore);
    // Determine filled color
    const filledColor = getCircleColor(clampedScore, aiWinsScore, humansWinScore);

    return (
        <View style={styles.wrapper}>
            {/* Background overlay - only show when not in modal */}

            <View style={styles.container}>
                {/* Stepper */}
                <View style={styles.stepperRow}>
                    {stepValues.map((val, idx) => {
                        const isFilled = idx === currentStepIdx;
                        return (
                            <View
                                key={val}
                                style={[
                                    styles.circle,
                                    isFilled && {
                                        backgroundColor: filledColor,
                                        borderColor: filledColor,
                                        shadowColor: filledColor,
                                        shadowOffset: { width: 0, height: 0 },
                                        shadowOpacity: 0.9,
                                        shadowRadius: 10,
                                        elevation: 8,
                                    },
                                    !isFilled && {
                                        // Inverted: green to the left, red to the right
                                        borderColor: idx < currentStepIdx ? '#30FF6A' : idx > currentStepIdx ? '#FF3B30' : '#FFC300',
                                    },
                                ]}
                            />
                        );
                    })}
                </View>
                {/* Labels removed */}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
        width: '80%',
        alignSelf: 'center',
        backgroundColor: 'transparent',
    },
    container: {
        marginTop: 4,
        paddingHorizontal: 8,
        backgroundColor: 'transparent',
        alignItems: 'stretch',
    },
    labelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 0,
        position: 'relative',
    },
    label: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Impact', // fallback to system if not available
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        letterSpacing: 1,
    },
    leftLabel: {
        textAlign: 'left',
        minWidth: 80,
        marginRight: 8,
    },
    rightLabel: {
        textAlign: 'right',
        minWidth: 80,
        marginLeft: 8,
    },
    centerLabel: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Impact',
        textAlign: 'center',
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 6,
        letterSpacing: 2,
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 1,
    },
    stepperRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 0,
        marginTop: 2,
        marginBottom: 2,
    },
    circle: {
        width: 18,
        height: 18,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: '#fff',
        backgroundColor: 'transparent',
        marginHorizontal: 3,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
});

export default ScoreProgressBar; 