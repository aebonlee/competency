import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { signUp } from '../../utils/auth';
import getSupabase from '../../utils/supabase';
import { POSITION_LIST, AGE_LIST, EDUCATION_LIST, REGION_LIST } from '../../data/competencyInfo';
import '../../styles/auth.css';

const InviteRegister = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    email: '', password: '', passwordConfirm: '',
    name: '', gender: 'M', phone: '',
    age: '', edulevel: '', position: 0, job: '', country: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkInvitation = async () => {
      const client = getSupabase();
      if (!client || !code) { setLoading(false); return; }
      const { data } = await client.from('coupons').select('*').eq('code', code).eq('is_used', false).single();
      setInvitation(data);
      setLoading(false);
    };
    checkInvitation();
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    if (form.password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await signUp(form.email, form.password, {
        name: form.name, gender: form.gender, phone: form.phone,
        age: form.age, edulevel: form.edulevel, position: parseInt(form.position) || 0,
        job: form.job, country: form.country
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="auth-fullpage">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="loading-spinner" />
        </div>
      </section>
    );
  }

  if (!invitation) {
    return (
      <section className="auth-fullpage">
        <div className="auth-center-wrapper">
          <div className="auth-card-google" style={{ textAlign: 'center' }}>
            <h2 className="auth-heading">유효하지 않은 초대 코드</h2>
            <p className="auth-sub">이 초대 코드는 만료되었거나 이미 사용되었습니다.</p>
            <Link to="/register" className="auth-next-btn" style={{ display: 'inline-block', textDecoration: 'none', marginTop: 16 }}>일반 회원가입</Link>
          </div>
        </div>
      </section>
    );
  }

  if (success) {
    return (
      <section className="auth-fullpage">
        <div className="auth-center-wrapper">
          <div className="auth-card-google">
            <div className="auth-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <h2>초대 회원가입 완료!</h2>
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
      <div className="auth-center-wrapper" style={{ maxWidth: 480 }}>
        <div className="auth-card-google">
          <div className="auth-logo-area"><span className="brand-mcc">MyCoreCompetency</span></div>
          <h2 className="auth-heading">초대 회원가입</h2>
          <p className="auth-sub">그룹 초대를 통한 회원가입</p>
          <form onSubmit={handleSubmit} className="auth-email-form">
            <div className="auth-input-group"><label>이름 *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="auth-input-group"><label>이메일 *</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
            <div className="auth-input-row">
              <div className="auth-input-group"><label>비밀번호 *</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} minLength={6} required /></div>
              <div className="auth-input-group"><label>비밀번호 확인 *</label><input type="password" value={form.passwordConfirm} onChange={e => setForm({...form, passwordConfirm: e.target.value})} required /></div>
            </div>
            <div className="auth-input-row">
              <div className="auth-input-group"><label>성별</label><select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}><option value="M">남성</option><option value="F">여성</option></select></div>
              <div className="auth-input-group"><label>나이대</label><select value={form.age} onChange={e => setForm({...form, age: e.target.value})}><option value="">선택</option>{AGE_LIST.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}</select></div>
            </div>
            <div className="auth-input-group"><label>직무</label><select value={form.position} onChange={e => setForm({...form, position: e.target.value})}><option value={0}>선택</option>{POSITION_LIST.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select></div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-next-btn auth-btn-full" disabled={submitting}>{submitting ? '가입 중...' : '회원가입'}</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default InviteRegister;
