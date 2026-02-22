import { describe, it, expect } from 'vitest';
import { signOut, getProfile, updateProfile, deleteAccount, signInWithEmail } from './auth';

describe('auth.ts — Supabase 미설정 시 폴백 동작', () => {
  it('signOut: Supabase 미설정 시 에러 없이 반환', async () => {
    await expect(signOut()).resolves.toBeUndefined();
  });

  it('getProfile: Supabase 미설정 시 null 반환', async () => {
    const result = await getProfile('test-user-id');
    expect(result).toBeNull();
  });

  it('updateProfile: Supabase 미설정 시 null 반환', async () => {
    const result = await updateProfile('test-user-id', { name: 'Test' });
    expect(result).toBeNull();
  });

  it('deleteAccount: Supabase 미설정 시 에러 없이 반환', async () => {
    await expect(deleteAccount('test-user-id')).resolves.toBeUndefined();
  });

  it('signInWithEmail: Supabase 미설정 시 에러 throw', async () => {
    await expect(signInWithEmail('test@test.com', 'password'))
      .rejects.toThrow('Supabase not configured');
  });
});
