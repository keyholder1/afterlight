// Real capture screen — see docs/02-ux-flows-and-wireframes.md § 2 and
// docs/06-technical-architecture.md § Image upload. Serves both free
// uploads and the daily prompt: if today's prompt exists server-side
// (created by supabase/functions/send-daily-prompt) and this device hasn't
// fulfilled it yet, this capture counts as that day's prompt; otherwise it
// falls back to a plain rotating prompt line — which is also exactly the
// correct behavior before fire_at each day, not a degraded state.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as Location from 'expo-location';
import { uuid } from '../lib/uuid';
import { randomPromptLine } from '../lib/promptLines';
import { processCapture } from '../lib/capturePipeline';
import { insertLocalMemory } from '../db/memories';
import { pushUnsynced } from '../sync';
import { getActivePair, Pair } from '../supabase/pairing';
import { fetchTodayPrompt, linkMemoryToPrompt } from '../supabase/dailyPrompts';
import type { LocalPrompt } from '../db/dailyPrompts';

type Stage = 'camera' | 'processing' | 'saved';

export default function CameraScreen({ route, navigation }: any) {
  const { userId, pairId } = route.params ?? {};
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [locationOn, setLocationOn] = useState(false);
  const [stage, setStage] = useState<Stage>('camera');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [promptLine, setPromptLine] = useState(randomPromptLine);
  const [pair, setPair] = useState<Pair | null>(null);
  const [activePrompt, setActivePrompt] = useState<LocalPrompt | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const activePair = await getActivePair(userId);
        if (!activePair) return;
        setPair(activePair);
        const prompt = await fetchTodayPrompt(activePair, userId);
        const now = Date.now();
        const isActiveWindow =
          prompt && new Date(prompt.fire_at).getTime() <= now && now <= new Date(prompt.window_ends_at).getTime();
        if (prompt && isActiveWindow && !prompt.own_memory_id) {
          setActivePrompt(prompt);
          setPromptLine(prompt.prompt_line);
        }
      } catch (err) {
        console.warn('Could not check today’s prompt (offline, or none yet):', err);
      }
    })();
  }, [userId]);

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.prompt}>Afterlight needs your camera.</Text>
        <Pressable onPress={requestPermission} style={styles.shutterRing}>
          <Text style={{ color: '#fff' }}>Allow</Text>
        </Pressable>
      </View>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || !userId || !pairId) return;
    setStage('processing');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo) throw new Error('No photo captured');
      setPreviewUri(photo.uri);

      let locationName: string | null = null;
      let latitude: number | null = null;
      let longitude: number | null = null;
      if (locationOn) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
          const [place] = await Location.reverseGeocodeAsync(pos.coords);
          locationName = place ? [place.name, place.city].filter(Boolean).join(', ') : null;
        }
      }

      const clientId = uuid();
      const processed = await processCapture(photo.uri, clientId);
      const memory = await insertLocalMemory({
        pairId,
        authorId: userId,
        capturedAt: new Date().toISOString(),
        localUri: processed.localUri,
        localThumbUri: processed.localThumbUri,
        width: processed.width,
        height: processed.height,
        blurhash: processed.blurhash,
        locationName,
        latitude,
        longitude,
        isDailyPrompt: !!activePrompt,
        dailyPromptId: activePrompt?.id ?? null,
      });

      setStage('saved');
      pushUnsynced().catch((err) => console.warn('Background sync failed', err));
      if (activePrompt && pair) {
        linkMemoryToPrompt(pair, userId, activePrompt.id, memory.id).catch((err) =>
          console.warn('Could not link capture to today’s prompt', err),
        );
      }
    } catch (err) {
      console.error('Capture failed', err);
      setStage('camera');
    }
  }

  if (stage === 'saved' && previewUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: previewUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.savedOverlay}>
          <Text style={styles.prompt}>Saved — syncing</Text>
          <Pressable onPress={() => navigation.goBack()} style={[styles.shutterRing, { marginTop: 24 }]}>
            <Text style={{ color: '#fff' }}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.prompt}>{promptLine}</Text>
      </View>
      <CameraView ref={cameraRef} style={styles.viewfinder} facing={facing} />
      <View style={styles.controls}>
        <Pressable style={styles.side} onPress={() => setLocationOn((v) => !v)}>
          <Text style={{ color: locationOn ? '#E0805C' : '#fff', fontSize: 11 }}>loc</Text>
        </Pressable>
        <Pressable
          style={styles.shutterRing}
          onPress={handleCapture}
          disabled={stage === 'processing'}
        >
          {stage === 'processing' ? <ActivityIndicator color="#fff" /> : <View style={styles.shutter} />}
        </Pressable>
        <Pressable style={styles.side} onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}>
          <Text style={{ color: '#fff', fontSize: 11 }}>flip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#14120f', alignItems: 'center', justifyContent: 'center' },
  top: { position: 'absolute', top: 22, alignItems: 'center', width: '100%', zIndex: 2 },
  prompt: { fontSize: 19, color: '#fff' },
  viewfinder: { flex: 1, width: '100%' },
  controls: {
    position: 'absolute',
    bottom: 22,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  shutterRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#C15F3C' },
  side: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  savedOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
});
