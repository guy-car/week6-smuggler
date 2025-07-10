import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const introText = `2070. A critical security breach could end AI dominion.
Resistance hackers have discovered ultra secret exploit codes.
They're disguised as everyday words, 3-12 characters long.
The AI monitors every communication, analyzing for threats.
Outsider: Send hints about your secret word.
Insider: Decode the word before the AI does.
Each point pulls the battle your way—or theirs.
Reach 5 points ahead to upload the exploit and free humanity.`;

const lines = introText.split('\n');

const FADE_DURATION = 600; // ms
const DISPLAY_DURATION = 2500; // ms

const ScrollArea = () => {
  const [currentLine, setCurrentLine] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const animateLine = (index: number) => {
      if (!isMounted) return;

      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        // Wait
        setTimeout(() => {
          // Fade out
          Animated.timing(opacity, {
            toValue: 0,
            duration: FADE_DURATION,
            useNativeDriver: true,
          }).start(() => {
            // Next line
            if (isMounted) {
              setCurrentLine((prev) => (prev + 1 < lines.length ? prev + 1 : 0));
            }
          });
        }, DISPLAY_DURATION);
      });
    };

    opacity.setValue(0);
    animateLine(currentLine);

    return () => {
      isMounted = false;
      opacity.stopAnimation();
    };
    // Only re-run when currentLine changes
  }, [currentLine]);

  return (
    <View style={styles.scrollAreaContainer} pointerEvents="box-none">
        <View style={styles.slideContent}>
          <Animated.Text style={[styles.scrollText, { opacity }]}> 
            {lines[currentLine].trim() === '' ? '\u00A0' : lines[currentLine]}
          </Animated.Text>
        </View>
  
    </View>
  );
};

const styles = StyleSheet.create({
  scrollAreaContainer: {
    position: 'absolute',
    top: 400,
    left: 20,
    right: 20,
    zIndex: 10,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(20,20,20,0.5)',
  },
  blurBg: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80,
    minWidth: '100%',
    padding: 24,
  },
  scrollText: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 32,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});

export default ScrollArea; 