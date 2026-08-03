// Push registration — see docs/06-technical-architecture.md § Notifications.
// Rides on Expo's push service, which relays through FCM on Android under
// the hood (see docs/06 § stack) — this is the client half; the sends
// themselves are server-side (supabase/functions/send-daily-prompt,
// send-anniversary), plus a database trigger for partner-captured.
//
// getExpoPushTokenAsync() needs an EAS project id, which doesn't exist
// until an Expo account is set up (see the Phase 0 plan) — this fails soft
// until then, same as every other not-yet-deployed piece of the backend.

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { upsertPushToken } from '../supabase/pushTokens';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(userId: string): Promise<void> {
  if (!Device.isDevice) return; // simulators/emulators can't receive real push

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Afterlight',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('No EAS project id configured yet — skipping push token registration.');
    return;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await upsertPushToken(userId, token, Platform.OS === 'ios' ? 'ios' : 'android');
  } catch (err) {
    console.warn('Push token registration failed:', err);
  }
}

// Routes match docs/02-ux-flows-and-wireframes.md § 6's notification table.
export type NotificationDeepLink =
  | { screen: 'CameraModal'; params?: { userId: string; pairId: string } }
  | { screen: 'StoryPlaybackModal'; params: { day: string; userId: string; pairId: string } };

export function parseDeepLink(data: Record<string, unknown>): NotificationDeepLink | null {
  if (data.screen === 'CameraModal') {
    return { screen: 'CameraModal', params: data.params as any };
  }
  if (data.screen === 'StoryPlaybackModal' && data.params) {
    return { screen: 'StoryPlaybackModal', params: data.params as any };
  }
  return null;
}
