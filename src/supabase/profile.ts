// Profile access — see docs/schema/supabase_schema.sql § profiles.

import { supabase } from './client';

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProfile(userId: string, displayName: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, display_name: displayName })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}
