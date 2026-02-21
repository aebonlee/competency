import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signInWithGoogle, signInWithKakao, signInWithEmail } from '../../utils/auth';
import '../../styles/auth.css';

const TOOLTIPS = {
  google: '구글 계정으로 간편하게 로그인합니다. 별도 회원가입 없이 바로 이용 가능합니다.',
  kakao: '카카오 계정으로 간편하게 로그인합니다. 별도 회원가입 없이 바로 이용 가능합니다.',
  email: '이메일과 비밀번호로 로그인합니다. 회원가입 시 등록한 이메일을 사용하세요.'
};

const Login = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/main';

  const [step, setStep] = useState('method');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (isLoggedIn) navigate(from, { replace: true });
  }, [isLoggedIn, from, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setError('');
    try {
      if (provider === 'google') await signInWithGoogle();
      else if (provider === 'kakao') await signInWithKakao();
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
    }
  };

  if (isLoggedIn) return null;

  return (
    <section className="auth-fullpage">
      <div className="auth-center-wrapper">
        <div className="auth-card-google">
          <div className="auth-logo-area">
            <span className="brand-mcc">MyCoreCompetency</span>
            <span className="brand-mcc-sub">4차산업혁명 핵심역량 검사</span>
          </div>
          <h2 className="auth-heading">로그인</h2>
          <p className="auth-sub">계정에 로그인하세요</p>

          {step === 'method' ? (
            <>
              <div className="auth-methods">
                <div className="auth-method-wrapper"
                  onMouseEnter={() => setTooltip('google')}
                  onMouseLeave={() => setTooltip(null)}>
                  <button className="auth-method-btn google" onClick={() => handleSocialLogin('google')}>
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Google 로그인</span>
                  </button>
                  {tooltip === 'google' && (
                    <div className="auth-tooltip">
                      <div className="auth-tooltip-arrow" />
                      {TOOLTIPS.google}
                    </div>
                  )}
                </div>
                <div className="auth-method-wrapper"
                  onMouseEnter={() => setTooltip('kakao')}
                  onMouseLeave={() => setTooltip(null)}>
                  <button className="auth-method-btn kakao" onClick={() => handleSocialLogin('kakao')}>
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.8 5.22 4.52 6.6-.2.74-.72 2.68-.82 3.1-.13.5.18.49.38.36.16-.1 2.5-1.7 3.5-2.4.78.12 1.58.18 2.42.18 5.52 0 10-3.58 10-7.9S17.52 3 12 3z" fill="#3C1E1E"/>
                    </svg>
                    <span>Kakao 로그인</span>
                  </button>
                  {tooltip === 'kakao' && (
                    <div className="auth-tooltip">
                      <div className="auth-tooltip-arrow" />
                      {TOOLTIPS.kakao}
                    </div>
                  )}
                </div>
                <div className="auth-method-wrapper"
                  onMouseEnter={() => setTooltip('email')}
                  onMouseLeave={() => setTooltip(null)}>
                  <button className="auth-method-btn email" onClick={() => setStep('email')}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    <span>이메일 로그인</span>
                  </button>
                  {tooltip === 'email' && (
                    <div className="auth-tooltip">
                      <div className="auth-tooltip-arrow" />
                      {TOOLTIPS.email}
                    </div>
                  )}
                </div>
              </div>
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-bottom-link">
                <span>계정이 없으신가요?</span>
                <Link to="/register">회원가입</Link>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleEmailLogin} className="auth-email-form">
                <div className="auth-input-group">
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="이메일 주소" required autoFocus />
                </div>
                <div className="auth-input-group">
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="비밀번호" required />
                </div>
                {error && <div className="auth-error">{error}</div>}
                <div className="auth-form-actions">
                  <button type="button" className="auth-back-btn" onClick={() => { setStep('method'); setError(''); }}>뒤로</button>
                  <button type="submit" className="auth-next-btn" disabled={loading}>
                    {loading ? '로그인 중...' : '로그인'}
                  </button>
                </div>
              </form>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--text-light)' }}>비밀번호를 잊으셨나요?</Link>
              </div>
              <div className="auth-bottom-link">
                <span>계정이 없으신가요?</span>
                <Link to="/register">회원가입</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Login;
