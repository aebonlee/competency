import { describe, it, expect, vi } from 'vitest';

// Mock Supabase client - supabase.ts reads env vars at module level
vi.stubEnv('VITE_SUPABASE_URL', '');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

// Import after env stub so supabase client is null
const { createPurchase, updatePurchaseStatus } = await import('./supabase');

describe('supabase utilities (Supabase 미설정 시)', () => {
  describe('createPurchase', () => {
    it('should throw error when Supabase is not configured', async () => {
      await expect(
        createPurchase({ user_id: 'user-1', amount: 15000 })
      ).rejects.toThrow('Supabase가 설정되지 않았습니다.');
    });
  });

  describe('updatePurchaseStatus', () => {
    it('should throw error when Supabase is not configured', async () => {
      await expect(
        updatePurchaseStatus('purchase-1', 'paid', 'pay-123')
      ).rejects.toThrow('Supabase가 설정되지 않았습니다.');
    });
  });
});
