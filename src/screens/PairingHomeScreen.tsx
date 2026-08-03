// See docs/02-ux-flows-and-wireframes.md § 1. The three modes below
// (generate / enter / confirm) match the wireframe's three screens, folded
// into one component since they're gated by simple linear state, not
// separate navigator routes.

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Share, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../theme';
import { createPairingCode, redeemPairingCode, getActivePair, partnerIdFor } from '../supabase/pairing';
import { getProfile } from '../supabase/profile';
import { formatCodeForDisplay } from '../lib/pairingCode';

type Mode = 'generate' | 'enter' | 'confirm';

export default function PairingHomeScreen({
  userId,
  onPaired,
}: {
  userId: string;
  onPaired: () => void;
}) {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('generate');
  const [myCode, setMyCode] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);

  useEffect(() => {
    createPairingCode(userId)
      .then(({ code }) => setMyCode(code))
      .catch((e) => setError(e.message ?? 'Could not generate a code.'));
  }, [userId]);

  async function handleShare() {
    if (!myCode) return;
    await Share.share({ message: `Pair with me on Afterlight: ${myCode}` });
  }

  async function handleRedeem() {
    setError(null);
    setRedeeming(true);
    try {
      await redeemPairingCode(enteredCode);
      const pair = await getActivePair(userId);
      if (pair) {
        const partner = await getProfile(partnerIdFor(pair, userId));
        setPartnerName(partner?.display_name ?? 'your partner');
      }
      setMode('confirm');
    } catch (e: any) {
      setError(e.message ?? 'Could not redeem that code.');
    } finally {
      setRedeeming(false);
    }
  }

  if (mode === 'confirm') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
        <Text style={[theme.type.displaySm, { color: theme.colors.textPrimary, textAlign: 'center' }]}>
          You&rsquo;re paired with {partnerName}
        </Text>
        <Text
          style={[
            theme.type.body,
            { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, textAlign: 'center' },
          ]}
        >
          This links your memories until you both agree to unlink.
        </Text>
        <Pressable
          onPress={onPaired}
          style={[styles.button, { backgroundColor: theme.colors.accent, marginTop: theme.spacing.xl }]}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  if (mode === 'enter') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
        <Text style={[theme.type.displaySm, { color: theme.colors.textPrimary }]}>Have a code?</Text>
        <TextInput
          value={enteredCode}
          onChangeText={setEnteredCode}
          placeholder="9F K3 X7"
          placeholderTextColor={theme.colors.textTertiary}
          autoCapitalize="characters"
          maxLength={6}
          style={[
            theme.type.displaySm,
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
          onPress={handleRedeem}
          disabled={redeeming || enteredCode.length < 6}
          style={[styles.button, { backgroundColor: theme.colors.accent, marginTop: theme.spacing.lg }]}
        >
          {redeeming ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Pair</Text>}
        </Pressable>
        <Pressable onPress={() => setMode('generate')} style={{ marginTop: theme.spacing.lg }}>
          <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <Text style={[theme.type.caption, { color: theme.colors.textTertiary }]}>Your pairing code</Text>
      {myCode ? (
        <>
          <View
            style={[styles.codeBox, { borderColor: theme.colors.borderHairline, backgroundColor: theme.colors.bgSurface }]}
          >
            <Text
              style={[
                theme.type.displaySm,
                { color: theme.colors.textPrimary, fontFamily: theme.type.printed.fontFamily },
              ]}
            >
              {formatCodeForDisplay(myCode)}
            </Text>
          </View>
          <View style={{ marginTop: theme.spacing.lg, backgroundColor: '#fff', padding: theme.spacing.sm, borderRadius: 12 }}>
            <QRCode value={myCode} size={140} />
          </View>
        </>
      ) : (
        <ActivityIndicator color={theme.colors.accent} style={{ marginVertical: theme.spacing.xl }} />
      )}
      {error && (
        <Text style={[theme.type.caption, { color: theme.colors.accent, marginTop: theme.spacing.sm }]}>
          {error}
        </Text>
      )}
      <Pressable
        onPress={handleShare}
        disabled={!myCode}
        style={[styles.button, { backgroundColor: theme.colors.accent, marginTop: theme.spacing.xl }]}
      >
        <Text style={styles.buttonText}>Share code</Text>
      </Pressable>
      <Pressable onPress={() => setMode('enter')} style={{ marginTop: theme.spacing.lg }}>
        <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>Have a code? Enter it →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  codeBox: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlign: 'center',
  },
  button: { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
