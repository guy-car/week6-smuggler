import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../../store/gameStore';
import ScoreProgressBar from './ScoreProgressBar';

const RoundModal: React.FC = () => {
    const {
        showRoundModal,
        roundModalData,
        setShowRoundModal,
        setRoundModalData,
        score
    } = useGameStore();

    const handleDismiss = () => {
        setShowRoundModal(false);
        setRoundModalData(null);
    };

    if (!showRoundModal || !roundModalData) {
        return null;
    }

    const { winner, correctGuess, pointsChange } = roundModalData;
    const isAI = winner === 'ai';
    const bgColor = isAI ? 'rgba(255, 59, 48, 0.95)' : 'rgba(76, 217, 100, 0.95)';
    const textColor = '#fff';
    const message = isAI ? 'AI WINS THE ROUND' : 'HUMANS WIN THE ROUND';
    const pointsText = pointsChange > 0 ? `+${pointsChange}` : `${pointsChange}`;

    return (
        <Modal
            visible={showRoundModal}
            transparent
            animationType="fade"
            onRequestClose={handleDismiss}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalBox, { backgroundColor: bgColor }]}>
                    {/* Score Progress Bar */}
                    <View style={styles.scoreBarContainer}>
                        <ScoreProgressBar
                            score={score}
                            maxScore={6}
                            aiWinsScore={0}
                            humansWinScore={6}
                            isInModal={true}
                        />
                    </View>

                    <Text style={[styles.modalText, { color: textColor }]}>{message}</Text>

                    {correctGuess && (
                        <Text style={[styles.guessText, { color: textColor }]}>Correct guess: {correctGuess}</Text>
                    )}

                    <Text style={[styles.pointsText, { color: textColor }]}>Points: {pointsText}</Text>

                    <TouchableOpacity
                        style={[styles.nextRoundButton, { backgroundColor: textColor }]}
                        onPress={handleDismiss}
                    >
                        <Text style={[styles.nextRoundButtonText, { color: bgColor }]}>Next Round</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        borderRadius: 24,
        paddingVertical: 48,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 280,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    modalText: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 1.5,
        marginBottom: 16,
        marginTop: 0,
    },
    guessText: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 12,
    },
    pointsText: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
    },
    scoreBarContainer: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 4,
        width: '100%',
        top: -30,
        height: 100,
    },
    nextRoundButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    nextRoundButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default RoundModal; 