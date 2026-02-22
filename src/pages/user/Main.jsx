import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getEvaluations, validateCoupon, useCoupon as applyCoupon, createEvaluation } from '../../utils/supabase';
import '../../styles/checkout.css';

const TOOLTIPS = {
  continueTest: '이전에 중단된 검사를 이어서 진행합니다.',
  cardPayment: '카드 결제로 새로운 검사를 시작합니다. (25,000원/회)',
  coupon: '발급받은 쿠폰 코드를 입력하여 무료로 검사를 시작합니다.',
  results: '완료된 검사의 결과를 차트와 함께 확인합니다.',
  history: '지금까지 진행한 모든 검사 내역을 확인합니다.',
  average: '다른 사용자들의 평균 결과와 내 결과를 비교합니다.'
};

const Main = () => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [evals, setEvals] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [tooltip, setTooltip] = useState(null);

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
        await applyCoupon(result.coupon.id, user.id);
        const newEval = await createEvaluation(user.id);
        showToast('쿠폰이 적용되었습니다. 검사를 시작하세요!', 'success');
        navigate(`/evaluation/${newEval.id}`);
      } else {
        showToast(result.message, 'error');
      }
    } catch {
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

      <section className="main-content">
        <div className="container-narrow">
          {/* Active evaluation */}
          {activeEval && (
            <div className="card mb-3 main-active-eval">
              <h3 className="card-title">진행 중인 검사</h3>
              <p className="card-desc">
                {activeEval.times}회차 검사 — 진행률: {activeEval.progress}%
              </p>
              <div className="main-tooltip-wrapper"
                onMouseEnter={() => setTooltip('continueTest')}
                onMouseLeave={() => setTooltip(null)}>
                <button className="btn btn-primary" onClick={handleStartEval}>이어서 검사하기</button>
                {tooltip === 'continueTest' && (
                  <div className="main-tooltip">
                    <div className="main-tooltip-arrow" />
                    {TOOLTIPS.continueTest}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* New assessment */}
          <div className="card mb-3">
            <h3 className="card-title-lg">새 검사 시작</h3>
            <p className="card-desc mb-3">
              MyCoreCompetency 핵심역량 검사 (56쌍 문항, 약 20~30분 소요)
            </p>

            <div className="main-payment-grid">
              <div className="main-tooltip-wrapper"
                onMouseEnter={() => setTooltip('cardPayment')}
                onMouseLeave={() => setTooltip(null)}>
                <div className="card text-center main-payment-card">
                  <h4 className="mb-1">카드 결제</h4>
                  <p className="main-price">25,000원</p>
                  <Link to="/checkout" className="btn btn-primary btn-full">결제 후 검사</Link>
                </div>
                {tooltip === 'cardPayment' && (
                  <div className="main-tooltip">
                    <div className="main-tooltip-arrow" />
                    {TOOLTIPS.cardPayment}
                  </div>
                )}
              </div>
              <div className="main-tooltip-wrapper"
                onMouseEnter={() => setTooltip('coupon')}
                onMouseLeave={() => setTooltip(null)}>
                <div className="card text-center main-payment-card">
                  <h4 className="mb-1">쿠폰 사용</h4>
                  <p className="main-coupon-desc">쿠폰 코드를 입력하세요</p>
                  <div className="coupon-input-row">
                    <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="쿠폰 코드" className="coupon-input" />
                    <button className="btn btn-secondary" onClick={handleCoupon} disabled={couponLoading}>
                      {couponLoading ? '...' : '적용'}
                    </button>
                  </div>
                </div>
                {tooltip === 'coupon' && (
                  <div className="main-tooltip">
                    <div className="main-tooltip-arrow" />
                    {TOOLTIPS.coupon}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Previous results link */}
          <div className="main-links">
            <div className="main-tooltip-wrapper"
              onMouseEnter={() => setTooltip('results')}
              onMouseLeave={() => setTooltip(null)}>
              <Link to="/results" className="btn btn-secondary">검사결과 보기</Link>
              {tooltip === 'results' && (
                <div className="main-tooltip">
                  <div className="main-tooltip-arrow" />
                  {TOOLTIPS.results}
                </div>
              )}
            </div>
            <div className="main-tooltip-wrapper"
              onMouseEnter={() => setTooltip('history')}
              onMouseLeave={() => setTooltip(null)}>
              <Link to="/history" className="btn btn-secondary">검사내역</Link>
              {tooltip === 'history' && (
                <div className="main-tooltip">
                  <div className="main-tooltip-arrow" />
                  {TOOLTIPS.history}
                </div>
              )}
            </div>
            <div className="main-tooltip-wrapper"
              onMouseEnter={() => setTooltip('average')}
              onMouseLeave={() => setTooltip(null)}>
              <Link to="/results/average" className="btn btn-secondary">통계 비교</Link>
              {tooltip === 'average' && (
                <div className="main-tooltip">
                  <div className="main-tooltip-arrow" />
                  {TOOLTIPS.average}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Main;
