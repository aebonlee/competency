/**
 * PortOne V2 Payment Utility
 * KG이니시스 경유 카드결제
 */

const STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID;
const CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY;

/**
 * Request payment via PortOne V2 SDK
 * @param {Object} params
 * @param {string} params.orderId
 * @param {string} params.orderName
 * @param {number} params.totalAmount
 * @param {string} params.payMethod - 'CARD'
 * @param {Object} params.customer - { fullName, email, phoneNumber }
 * @returns {Promise<Object>} Payment result
 */
export const requestPayment = async ({ orderId, orderName, totalAmount, payMethod, customer }) => {
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
      currency: 'CURRENCY_KRW',
      payMethod,
      customer: {
        fullName: customer.fullName,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
      },
    });

    return response;
  } catch (err) {
    console.error('PortOne payment error:', err);
    return {
      code: 'PAYMENT_ERROR',
      message: err.message || '결제 요청에 실패했습니다.'
    };
  }
};
