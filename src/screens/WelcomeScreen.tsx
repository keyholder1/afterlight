// Placeholder — real content (sign-in, OTP) lands in Phase 1 (Auth & pairing).
// This file exists now only to prove AuthStack is reachable in the navigator.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export default function WelcomeScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <Text style={[theme.type.displaySm, { color: theme.colors.textPrimary }]}>Afterlight</Text>
      <Text style={[theme.type.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm }]}>
        Welcome — sign-in comes in Phase 1.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
