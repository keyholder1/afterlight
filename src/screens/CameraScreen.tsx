// Placeholder — real expo-camera capture, compression, and local-first write
// land in Phase 2. See docs/02-ux-flows-and-wireframes.md § 2.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CameraScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>Capture</Text>
      <Text style={styles.sub}>Real camera comes in Phase 2.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#14120f' },
  prompt: { fontSize: 19, color: '#fff' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
});
