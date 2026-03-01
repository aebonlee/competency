/**
 * auth.ts — Supabase Auth helper functions for MyCoreCompetency
 */
import getSupabase from './supabase';
import type { UserProfile } from '../types';

const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

interface SignUpProfileData {
  name: string;
  gender?: string;
  phone?: string;
  job?: string;
  position?: string | number;
  country?: string;
  age?: string;
  edulevel?: string;
  grp?: string;
  subgrp?: string;
}

/** Google OAuth login */
export async function signInWithGoogle() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: SITE_URL }
  });
  if (error) throw error;
  return data;
}

/** Kakao OAuth login */
export async function signInWithKakao() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'kakao',
    options: { redirectTo: SITE_URL }
  });
  if (error) throw error;
  return data;
}

/** Email/Password login */
export async function signInWithEmail(email: string, password: string) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Email signup with profile data */
export async function signUp(email: string, password: string, profileData: SignUpProfileData) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: profileData.name,
        gender: profileData.gender,
        phone: profileData.phone,
        signup_domain: window.location.hostname,
      }
    }
  });
  if (error) throw error;

  // Create user_profiles entry
  if (data.user) {
    const { error: profileError } = await client
      .from('user_profiles')
      .insert({
        id: data.user.id,
        name: profileData.name,
        gender: profileData.gender,
        phone: profileData.phone,
        email: email,
        job: profileData.job || '',
        position: profileData.position || 0,
        country: profileData.country || '',
        age: profileData.age || '',
        edulevel: profileData.edulevel || '',
        usertype: 0,
        grp: profileData.grp || '',
        subgrp: profileData.subgrp || '',
        signup_domain: window.location.hostname,
      });
    if (profileError) console.error('Profile creation error:', profileError);
  }

  return data;
}

/** Sign out */
export async function signOut(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

/** Get profile */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('getProfile error:', error);
    return null;
  }
  return data as UserProfile;
}

/** Reset password email */
export async function resetPassword(email: string) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');
  const { data, error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: SITE_URL + '/login'
  });
  if (error) throw error;
  return data;
}

/** Update profile */
export async function updateProfile(userId: string, updates: Record<string, unknown>): Promise<UserProfile | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as UserProfile;
}

/** Delete account */
export async function deleteAccount(userId: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  // Soft delete: mark user_profiles as deleted
  const { error } = await client
    .from('user_profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;

  // Sign out
  await signOut();
}
