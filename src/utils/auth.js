/**
 * auth.js — Supabase Auth helper functions for MyCoreCompetency
 */
import getSupabase from './supabase';

/** Google OAuth login */
export async function signInWithGoogle() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname }
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
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error) throw error;
  return data;
}

/** Email/Password login */
export async function signInWithEmail(email, password) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Email signup with profile data */
export async function signUp(email, password, profileData) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: profileData.name,
        gender: profileData.gender,
        phone: profileData.phone
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
        subgrp: profileData.subgrp || ''
      });
    if (profileError) console.error('Profile creation error:', profileError);
  }

  return data;
}

/** Sign out */
export async function signOut() {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

/** Get profile */
export async function getProfile(userId) {
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
  return data;
}

/** Reset password email */
export async function resetPassword(email) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');
  const { data, error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/login'
  });
  if (error) throw error;
  return data;
}

/** Update profile */
export async function updateProfile(userId, updates) {
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Delete account */
export async function deleteAccount(userId) {
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
