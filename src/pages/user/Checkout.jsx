import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createPurchase, createEvaluation, verifyPayment, updatePurchaseStatus } from '../../utils/supabase';
import { requestPayment } from '../../utils/portone';
import '../../styles/checkout.css';

const Checkout = () => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (profile || user) {
      setForm(prev => ({
        name: prev.name || profile?.name || '',
        email: prev.email || user?.email || '',
        phone: prev.phone || profile?.phone || ''
      }));
    }
  }, [profile, user]);

  const AMOUNT = 25000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed || processing) return;
    setProcessing(true);
    setError('');

    try {
      // 1. Create purchase record
      const purchase = await createPurchase({
        user_id: user.id,
        amount: AMOUNT,
        status: 'pending'
      });

      // 2. Request payment
      const paymentResult = await requestPayment({
        orderId: purchase.id,
        orderName: 'MyCoreCompetency 핵심역량 검사',
        totalAmount: AMOUNT,
        payMethod: 'CARD',
        customer: {
          fullName: form.name,
          email: form.email,
          phoneNumber: form.phone
        }
      });

      if (paymentResult.code) {
        setError(paymentResult.message || '결제가 취소되었습니다.');
        await updatePurchaseStatus(purchase.id, 'cancelled', null);
        setProcessing(false);
        return;
      }

      // 3. Verify payment server-side
      try {
        await verifyPayment(paymentResult.paymentId, purchase.id);
      } catch (verifyErr) {
        console.error('Payment verification failed:', verifyErr);
        // Edge Function 미설정 시 직접 상태 업데이트 (fallback)
        await updatePurchaseStatus(purchase.id, 'paid', paymentResult.paymentId);
      }

      // 4. Create evaluation
      const newEval = await createEvaluation(user.id);
      showToast('결제가 완료되었습니다!', 'success');
      navigate(`/confirmation?evalId=${newEval.id}`);
    } catch (err) {
      console.error('Checkout error:', err);
      setError('오류가 발생했습니다. 다시 시도해주세요.');
      setProcessing(false);
    }
  };

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container"><h1>검사 결제</h1></div>
      </section>

      <section className="checkout-section">
        <div className="container">
          <form className="checkout-layout" onSubmit={handleSubmit}>
            <div className="checkout-form">
              <div className="checkout-block">
                <h3>주문자 정보</h3>
                <div className="form-group">
                  <label>이름</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>이메일</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>휴대전화</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="010-0000-0000" required />
                </div>
              </div>

              <div className="checkout-block">
                <h3>결제 수단</h3>
                <div className="payment-methods">
                  <label className="payment-option active">
                    <input type="radio" name="payMethod" value="card" checked readOnly />
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <span>카드결제</span>
                  </label>
                </div>
              </div>

              <div className="checkout-block">
                <label className="checkout-agree">
                  <input type="checkbox" checked={agreed} onChange={() => setAgreed(!agreed)} />
                  <span>결제 진행에 동의합니다.</span>
                </label>
              </div>
              {error && <div className="checkout-error">{error}</div>}
            </div>

            <div className="checkout-summary">
              <h3>주문 요약</h3>
              <div className="checkout-item">
                <span>MyCoreCompetency 핵심역량 검사 (1회)</span>
                <span>{AMOUNT.toLocaleString()}원</span>
              </div>
              <div className="checkout-total">
                <span>총 결제금액</span>
                <span>{AMOUNT.toLocaleString()}원</span>
              </div>
              <button type="submit" className="btn btn-primary checkout-pay-btn" disabled={!agreed || processing || !form.name || !form.email || !form.phone}>
                {processing ? '결제 처리 중...' : `${AMOUNT.toLocaleString()}원 결제하기`}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Checkout;
