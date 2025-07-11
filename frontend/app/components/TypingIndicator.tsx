import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface TypingIndicatorProps {
    role: 'encoder' | 'decoder';
    isVisible: boolean;
}

const DOTS = ['.', '..', '...'];
const DOT_INTERVAL = 500;
const FADE_DURATION = 200;

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ role, isVisible }) => {
    const [dotIndex, setDotIndex] = useState(0);
    const [shouldRender, setShouldRender] = useState(isVisible);
    const intervalRef = useRef<any>(null);
    const fadeAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;

    useEffect(() => {
        if (isVisible) {
            // Show the component and fade in
            setShouldRender(true);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: FADE_DURATION,
                useNativeDriver: true,
            }).start();
        } else {
            // Fade out and then unmount
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: FADE_DURATION,
                useNativeDriver: true,
            }).start(() => {
                setShouldRender(false);
            });
        }
    }, [isVisible, fadeAnim]);

    useEffect(() => {
        if (shouldRender) {
            // Start dot animation
            intervalRef.current = setInterval(() => {
                setDotIndex((prev) => (prev + 1) % DOTS.length);
            }, DOT_INTERVAL);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [shouldRender]);

    if (!shouldRender) {
        return null;
    }

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Text style={styles.text}>
                {role === 'encoder' ? 'Encoder' : 'Decoder'} is typing{DOTS[dotIndex]}
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 30, // Fixed height to prevent layout shifts
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingHorizontal: 12,
        marginVertical: 6,
    },
    text: {
        fontSize: 16,
        color: '#FFD600',
        fontStyle: 'italic',
        fontFamily: 'Audiowide',
        opacity: 0.85,
    },
});

export default TypingIndicator; 