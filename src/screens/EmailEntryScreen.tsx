import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { sendOtp } from '../supabase/auth';

export default function EmailEntryScreen({ navigation }: any) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setSending(true);
    try {
      await sendOtp(email.trim());
      navigation.navigate('OtpVerify', { email: email.trim() });
    } catch (e: any) {
      setError(e.message ?? 'Could not send the code — try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <Text style={[theme.type.displaySm, { color: theme.colors.textPrimary, marginBottom: theme.spacing.lg }]}>
        Afterlight
      </Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={theme.colors.textTertiary}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        style={[
          theme.type.body,
          styles.input,
          { borderColor: theme.colors.borderHairline, color: theme.colors.textPrimary },
        ]}
      />
      {error && (
        <Text style={[theme.type.caption, { color: theme.colors.accent, marginTop: theme.spacing.sm }]}>
          {error}
        </Text>
      )}
      <Pressable
        onPress={handleContinue}
        disabled={sending}
        style={[styles.button, { backgroundColor: theme.colors.accent, marginTop: theme.spacing.lg }]}
      >
        {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
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
