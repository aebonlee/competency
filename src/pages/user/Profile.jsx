import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { updateProfile } from '../../utils/auth';
import { POSITION_LIST, AGE_LIST, EDUCATION_LIST, REGION_LIST } from '../../data/competencyInfo';

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '', phone: '', gender: 'M',
    age: '', edulevel: '', position: 0,
    job: '', country: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        gender: profile.gender || 'M',
        age: profile.age || '',
        edulevel: profile.edulevel || '',
        position: profile.position || 0,
        job: profile.job || '',
        country: profile.country || ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(user.id, form);
      await refreshProfile();
      showToast('프로필이 수정되었습니다.', 'success');
    } catch (err) {
      showToast('프로필 수정에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container"><h1>프로필 수정</h1></div>
      </section>

      <section className="section-content">
        <div className="container-sm">
          <div className="card">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">
                {(profile?.name || 'U')[0]}
              </div>
              <p className="profile-email">{user?.email}</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>이름</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="form-group"><label>휴대전화</label><input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label>성별</label><select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}><option value="M">남성</option><option value="F">여성</option></select></div>
                <div className="form-group"><label>나이대</label><select value={form.age} onChange={e => setForm({...form, age: e.target.value})}><option value="">선택</option>{AGE_LIST.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>학력</label><select value={form.edulevel} onChange={e => setForm({...form, edulevel: e.target.value})}><option value="">선택</option>{EDUCATION_LIST.map(e => <option key={e.code} value={e.code}>{e.name}</option>)}</select></div>
                <div className="form-group"><label>시/도</label><select value={form.country} onChange={e => setForm({...form, country: e.target.value})}><option value="">선택</option>{REGION_LIST.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
              <div className="form-group"><label>직무</label><select value={form.position} onChange={e => setForm({...form, position: parseInt(e.target.value)})}><option value={0}>선택</option>{POSITION_LIST.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select></div>
              <div className="form-group"><label>직업/직책</label><input type="text" value={form.job} onChange={e => setForm({...form, job: e.target.value})} /></div>

              <div className="profile-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '저장 중...' : '프로필 저장'}</button>
                <Link to="/delete-account" className="btn btn-danger ml-auto">회원탈퇴</Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
