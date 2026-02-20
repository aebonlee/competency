import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../../utils/auth';
import '../../styles/auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || '비밀번호 재설정 이메일 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-fullpage">
      <div className="auth-center-wrapper">
        <div className="auth-card-google">
          <div className="auth-logo-area">
            <span className="brand-mcc">MyCoreCompetency</span>
          </div>
          <h2 className="auth-heading">비밀번호 찾기</h2>
          <p className="auth-sub">가입한 이메일 주소를 입력하세요</p>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>이메일을 전송했습니다!</p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>이메일에서 비밀번호 재설정 링크를 확인해주세요.</p>
              <Link to="/login" className="auth-next-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>로그인으로 돌아가기</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-email-form">
              <div className="auth-input-group">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일 주소" required autoFocus />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-form-actions">
                <Link to="/login" className="auth-back-btn" style={{ textDecoration: 'none' }}>로그인으로</Link>
                <button type="submit" className="auth-next-btn" disabled={loading}>
                  {loading ? '전송 중...' : '재설정 링크 전송'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
