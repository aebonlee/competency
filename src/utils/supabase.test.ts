import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client - supabase.ts reads env vars at module level
vi.stubEnv('VITE_SUPABASE_URL', '');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

// Import after env stub so supabase client is null (localStorage fallback mode)
const { createPurchase, updatePurchaseStatus } = await import('./supabase');

describe('supabase utilities (localStorage fallback)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('createPurchase', () => {
    it('should create a purchase in localStorage when Supabase is not configured', async () => {
      const purchase = await createPurchase({ user_id: 'user-1', amount: 15000 });

      expect(purchase).toBeDefined();
      expect(purchase.id).toBeDefined();
      expect(purchase.user_id).toBe('user-1');
      expect(purchase.amount).toBe(15000);
      expect(purchase.status).toBe('pending');
      expect(purchase.created_at).toBeDefined();

      // Verify localStorage
      const stored = JSON.parse(localStorage.getItem('mcc_purchases') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(purchase.id);
    });

    it('should append to existing purchases', async () => {
      await createPurchase({ user_id: 'user-1', amount: 15000 });
      await createPurchase({ user_id: 'user-2', amount: 30000 });

      const stored = JSON.parse(localStorage.getItem('mcc_purchases') || '[]');
      expect(stored).toHaveLength(2);
    });
  });

  describe('updatePurchaseStatus', () => {
    it('should update purchase status in localStorage', async () => {
      const purchase = await createPurchase({ user_id: 'user-1', amount: 15000 });
      const updated = await updatePurchaseStatus(purchase.id, 'paid', 'pay-123');

      expect(updated).toBeDefined();
      expect(updated!.status).toBe('paid');
      expect(updated!.payment_id).toBe('pay-123');
      expect(updated!.paid_at).toBeDefined();
    });

    it('should handle non-existent purchase gracefully', async () => {
      const result = await updatePurchaseStatus('non-existent', 'paid');
      expect(result).toBeUndefined();
    });
  });
});
