import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from '../../utils/auth';
import { useToast } from '../../contexts/ToastContext';
import { POSITION_LIST, AGE_LIST, EDUCATION_LIST, REGION_LIST } from '../../data/competencyInfo';
import '../../styles/auth.css';

const CompleteProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: profile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    gender: 'M',
    phone: '',
    age: '',
    edulevel: '',
    position: 0,
    job: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      setError('이름을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateProfile(user.id, {
        name: form.name,
        gender: form.gender,
        phone: form.phone,
        age: form.age,
        edulevel: form.edulevel,
        position: parseInt(form.position) || 0,
        job: form.job,
        country: form.country
      });
      await refreshProfile();
      showToast('프로필이 완성되었습니다.', 'success');
      navigate('/main', { replace: true });
    } catch (err) {
      setError(err.message || '프로필 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-fullpage">
      <div className="auth-center-wrapper" style={{ maxWidth: '480px' }}>
        <div className="auth-card-google">
          <div className="auth-logo-area">
            <span className="brand-mcc">MyCoreCompetency</span>
          </div>
          <h2 className="auth-heading">프로필 완성</h2>
          <p className="auth-sub">검사를 위해 기본 정보를 입력해주세요</p>

          <form onSubmit={handleSubmit} className="auth-email-form">
            <div className="auth-input-group">
              <label>이름 *</label>
              <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="이름" required autoFocus />
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

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-next-btn auth-btn-full" disabled={loading}>
              {loading ? '저장 중...' : '프로필 완성'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CompleteProfile;
