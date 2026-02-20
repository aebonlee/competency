import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    todayUsers: 0,
    totalUsers: 0,
    todayEvals: 0,
    totalEvals: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentEvals, setRecentEvals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setLoading(false);
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        // Total users
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Today's new users
        const { count: todayUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayISO);

        // Total evaluations
        const { count: totalEvals } = await supabase
          .from('eval_list')
          .select('*', { count: 'exact', head: true });

        // Today's evaluations
        const { count: todayEvals } = await supabase
          .from('eval_list')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayISO);

        setStats({
          todayUsers: todayUsers || 0,
          totalUsers: totalUsers || 0,
          todayEvals: todayEvals || 0,
          totalEvals: totalEvals || 0,
        });

        // Recent users
        const { data: recentUserData } = await supabase
          .from('profiles')
          .select('id, name, email, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentUsers(recentUserData || []);

        // Recent evaluations
        const { data: recentEvalData } = await supabase
          .from('eval_list')
          .select(`
            id,
            eval_type,
            progress,
            created_at,
            profiles:user_id (
              name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentEvals(
          (recentEvalData || []).map((ev) => ({
            ...ev,
            userName: ev.profiles?.name || '-',
          }))
        );
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        showToast('대시보드 데이터를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showToast]);

  if (loading) {
    return (
      <div className="admin-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>관리자 대시보드</h1>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="dashboard-card blue">
          <div className="dashboard-card-label">오늘 신규 회원</div>
          <div className="dashboard-card-value">{stats.todayUsers}</div>
          <div className="dashboard-card-sub">Today</div>
        </div>
        <div className="dashboard-card green">
          <div className="dashboard-card-label">전체 회원 수</div>
          <div className="dashboard-card-value">{stats.totalUsers.toLocaleString()}</div>
          <div className="dashboard-card-sub">Total</div>
        </div>
        <div className="dashboard-card orange">
          <div className="dashboard-card-label">오늘 검사 수</div>
          <div className="dashboard-card-value">{stats.todayEvals}</div>
          <div className="dashboard-card-sub">Today</div>
        </div>
        <div className="dashboard-card red">
          <div className="dashboard-card-label">전체 검사 수</div>
          <div className="dashboard-card-value">{stats.totalEvals.toLocaleString()}</div>
          <div className="dashboard-card-sub">Total</div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        <Link to="/admin/users" className="btn btn-secondary" style={{ justifyContent: 'center' }}>회원 관리</Link>
        <Link to="/admin/questions" className="btn btn-secondary" style={{ justifyContent: 'center' }}>문항 관리</Link>
        <Link to="/admin/coupons" className="btn btn-secondary" style={{ justifyContent: 'center' }}>쿠폰 관리</Link>
        <Link to="/admin/statistics" className="btn btn-secondary" style={{ justifyContent: 'center' }}>통계</Link>
        <Link to="/admin/board" className="btn btn-secondary" style={{ justifyContent: 'center' }}>게시판</Link>
        <Link to="/admin/surveys" className="btn btn-secondary" style={{ justifyContent: 'center' }}>만족도 조사</Link>
      </div>

      {/* Recent Data */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Users */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>최근 가입 회원</h3>
            <Link to="/admin/users" style={{ fontSize: '13px', color: 'var(--primary-blue)' }}>전체 보기</Link>
          </div>
          {recentUsers.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px 0' }}>데이터가 없습니다.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>가입일</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name || '-'}</td>
                    <td>{u.email || '-'}</td>
                    <td>{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Evaluations */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>최근 검사</h3>
            <Link to="/admin/statistics" style={{ fontSize: '13px', color: 'var(--primary-blue)' }}>전체 보기</Link>
          </div>
          {recentEvals.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px 0' }}>데이터가 없습니다.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>유형</th>
                  <th>진행률</th>
                  <th>일자</th>
                </tr>
              </thead>
              <tbody>
                {recentEvals.map((ev) => (
                  <tr key={ev.id}>
                    <td>{ev.userName}</td>
                    <td>{ev.eval_type === 1 ? '자기평가' : ev.eval_type === 2 ? '동료평가' : '기타'}</td>
                    <td>
                      {ev.progress >= 100 ? (
                        <span className="badge badge-green">완료</span>
                      ) : (
                        <span className="badge badge-yellow">{ev.progress}%</span>
                      )}
                    </td>
                    <td>{new Date(ev.created_at).toLocaleDateString('ko-KR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
