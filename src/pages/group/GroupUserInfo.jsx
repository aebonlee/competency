import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/group.css';
import '../../styles/base.css';

const GroupUserInfo = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !user || !userId) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;

        setProfile(data);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        showToast('회원 정보를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [user, userId, showToast]);

  const getGenderLabel = (gender) => {
    if (gender === 'M') return '남성';
    if (gender === 'F') return '여성';
    return '-';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container"><h1>회원 정보</h1></div>
      </section>

      <div className="group-page">
      <div className="group-header-bar">
        <Link to="/group/users" className="btn btn-secondary btn-sm">돌아가기</Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to={`/group/users/${userId}/evals`} className="btn btn-secondary btn-sm">검사 내역</Link>
          <Link to={`/group/users/${userId}/result`} className="btn btn-primary btn-sm">검사 결과</Link>
        </div>
      </div>

      {!profile ? (
        <div className="card text-center" style={{ padding: '60px 20px' }}>
          <p style={{ fontSize: '16px', color: 'var(--text-light)' }}>
            회원 정보를 찾을 수 없습니다.
          </p>
        </div>
      ) : (
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>
            {profile.name || '이름 없음'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-light)', marginBottom: '4px' }}>이름</label>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{profile.name || '-'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-light)', marginBottom: '4px' }}>이메일</label>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{profile.email || '-'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-light)', marginBottom: '4px' }}>전화번호</label>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{profile.phone || '-'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-light)', marginBottom: '4px' }}>성별</label>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{getGenderLabel(profile.gender)}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-light)', marginBottom: '4px' }}>나이대</label>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{profile.age_group || '-'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-light)', marginBottom: '4px' }}>학력</label>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{profile.education || '-'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-light)', marginBottom: '4px' }}>직무</label>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{profile.job_function || '-'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-light)', marginBottom: '4px' }}>직업/직책</label>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{profile.job_title || '-'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-light)', marginBottom: '4px' }}>지역</label>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{profile.region || '-'}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-light)', marginBottom: '4px' }}>가입일</label>
              <div style={{ fontSize: '15px', fontWeight: 500 }}>{formatDate(profile.created_at)}</div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default GroupUserInfo;
