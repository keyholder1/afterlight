import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export default function WelcomeScreen({ navigation }: any) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <Text style={[theme.type.displaySm, { color: theme.colors.textPrimary }]}>Afterlight</Text>
      <Pressable
        onPress={() => navigation.navigate('EmailEntry')}
        style={[styles.button, { backgroundColor: theme.colors.accent, marginTop: theme.spacing.xl }]}
      >
        <Text style={styles.buttonText}>Get started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  button: { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
