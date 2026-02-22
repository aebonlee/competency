import { describe, it, expect } from 'vitest';
import type {
  UserProfile,
  EvalItem,
  EvalResult,
  Purchase,
  Coupon,
  CompetencyArea,
  PaymentRequest,
  PaymentResult,
} from './index';

describe('Type definitions', () => {
  it('should allow valid UserProfile', () => {
    const profile: UserProfile = {
      id: '1',
      email: 'test@test.com',
      name: 'Test User',
      usertype: 0,
      created_at: '2025-01-01',
    };
    expect(profile.id).toBe('1');
    expect(profile.usertype).toBe(0);
  });

  it('should allow valid EvalItem', () => {
    const item: EvalItem = {
      id: '1',
      user_id: 'user-1',
      times: 1,
      progress: 50,
      created_at: '2025-01-01',
    };
    expect(item.progress).toBe(50);
  });

  it('should allow valid EvalResult with 8 points', () => {
    const result: EvalResult = {
      id: '1',
      eval_id: 'eval-1',
      point1: 100, point2: 90, point3: 80, point4: 70,
      point5: 60, point6: 50, point7: 40, point8: 30,
    };
    expect(result.point1 + result.point8).toBe(130);
  });

  it('should allow valid Purchase with status types', () => {
    const statuses: Purchase['status'][] = ['pending', 'paid', 'failed', 'refunded'];
    expect(statuses).toHaveLength(4);
  });

  it('should constrain CompetencyArea to 1-8', () => {
    const areas: CompetencyArea[] = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(areas).toHaveLength(8);
  });

  it('should allow valid PaymentRequest', () => {
    const req: PaymentRequest = {
      orderId: 'ord-1',
      orderName: 'Eval',
      totalAmount: 15000,
      payMethod: 'CARD',
      customer: { fullName: 'Kim', email: 'a@b.com', phoneNumber: '010' },
    };
    expect(req.totalAmount).toBe(15000);
  });
});
