import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const UserInfo = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [evals, setEvals] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', usertype: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !userId) {
          setLoading(false);
          return;
        }

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);
        setEditForm({
          name: profileData.name || '',
          phone: profileData.phone || '',
          usertype: profileData.usertype ?? 0,
        });

        // Fetch evaluations
        const { data: evalData, error: evalError } = await supabase
          .from('eval_list')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (evalError) throw evalError;
        setEvals(evalData || []);
      } catch (err) {
        console.error('Failed to load user info:', err);
        showToast('회원 정보를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [userId, showToast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          usertype: Number(editForm.usertype),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      setProfile((prev) => ({
        ...prev,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        usertype: Number(editForm.usertype),
      }));
      setEditing(false);
      showToast('회원 정보가 수정되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to update user:', err);
      showToast('회원 정보 수정에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      // Delete evaluations first
      await supabase
        .from('eval_list')
        .delete()
        .eq('user_id', userId);

      // Delete profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      showToast('회원이 삭제되었습니다.', 'success');
      navigate('/admin/users');
    } catch (err) {
      console.error('Failed to delete user:', err);
      showToast('회원 삭제에 실패했습니다.', 'error');
    }
  };

  const getUsertypeLabel = (usertype) => {
    switch (usertype) {
      case 0: return '개인';
      case 1: return '그룹';
      case 2: return '관리자';
      case 3: return '서브관리자';
      default: return '개인';
    }
  };

  const getUsertypeBadge = (usertype) => {
    switch (usertype) {
      case 0: return <span className="badge badge-gray">개인</span>;
      case 1: return <span className="badge badge-blue">그룹</span>;
      case 2: return <span className="badge badge-red">관리자</span>;
      case 3: return <span className="badge badge-yellow">서브관리자</span>;
      default: return <span className="badge badge-gray">개인</span>;
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>회원 상세 정보</h1>
          <Link to="/admin/users" className="btn btn-secondary btn-sm">목록으로</Link>
        </div>
        <div className="card text-center" style={{ padding: '60px 20px' }}>
          <p style={{ fontSize: '16px', color: 'var(--text-light)' }}>
            회원 정보를 찾을 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>회원 상세 정보</h1>
        <Link to="/admin/users" className="btn btn-secondary btn-sm">목록으로</Link>
      </div>

      {/* Profile Card */}
      <div className="card mb-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
            {profile.name || '이름 없음'} {getUsertypeBadge(profile.usertype)}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!editing ? (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>수정</button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>삭제</button>
              </>
            ) : (
              <>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>취소</button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div>
            <div className="form-row">
              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>전화번호</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label>회원 유형</label>
              <select
                value={editForm.usertype}
                onChange={(e) => setEditForm((prev) => ({ ...prev, usertype: e.target.value }))}
              >
                <option value={0}>개인</option>
                <option value={1}>그룹</option>
                <option value={2}>관리자</option>
                <option value={3}>서브관리자</option>
              </select>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
            <div>
              <span style={{ color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>이메일</span>
              <span style={{ fontWeight: 500 }}>{profile.email || '-'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>전화번호</span>
              <span style={{ fontWeight: 500 }}>{profile.phone || '-'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>나이대</span>
              <span style={{ fontWeight: 500 }}>{profile.age || '-'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>직무</span>
              <span style={{ fontWeight: 500 }}>{profile.position || '-'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>지역</span>
              <span style={{ fontWeight: 500 }}>{profile.region || '-'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>가입일</span>
              <span style={{ fontWeight: 500 }}>
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString('ko-KR') : '-'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Evaluation History */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>검사 이력</h3>
        {evals.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-light)' }}>
            검사 이력이 없습니다.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>검사 유형</th>
                <th>회차</th>
                <th>진행률</th>
                <th>시작일</th>
                <th>완료일</th>
              </tr>
            </thead>
            <tbody>
              {evals.map((ev, idx) => (
                <tr key={ev.id}>
                  <td>{idx + 1}</td>
                  <td>{ev.eval_type === 1 ? '자기평가' : ev.eval_type === 2 ? '동료평가' : '기타'}</td>
                  <td>{ev.times}회</td>
                  <td>
                    {ev.progress >= 100 ? (
                      <span className="badge badge-green">완료</span>
                    ) : ev.progress > 0 ? (
                      <span className="badge badge-yellow">{ev.progress}%</span>
                    ) : (
                      <span className="badge badge-gray">대기</span>
                    )}
                  </td>
                  <td>{ev.start_date ? new Date(ev.start_date).toLocaleDateString('ko-KR') : '-'}</td>
                  <td>{ev.end_date ? new Date(ev.end_date).toLocaleDateString('ko-KR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserInfo;
