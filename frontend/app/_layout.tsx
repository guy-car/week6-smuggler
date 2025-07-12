import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import './global.css';

const useFonts = (fontMap: Record<string, number>) => {
  const [loaded, setLoaded] = React.useState(false);
  useEffect(() => {
    (async () => {
      await SplashScreen.preventAutoHideAsync();
      await Font.loadAsync(fontMap);
      setLoaded(true);
      await SplashScreen.hideAsync();
    })();
  }, []);
  return loaded;
};

export default function RootLayout() {
  const fontsLoaded = useFonts({
    'Audiowide': require('../assets/fonts/Audiowide-Regular.ttf'),
    'VT323': require('../assets/fonts/VT323-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', // fallback for video load
  },
});