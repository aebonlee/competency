/**
 * PortOne V1 (iamport) Payment Utility
 * KG이니시스 경유 카드결제
 * www.dreamitbiz.com과 동일한 V1 SDK 사용
 */
import type { PaymentRequest, PaymentResult } from '../types';

const IMP_CODE = import.meta.env.VITE_IMP_CODE;
const PG_PROVIDER = import.meta.env.VITE_PG_PROVIDER;

let initialized = false;

interface IMPResponse {
  success: boolean;
  imp_uid: string;
  merchant_uid: string;
  error_code?: string;
  error_msg?: string;
}

interface IMPInstance {
  init: (code: string) => void;
  request_pay: (params: Record<string, unknown>, callback: (response: IMPResponse) => void) => void;
}

declare global {
  interface Window {
    IMP?: IMPInstance;
  }
}

function getIMP(): IMPInstance | null {
  if (!window.IMP) {
    console.error('iamport SDK not loaded');
    return null;
  }
  if (!initialized && IMP_CODE) {
    window.IMP.init(IMP_CODE);
    initialized = true;
  }
  return window.IMP;
}

/**
 * Request payment via PortOne V1 SDK
 */
export const requestPayment = ({ orderId, orderName, totalAmount, payMethod, customer }: PaymentRequest): Promise<PaymentResult> => {
  return new Promise((resolve) => {
    const IMP = getIMP();

    if (!IMP || !IMP_CODE) {
      console.warn('PortOne credentials not configured. Running in demo mode.');
      resolve({
        paymentId: `demo-pay-${Date.now()}`,
        txId: `demo-tx-${Date.now()}`
      });
      return;
    }

    const payMethodMap: Record<string, string> = { CARD: 'card', TRANSFER: 'trans' };

    IMP.request_pay(
      {
        pg: PG_PROVIDER,
        pay_method: payMethodMap[payMethod] || 'card',
        merchant_uid: `order_${orderId}_${Date.now()}`,
        name: orderName,
        amount: totalAmount,
        buyer_email: customer.email,
        buyer_name: customer.fullName,
        buyer_tel: customer.phoneNumber,
      },
      (response: IMPResponse) => {
        if (response.success) {
          resolve({
            paymentId: response.imp_uid,
            txId: response.merchant_uid,
          });
        } else {
          resolve({
            code: response.error_code || 'PAYMENT_FAILED',
            message: response.error_msg || '결제가 취소되었습니다.',
          });
        }
      }
    );
  });
};
