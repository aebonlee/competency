import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/group.css';

const GroupMain = () => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [groupInfo, setGroupInfo] = useState(null);
  const [stats, setStats] = useState({ members: 0, completed: 0, inProgress: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !user) {
          setLoading(false);
          return;
        }

        // Fetch group info
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (groupError && groupError.code !== 'PGRST116') {
          throw groupError;
        }

        if (group) {
          setGroupInfo(group);

          // Fetch member count
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          // Fetch evaluation stats
          const { data: evals } = await supabase
            .from('eval_list')
            .select('id, progress, user_id')
            .in('user_id',
              (await supabase
                .from('group_members')
                .select('user_id')
                .eq('group_id', group.id)
              ).data?.map(m => m.user_id) || []
            );

          const completedCount = evals?.filter(e => e.progress >= 100).length || 0;
          const inProgressCount = evals?.filter(e => e.progress > 0 && e.progress < 100).length || 0;

          setStats({
            members: memberCount || 0,
            completed: completedCount,
            inProgress: inProgressCount,
            total: evals?.length || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load group data:', err);
        showToast('그룹 정보를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [user, showToast]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!groupInfo) {
    return (
      <div className="page-wrapper">
        <section className="page-header">
          <div className="container"><h1>그룹 관리</h1></div>
        </section>
        <div className="group-page">
          <div className="card text-center" style={{ padding: '60px 20px' }}>
            <p style={{ fontSize: '16px', color: 'var(--text-light)' }}>
              등록된 그룹이 없습니다. 관리자에게 문의해 주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container"><h1>그룹 관리</h1></div>
      </section>

      <div className="group-page">

      {/* Group Info Card */}
      <div className="card mb-3">
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          {groupInfo.name}
        </h2>
        {groupInfo.org && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {groupInfo.org}
          </p>
        )}
        {groupInfo.description && (
          <p style={{ fontSize: '14px', color: 'var(--text-light)', marginTop: '8px' }}>
            {groupInfo.description}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="group-stats">
        <div className="group-stat-card">
          <div className="group-stat-value">{stats.members}</div>
          <div className="group-stat-label">총 멤버 수</div>
        </div>
        <div className="group-stat-card">
          <div className="group-stat-value">{stats.completed}</div>
          <div className="group-stat-label">검사 완료</div>
        </div>
        <div className="group-stat-card">
          <div className="group-stat-value">{stats.inProgress}</div>
          <div className="group-stat-label">검사 진행중</div>
        </div>
        <div className="group-stat-card">
          <div className="group-stat-value">{stats.total}</div>
          <div className="group-stat-label">총 검사 수</div>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        <Link to="/group/users" className="card" style={{ textDecoration: 'none', textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary-blue)" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>멤버 관리</span>
        </Link>
        <Link to="/group/evals" className="card" style={{ textDecoration: 'none', textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary-blue)" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>검사 현황</span>
        </Link>
        <Link to="/group/invitation" className="card" style={{ textDecoration: 'none', textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary-blue)" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>초대 관리</span>
        </Link>
        <Link to="/group/org" className="card" style={{ textDecoration: 'none', textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary-blue)" strokeWidth="2">
              <rect x="2" y="2" width="8" height="6" rx="1" />
              <rect x="14" y="16" width="8" height="6" rx="1" />
              <rect x="2" y="16" width="8" height="6" rx="1" />
              <path d="M6 8v3h12v3" />
              <path d="M6 11v8" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>조직도</span>
        </Link>
        <Link to="/group/coupons" className="card" style={{ textDecoration: 'none', textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary-blue)" strokeWidth="2">
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
              <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
              <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>쿠폰 관리</span>
        </Link>
        <Link to="/group/settings" className="card" style={{ textDecoration: 'none', textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary-blue)" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>그룹 설정</span>
        </Link>
      </div>
      </div>
    </div>
  );
};

export default GroupMain;
