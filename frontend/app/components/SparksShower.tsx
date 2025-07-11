import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

const NUM_SPARKS = 18;
const SCREEN_HEIGHT = Dimensions.get('window').height +100;

const SparksShower = () => {
  // Create refs for each spark's animation
  const sparks = Array.from({ length: NUM_SPARKS }).map(() => {
    const leftPercent = Math.random() * 90;
    return {
      anim: useRef(new Animated.Value(0)).current,
      left: `${leftPercent}%` as `${number}%`,
      color: Math.random() > 0.5 ? '#FFD600' : '#FF3B30',
      delay: Math.random() * 1000,
      size: Math.random() * 4 + 2,
      xJitter1: (Math.random() - 0.5) * 30,
      xJitter2: (Math.random() - 0.5) * 60,
      rotate: `${Math.random() * 30 - 15}deg`,
    };
  });

  useEffect(() => {
    sparks.forEach(({ anim, delay }) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 1200 + Math.random() * 800,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {sparks.map((spark, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: spark.left,
            width: spark.size,
            height: spark.size * 4,
            borderRadius: spark.size / 2,
            backgroundColor: spark.color,
            opacity: spark.anim.interpolate({
              inputRange: [0, 0.8, 1],
              outputRange: [0, 1, 0],
            }),
            transform: [
              {
                translateY: spark.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN_HEIGHT * 0.8],
                }),
              },
              {
                translateX: spark.anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, spark.xJitter1, spark.xJitter2],
                }),
              },
              {
                rotate: spark.rotate,
              },
            ],
          }}
        />
      ))}
    </>
  );
};

export default SparksShower; 