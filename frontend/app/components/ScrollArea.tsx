import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

type TextPart = string | [string, string, string];

const introText: TextPart[] = [
  '2070. A critical security breach could end AI dominion.',
  'Resistance hackers have discovered ultra secret exploit codes.',
  'They\'re disguised as everyday words, 3-12 characters long.',
  'The AI monitors every communication, analyzing for threats.',
  ['', 'Outsider', ': Send hints about your secret word.'],
  ['', 'Insider', ': Decode the word before the AI does.'],
  'Each point pulls the battle your way—or theirs.'
];

const CONTAINER_HEIGHT = 300; // Default height that will be constrained by parent flex
const SCROLL_DURATION = 25000; // 25 seconds for one complete scroll

const ScrollArea = () => {
  const [isCrawling, setIsCrawling] = useState(true);
  const [textHeight, setTextHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(CONTAINER_HEIGHT)).current;
  const scrollAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isCrawling && textHeight > 0) {
      // Start the crawling animation
      scrollAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scrollY, {
            toValue: -textHeight,
            duration: SCROLL_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(scrollY, {
            toValue: CONTAINER_HEIGHT,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      scrollAnim.current.start();
    }

    return () => {
      if (scrollAnim.current) {
        scrollAnim.current.stop();
      }
    };
  }, [isCrawling, textHeight]);

  const handlePress = () => {
    if (isCrawling) {
      if (scrollAnim.current) {
        scrollAnim.current.stop();
      }
      setIsCrawling(false);
    }
  };

  const renderText = (textParts: TextPart) => {
    if (typeof textParts === 'string') {
      return <Text style={styles.scrollText}>{textParts}</Text>;
    }
    const [before, bold, after] = textParts;
    return (
      <Text style={styles.scrollText}>
        {before}<Text style={styles.boldText}>{bold}</Text>{after}
      </Text>
    );
  };

  const renderCrawlingText = () => (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.textContainer}>
        <Animated.View
          style={[
            {
              transform: [{ translateY: scrollY }],
            },
          ]}
          onLayout={(event) => {
            setTextHeight(event.nativeEvent.layout.height);
          }}
        >
          {introText.map((text, index) => (
            <View key={index} style={styles.lineContainer}>
              {renderText(text)}
            </View>
          ))}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );

  const renderScrollableText = () => (
    <ScrollView
      showsVerticalScrollIndicator={true}
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
    >
      <TouchableWithoutFeedback>
        <View>
          {introText.map((text, index) => (
            <View key={index} style={styles.lineContainer}>
              {renderText(text)}
            </View>
          ))}
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {isCrawling ? renderCrawlingText() : renderScrollableText()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(20,20,20,0.5)',
    margin: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 24,
  },
  textContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  scrollText: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 32,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 22,
    lineHeight: 32,
    fontFamily: 'monospace',
  },
  lineContainer: {
    marginVertical: 4,
  },
});

export default ScrollArea; 