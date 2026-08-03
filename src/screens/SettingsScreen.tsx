// See docs/02-ux-flows-and-wireframes.md § 1 (unlink) and
// docs/03-information-architecture.md (reached via long-press on the Home
// season header, not a tab).

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import {
  getActivePair,
  requestUnlink,
  cancelUnlink,
  unlinkFinalizesAt,
  Pair,
} from '../supabase/pairing';
import { signOut } from '../supabase/auth';

export default function SettingsScreen({ route, navigation }: any) {
  const theme = useTheme();
  const { userId, partnerName }: { userId: string; partnerName: string | null } = route.params;
  const [pair, setPair] = useState<Pair | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    getActivePair(userId).then(setPair);
  }, [userId]);

  const finalizesAt = pair ? unlinkFinalizesAt(pair) : null;

  async function handleRequestUnlink() {
    if (!pair) return;
    await requestUnlink(pair.id, userId);
    setPair(await getActivePair(userId));
    setConfirming(false);
  }

  async function handleCancelUnlink() {
    if (!pair) return;
    await cancelUnlink(pair.id);
    setPair(await getActivePair(userId));
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgCanvas }]}>
      <Text style={[theme.type.displaySm, { color: theme.colors.textPrimary }]}>Settings</Text>

      {partnerName && (
        <Text style={[theme.type.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>
          Paired with {partnerName}
        </Text>
      )}

      {finalizesAt && (
        <View
          style={[
            styles.banner,
            { backgroundColor: theme.colors.accentMuted, marginTop: theme.spacing.lg },
          ]}
        >
          <Text style={[theme.type.caption, { color: theme.colors.textPrimary }]}>
            Unlinking on {finalizesAt.toLocaleString()}
          </Text>
          <Pressable onPress={handleCancelUnlink}>
            <Text style={[theme.type.caption, { color: theme.colors.accent, fontWeight: '600' }]}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {!finalizesAt && !confirming && (
        <Pressable onPress={() => setConfirming(true)} style={{ marginTop: theme.spacing.xxl }}>
          <Text style={[theme.type.caption, { color: theme.colors.accent }]}>Unlink from {partnerName}</Text>
        </Pressable>
      )}

      {!finalizesAt && confirming && (
        <View style={{ marginTop: theme.spacing.lg, width: '100%' }}>
          <Text style={[theme.type.body, { color: theme.colors.textSecondary }]}>
            Type &ldquo;{partnerName}&rdquo; to confirm.
          </Text>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            style={[
              theme.type.body,
              styles.input,
              { borderColor: theme.colors.borderHairline, color: theme.colors.textPrimary, marginTop: theme.spacing.sm },
            ]}
          />
          <Pressable
            onPress={handleRequestUnlink}
            disabled={confirmText.trim() !== partnerName}
            style={[styles.button, { backgroundColor: theme.colors.accent, marginTop: theme.spacing.md }]}
          >
            <Text style={styles.buttonText}>Start 24h unlink</Text>
          </Pressable>
        </View>
      )}

      <Pressable onPress={() => signOut()} style={{ marginTop: theme.spacing.xxxl }}>
        <Text style={[theme.type.caption, { color: theme.colors.textTertiary }]}>Sign out</Text>
      </Pressable>

      <Pressable onPress={() => navigation.goBack()} style={{ marginTop: theme.spacing.lg }}>
        <Text style={[theme.type.caption, { color: theme.colors.textSecondary }]}>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  banner: {
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: { width: '100%', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  button: { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
