import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../../store/gameStore';
import ScoreProgressBar from './ScoreProgressBar';

interface RoundModalProps {
    visible?: boolean;
    winner?: 'ai' | 'humans';
    onDismiss?: () => void;
}

const RoundModal: React.FC<RoundModalProps> = ({ visible: propVisible, winner: propWinner, onDismiss: propOnDismiss }) => {
    const { score, setShowGuessesModal, conversationHistory, lastAIGuess } = useGameStore();
    const [visible, setVisible] = useState(false);
    const [winner, setWinner] = useState<'ai' | 'humans' | null>(null);
    const [previousScore, setPreviousScore] = useState(score);
    const [correctGuess, setCorrectGuess] = useState<string>('');
    const [pointsChange, setPointsChange] = useState<number>(0);

    // Detect score changes and determine winner
    useEffect(() => {
        if (score !== previousScore) {
            // Calculate points change
            const change = score - previousScore;
            setPointsChange(change);
            
            // Determine who won based on score change
            let roundWinner: 'ai' | 'humans';
            if (score > previousScore) {
                roundWinner = 'humans';
            } else {
                roundWinner = 'ai';
            }
            setWinner(roundWinner);
            setVisible(true);
            setPreviousScore(score);

            // Find the correct guess for the modal
            if (roundWinner === 'ai') {
                setCorrectGuess(lastAIGuess || '');
            } else {
                // For human win, use the last non-AI guess
                const lastHumanGuess = [...conversationHistory].reverse().find(turn => turn.type === 'decryptor');
                if (lastHumanGuess && lastHumanGuess.content) {
                    const guessMatch = lastHumanGuess.content.match(/guessed: (.+)$/i);
                    if (guessMatch) {
                        setCorrectGuess(guessMatch[1]);
                    } else {
                        setCorrectGuess(lastHumanGuess.content);
                    }
                } else {
                    setCorrectGuess('');
                }
            }
        }
    }, [score, previousScore, conversationHistory, lastAIGuess]);

    // Use props if provided, otherwise use internal state
    const isVisible = propVisible !== undefined ? propVisible : visible;
    const roundWinner = propWinner || winner || 'humans';
    const handleDismiss = propOnDismiss || (() => {
        setVisible(false);
        setShowGuessesModal(false);
    });

    const isAI = roundWinner === 'ai';
    const bgColor = isAI ? 'rgba(255, 59, 48, 0.95)' : 'rgba(76, 217, 100, 0.95)';
    const textColor = '#fff';
    const message = isAI ? 'AI WINS THE ROUND' : 'HUMANS WIN THE ROUND';
    const pointsText = pointsChange > 0 ? `+${pointsChange}` : `${pointsChange}`;

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={handleDismiss}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalBox, { backgroundColor: bgColor }]}> 
                    {/* Score Progress Bar Header */}
                    <View style={styles.progressBarHeader}>
                        <View style={styles.progressBarHeaderBg} />
                        <View style={styles.progressBarHeaderContent}>
                            <ScoreProgressBar
                                score={score}
                                maxScore={10}
                                aiWinsScore={0}
                                humansWinScore={10}
                            />
                        </View>
                    </View>
                    {/* End Score Progress Bar Header */}

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
        marginTop: -50,
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
    progressBarContainer: {
        width: '100%',    },
    // Add new styles for the header
    progressBarHeader: {
        width: '120%',
        alignSelf: 'center',
        marginHorizontal: -32,
        marginTop: -48,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    progressBarHeaderBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        zIndex: 0,
        height: 80,

    },
    progressBarHeaderContent: {
        zIndex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -120,
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