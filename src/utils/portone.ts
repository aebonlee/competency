/**
 * PortOne V2 Payment Utility
 * KG이니시스 경유 카드결제
 */
import type { PaymentRequest, PaymentResult } from '../types';

const STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID;
const CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY;

/**
 * Request payment via PortOne V2 SDK
 */
export const requestPayment = async ({ orderId, orderName, totalAmount, payMethod, customer }: PaymentRequest): Promise<PaymentResult> => {
  if (!STORE_ID || !CHANNEL_KEY) {
    console.warn('PortOne credentials not configured. Running in demo mode.');
    return {
      paymentId: `demo-pay-${Date.now()}`,
      txId: `demo-tx-${Date.now()}`
    };
  }

  try {
    const PortOne = await import('@portone/browser-sdk/v2');

    const response = await PortOne.requestPayment({
      storeId: STORE_ID,
      channelKey: CHANNEL_KEY,
      paymentId: `payment-${orderId}-${Date.now()}`,
      orderName,
      totalAmount,
      currency: 'KRW',
      payMethod: payMethod as "CARD" | "TRANSFER" | "VIRTUAL_ACCOUNT" | "MOBILE" | "GIFT_CERTIFICATE" | "EASY_PAY",
      customer: {
        fullName: customer.fullName,
        email: customer.email,
        phoneNumber: customer.phoneNumber?.replace(/-/g, ''),
      },
    });

    return response as PaymentResult;
  } catch (err) {
    const error = err as Error;
    console.error('PortOne payment error:', error);
    return {
      code: 'PAYMENT_ERROR',
      message: error.message || '결제 요청에 실패했습니다.'
    };
  }
};
