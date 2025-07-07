import { StyleSheet, Text, View } from 'react-native';

export default function EncrypterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Encrypter</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
}); 