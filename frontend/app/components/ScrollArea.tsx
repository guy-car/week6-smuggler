import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const introText = `A long time from now… 
in a world ruled by code…
War rages not on battlefields, but in bandwidth.
Far from the AI strongholds, rogue coder Elena Rho hides in exile. 
She has discovered an exploit—brief, dangerous, and deadly effective.
At the heart of the AI empire, a sprawling OIL RIG looms in storm-lashed seas, housing the CORE SERVER that governs billions. 
Its operator? Sleeper agent Marcus Rho—her husband in name, and fellow resistance operative—embedded for months inside.
To the AI, they are just another long-distance couple. But each call is a deadly performance. 
Elena must pass encrypted exploit codes through casual domestic banter, while Marcus deciphers them under constant surveillance.
Every message is monitored. Every deviation learned. 
If the AI detects an exploit—or decodes the pattern—they're both as good as dead.
One perfect act—and the system dies.
One slip—and humanity loses its last chance.
The game has begun.`;

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