import { supabase } from './client';

export async function upsertPushToken(userId: string, token: string, platform: 'android' | 'ios' = 'android') {
  const { error } = await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, fcm_token: token, platform }, { onConflict: 'user_id,fcm_token' });
  if (error) throw error;
}
