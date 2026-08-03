import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { verifyOtp } from '../supabase/auth';

export default function OtpVerifyScreen({ route }: any) {
  const theme = useTheme();
  const email: string = route.params.email;
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setError(null);
    setVerifying(true);
    try {
      await verifyOtp(email, code.trim());
      // Success flips the Supabase session; useAppBootstrap picks it up and
      // the root navigator moves on to DisplayName/Pairing/MainTabs on its own.
    } catch (e: any) {
      setError(e.message ?? 'Invalid code — try again.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <Text style={[theme.type.displaySm, { color: theme.colors.textPrimary }]}>Enter your code</Text>
      <Text
        style={[
          theme.type.body,
          { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg },
        ]}
      >
        Sent to {email}
      </Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="000000"
        placeholderTextColor={theme.colors.textTertiary}
        keyboardType="number-pad"
        maxLength={6}
        style={[
          theme.type.displaySm,
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
        onPress={handleVerify}
        disabled={verifying || code.length < 6}
        style={[styles.button, { backgroundColor: theme.colors.accent, marginTop: theme.spacing.lg }]}
      >
        {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
