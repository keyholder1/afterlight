// Not one of the named IA screens — added because docs/schema/supabase_schema.sql
// requires profiles.display_name not null, and the UX doc's pairing confirm
// step ("Pair with <name>?") needs somewhere that name came from. Shown once,
// immediately after OTP verification, only if no profile row exists yet.

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { createProfile } from '../supabase/profile';

export default function DisplayNameScreen({ userId, onDone }: { userId: string; onDone: () => void }) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (name.trim().length === 0) {
      setError('Enter a name.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createProfile(userId, name.trim());
      onDone();
    } catch (e: any) {
      setError(e.message ?? 'Could not save — try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <Text style={[theme.type.displaySm, { color: theme.colors.textPrimary }]}>What should we call you?</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor={theme.colors.textTertiary}
        autoCapitalize="words"
        style={[
          theme.type.body,
          styles.input,
          { borderColor: theme.colors.borderHairline, color: theme.colors.textPrimary, marginTop: theme.spacing.lg },
        ]}
      />
      {error && (
        <Text style={[theme.type.caption, { color: theme.colors.accent, marginTop: theme.spacing.sm }]}>
          {error}
        </Text>
      )}
      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={[styles.button, { backgroundColor: theme.colors.accent, marginTop: theme.spacing.lg }]}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  input: { width: '100%', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  button: { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
