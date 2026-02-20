import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getEvaluations, validateCoupon, useCoupon, createEvaluation } from '../../utils/supabase';
import '../../styles/checkout.css';

const Main = () => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (user) {
      getEvaluations(user.id).then(data => {
        setEvals(data);
        setLoading(false);
      });
    }
  }, [user]);

  const activeEval = evals.find(e => e.progress < 100);

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const result = await validateCoupon(couponCode);
      if (result.valid) {
        await useCoupon(result.coupon.id, user.id);
        const newEval = await createEvaluation(user.id);
        showToast('쿠폰이 적용되었습니다. 검사를 시작하세요!', 'success');
        navigate(`/evaluation/${newEval.id}`);
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast('쿠폰 적용에 실패했습니다.', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleStartEval = () => {
    if (activeEval) {
      navigate(`/evaluation/${activeEval.id}`);
    }
  };

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container">
          <h1>핵심역량 검사</h1>
          <p>{profile?.name || '회원'}님, 환영합니다!</p>
        </div>
      </section>

      <section style={{ padding: '40px 20px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          {/* Active evaluation */}
          {activeEval && (
            <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #22c55e' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>진행 중인 검사</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                {activeEval.times}회차 검사 — 진행률: {activeEval.progress}%
              </p>
              <button className="btn btn-primary" onClick={handleStartEval}>이어서 검사하기</button>
            </div>
          )}

          {/* New assessment */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>새 검사 시작</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              MyCoreCompetency 핵심역량 검사 (56쌍 문항, 약 20~30분 소요)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card" style={{ textAlign: 'center', padding: 24 }}>
                <h4 style={{ marginBottom: 8 }}>카드 결제</h4>
                <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary-blue)', marginBottom: 16 }}>25,000원</p>
                <Link to="/checkout" className="btn btn-primary btn-full">결제 후 검사</Link>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: 24 }}>
                <h4 style={{ marginBottom: 8 }}>쿠폰 사용</h4>
                <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 16 }}>쿠폰 코드를 입력하세요</p>
                <div className="coupon-input-row">
                  <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="쿠폰 코드" style={{ padding: '10px 14px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', fontSize: 14 }} />
                  <button className="btn btn-secondary" onClick={handleCoupon} disabled={couponLoading}>
                    {couponLoading ? '...' : '적용'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Previous results link */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/results" className="btn btn-secondary">검사결과 보기</Link>
            <Link to="/history" className="btn btn-secondary">검사내역</Link>
            <Link to="/results/average" className="btn btn-secondary">통계 비교</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Main;
