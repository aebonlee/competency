import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import usePageTitle from '../../utils/usePageTitle';
import { signUp } from '../../utils/auth';
import { POSITION_LIST, AGE_LIST, EDUCATION_LIST, REGION_LIST } from '../../data/competencyInfo';
import '../../styles/auth.css';

const Register = () => {
  usePageTitle('회원가입');
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '', password: '', passwordConfirm: '',
    name: '', gender: 'M', phone: '',
    age: '', edulevel: '', position: 0,
    job: '', country: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate('/main', { replace: true });
  }, [isLoggedIn, navigate]);

  if (isLoggedIn) return null;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (!form.name) {
      setError('이름을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp(form.email, form.password, {
        name: form.name,
        gender: form.gender,
        phone: form.phone,
        age: form.age,
        edulevel: form.edulevel,
        position: parseInt(form.position) || 0,
        job: form.job,
        country: form.country
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="auth-fullpage">
        <div className="auth-center-wrapper">
          <div className="auth-card-google">
            <div className="auth-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <h2>회원가입 완료!</h2>
              <p>이메일을 확인하여 계정을 인증해주세요.</p>
              <Link to="/login" className="auth-next-btn auth-btn-full">로그인하기</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-fullpage">
      <div className="auth-center-wrapper" style={{ maxWidth: '480px' }}>
        <div className="auth-card-google">
          <div className="auth-logo-area">
            <span className="brand-mcc">MyCoreCompetency</span>
          </div>
          <h2 className="auth-heading">회원가입</h2>
          <p className="auth-sub">핵심역량 검사를 위한 계정을 만드세요</p>

          <form onSubmit={handleSubmit} className="auth-email-form">
            <div className="auth-input-group">
              <label>이름 *</label>
              <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="이름" required autoFocus />
            </div>

            <div className="auth-input-group">
              <label>이메일 *</label>
              <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="이메일 주소" required />
            </div>

            <div className="auth-input-row">
              <div className="auth-input-group">
                <label>비밀번호 *</label>
                <input type="password" value={form.password} onChange={e => handleChange('password', e.target.value)} placeholder="6자 이상" minLength={6} required />
              </div>
              <div className="auth-input-group">
                <label>비밀번호 확인 *</label>
                <input type="password" value={form.passwordConfirm} onChange={e => handleChange('passwordConfirm', e.target.value)} placeholder="비밀번호 확인" required />
              </div>
            </div>

            <div className="auth-input-row">
              <div className="auth-input-group">
                <label>성별</label>
                <select value={form.gender} onChange={e => handleChange('gender', e.target.value)}>
                  <option value="M">남성</option>
                  <option value="F">여성</option>
                </select>
              </div>
              <div className="auth-input-group">
                <label>나이대</label>
                <select value={form.age} onChange={e => handleChange('age', e.target.value)}>
                  <option value="">선택</option>
                  {AGE_LIST.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                </select>
              </div>
            </div>

            <div className="auth-input-row">
              <div className="auth-input-group">
                <label>학력</label>
                <select value={form.edulevel} onChange={e => handleChange('edulevel', e.target.value)}>
                  <option value="">선택</option>
                  {EDUCATION_LIST.map(e => <option key={e.code} value={e.code}>{e.name}</option>)}
                </select>
              </div>
              <div className="auth-input-group">
                <label>시/도</label>
                <select value={form.country} onChange={e => handleChange('country', e.target.value)}>
                  <option value="">선택</option>
                  {REGION_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="auth-input-group">
              <label>직무</label>
              <select value={form.position} onChange={e => handleChange('position', e.target.value)}>
                <option value={0}>선택</option>
                {POSITION_LIST.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </div>

            <div className="auth-input-row">
              <div className="auth-input-group">
                <label>직업/직책</label>
                <input type="text" value={form.job} onChange={e => handleChange('job', e.target.value)} placeholder="직업 또는 직책" />
              </div>
              <div className="auth-input-group">
                <label>휴대전화</label>
                <input type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="010-0000-0000" />
              </div>
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button type="submit" className="auth-next-btn auth-btn-full" disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="auth-bottom-link">
            <span>이미 계정이 있으신가요?</span>
            <Link to="/login">로그인</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
