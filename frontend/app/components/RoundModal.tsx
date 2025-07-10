import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../../store/gameStore';

interface RoundModalProps {
    visible?: boolean;
    winner?: 'ai' | 'humans';
    onDismiss?: () => void;
}

const RoundModal: React.FC<RoundModalProps> = ({ visible: propVisible, winner: propWinner, onDismiss: propOnDismiss }) => {
    const { score, setShowGuessesModal } = useGameStore();
    const [visible, setVisible] = useState(false);
    const [winner, setWinner] = useState<'ai' | 'humans' | null>(null);
    const [previousScore, setPreviousScore] = useState(score);

    // Detect score changes and determine winner
    useEffect(() => {
        if (score !== previousScore) {
            // Determine who won based on score change
            let roundWinner: 'ai' | 'humans';
            
            if (score > previousScore) {
                // Score increased - humans won
                roundWinner = 'humans';
            } else {
                // Score decreased - AI won
                roundWinner = 'ai';
            }
            
            setWinner(roundWinner);
            setVisible(true);
            setPreviousScore(score);
        }
    }, [score, previousScore]);

    // Use props if provided, otherwise use internal state
    const isVisible = propVisible !== undefined ? propVisible : visible;
    const roundWinner = propWinner || winner || 'humans';
    const handleDismiss = propOnDismiss || (() => {
        setVisible(false);
        setShowGuessesModal(false);
    });

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(handleDismiss, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, handleDismiss]);

    const isAI = roundWinner === 'ai';
    const bgColor = isAI ? 'rgba(255, 59, 48, 0.95)' : 'rgba(76, 217, 100, 0.95)';
    const textColor = '#fff';
    const message = isAI ? 'AI WINS THE ROUND' : 'HUMANS WIN THE ROUND';

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={handleDismiss}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalBox, { backgroundColor: bgColor }]}> 
                    <Text style={[styles.modalText, { color: textColor }]}>{message}</Text>
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
    },
});

export default RoundModal; 