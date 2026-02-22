import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';

const Dashboard = () => {
  const { user: _user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  // Section 1: KPI
  const [kpi, setKpi] = useState({
    totalUsers: 0, todayUsers: 0,
    totalEvals: 0, completedEvals: 0, todayEvals: 0,
    totalRevenue: 0, todayRevenue: 0,
    totalCoupons: 0, usedCoupons: 0,
  });

  // Section 2: Secondary stats
  const [secondary, setSecondary] = useState({
    groups: 0, posts: 0, unreadNotes: 0,
    avgRating: 0, deletedUsers: 0, questions: 0,
  });

  // Section 3: Visualization
  const [userDist, setUserDist] = useState({ individual: 0, group: 0, admin: 0, subadmin: 0 });
  const [evalDist, setEvalDist] = useState({ completed: 0, inProgress: 0 });

  // Section 5: Recent activity
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentEvals, setRecentEvals] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) { setLoading(false); return; }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const results = await Promise.allSettled([
          // Q1: active user count
          supabase.from('user_profiles').select('*', { count: 'exact', head: true }).is('deleted_at', null),
          // Q2: today signups
          supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayISO).is('deleted_at', null),
          // Q3: total evals
          supabase.from('eval_list').select('*', { count: 'exact', head: true }),
          // Q4: completed evals
          supabase.from('eval_list').select('*', { count: 'exact', head: true }).gte('progress', 100),
          // Q5: today evals
          supabase.from('eval_list').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
          // Q6: purchases (amount, status, created_at)
          supabase.from('purchases').select('amount, status, created_at'),
          // Q7: coupons (is_used)
          supabase.from('coupons').select('is_used'),
          // Q8: groups count
          supabase.from('groups').select('*', { count: 'exact', head: true }),
          // Q9: board_posts count
          supabase.from('board_posts').select('*', { count: 'exact', head: true }),
          // Q10: unread notes
          supabase.from('notes').select('*', { count: 'exact', head: true }).eq('is_read', false),
          // Q11: surveys (rating)
          supabase.from('surveys').select('rating'),
          // Q12: deleted users
          supabase.from('user_profiles').select('*', { count: 'exact', head: true }).not('deleted_at', 'is', null),
          // Q13: questions count
          supabase.from('questions').select('*', { count: 'exact', head: true }),
          // Q14: user type distribution
          supabase.from('user_profiles').select('usertype').is('deleted_at', null),
          // Q15: recent 5 users
          supabase.from('user_profiles').select('id, name, email, created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
          // Q16: recent 5 evals + join
          supabase.from('eval_list').select('id, eval_type, progress, created_at, profiles:user_id ( name )').order('created_at', { ascending: false }).limit(5),
          // Q17: recent 5 purchases + join
          supabase.from('purchases').select('id, amount, status, created_at, profiles:user_id ( name )').order('created_at', { ascending: false }).limit(5),
        ]);

        const v = (i) => (results[i]?.status === 'fulfilled' ? results[i].value : {});

        // KPI
        const totalUsers = v(0).count || 0;
        const todayUsers = v(1).count || 0;
        const totalEvals = v(2).count || 0;
        const completedEvals = v(3).count || 0;
        const todayEvals = v(4).count || 0;

        const purchases = v(5).data || [];
        const totalRevenue = purchases.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
        const todayRevenue = purchases.filter(p => p.status === 'paid' && p.created_at >= todayISO).reduce((s, p) => s + (p.amount || 0), 0);

        const coupons = v(6).data || [];
        const totalCoupons = coupons.length;
        const usedCoupons = coupons.filter(c => c.is_used).length;

        setKpi({ totalUsers, todayUsers, totalEvals, completedEvals, todayEvals, totalRevenue, todayRevenue, totalCoupons, usedCoupons });

        // Secondary
        const groups = v(7).count || 0;
        const posts = v(8).count || 0;
        const unreadNotes = v(9).count || 0;
        const surveys = v(10).data || [];
        const avgRating = surveys.length > 0 ? (surveys.reduce((s, r) => s + (r.rating || 0), 0) / surveys.length) : 0;
        const deletedUsers = v(11).count || 0;
        const questions = v(12).count || 0;

        setSecondary({ groups, posts, unreadNotes, avgRating, deletedUsers, questions });

        // Visualization
        const userTypes = v(13).data || [];
        const dist = { individual: 0, group: 0, admin: 0, subadmin: 0 };
        userTypes.forEach(u => {
          if (u.usertype === 0) dist.individual++;
          else if (u.usertype === 1) dist.group++;
          else if (u.usertype === 2) dist.admin++;
          else if (u.usertype === 3) dist.subadmin++;
        });
        setUserDist(dist);
        setEvalDist({ completed: completedEvals, inProgress: totalEvals - completedEvals });

        // Recent activity
        setRecentUsers(v(14).data || []);
        setRecentEvals(
          (v(15).data || []).map(ev => ({ ...ev, userName: ev.profiles?.name || '-' }))
        );
        setRecentPurchases(
          (v(16).data || []).map(p => ({ ...p, userName: p.profiles?.name || '-' }))
        );
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        showToast('대시보드 데이터를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [showToast]);

  // Helpers
  const fmtNum = (n) => (n || 0).toLocaleString();
  const fmtWon = (n) => (n || 0).toLocaleString() + '원';
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

  const StackedBar = ({ segments }) => {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    return (
      <>
        <div className="dashboard-stacked-bar">
          {segments.map((seg, i) => (
            <div
              key={i}
              className="bar-segment"
              style={{ width: total > 0 ? `${(seg.value / total) * 100}%` : '0%', background: seg.color }}
              title={`${seg.label}: ${fmtNum(seg.value)}`}
            />
          ))}
        </div>
        <div className="dashboard-bar-legend">
          {segments.map((seg, i) => (
            <span key={i}>
              <span className="legend-dot" style={{ background: seg.color }} />
              {seg.label} {fmtNum(seg.value)}
              {total > 0 ? ` (${pct(seg.value, total)}%)` : ''}
            </span>
          ))}
        </div>
      </>
    );
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
        <div className="container"><h1>관리자 대시보드</h1></div>
      </section>

      <div className="admin-page">

        {/* Section 1: KPI Cards */}
        <div className="dashboard-stats">
          <div className="dashboard-card blue">
            <div className="dashboard-card-label">전체 회원</div>
            <div className="dashboard-card-value">{fmtNum(kpi.totalUsers)}</div>
            <div className="dashboard-card-sub">오늘 +{fmtNum(kpi.todayUsers)}</div>
          </div>
          <div className="dashboard-card green">
            <div className="dashboard-card-label">검사 현황</div>
            <div className="dashboard-card-value">{fmtNum(kpi.totalEvals)}</div>
            <div className="dashboard-card-sub">완료율 {pct(kpi.completedEvals, kpi.totalEvals)}%</div>
          </div>
          <div className="dashboard-card orange">
            <div className="dashboard-card-label">결제 현황</div>
            <div className="dashboard-card-value">{fmtWon(kpi.totalRevenue)}</div>
            <div className="dashboard-card-sub">오늘 {fmtWon(kpi.todayRevenue)}</div>
          </div>
          <div className="dashboard-card red">
            <div className="dashboard-card-label">쿠폰 현황</div>
            <div className="dashboard-card-value">{fmtNum(kpi.totalCoupons)}</div>
            <div className="dashboard-card-sub">사용률 {pct(kpi.usedCoupons, kpi.totalCoupons)}%</div>
          </div>
        </div>

        {/* Section 2: Secondary Stats */}
        <h2 className="dashboard-section-title">보조 통계</h2>
        <div className="dashboard-secondary-stats">
          <div className="dashboard-mini-stat">
            <div className="dashboard-mini-stat-value">{fmtNum(secondary.groups)}</div>
            <div className="dashboard-mini-stat-label">그룹 수</div>
          </div>
          <div className="dashboard-mini-stat">
            <div className="dashboard-mini-stat-value">{fmtNum(secondary.posts)}</div>
            <div className="dashboard-mini-stat-label">게시글 수</div>
          </div>
          <div className="dashboard-mini-stat">
            <div className="dashboard-mini-stat-value">{fmtNum(secondary.unreadNotes)}</div>
            <div className="dashboard-mini-stat-label">미확인 알림</div>
          </div>
          <div className="dashboard-mini-stat">
            <div className="dashboard-mini-stat-value">{secondary.avgRating.toFixed(1)}</div>
            <div className="dashboard-mini-stat-label">만족도 평균</div>
          </div>
          <div className="dashboard-mini-stat">
            <div className="dashboard-mini-stat-value">{fmtNum(secondary.deletedUsers)}</div>
            <div className="dashboard-mini-stat-label">탈퇴 회원</div>
          </div>
          <div className="dashboard-mini-stat">
            <div className="dashboard-mini-stat-value">{fmtNum(secondary.questions)}</div>
            <div className="dashboard-mini-stat-label">등록 문항</div>
          </div>
        </div>

        {/* Section 3: Visualization */}
        <h2 className="dashboard-section-title">시각화</h2>
        <div className="dashboard-viz-row">
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>회원 유형 분포</h3>
            <StackedBar segments={[
              { label: '개인', value: userDist.individual, color: '#3b82f6' },
              { label: '그룹', value: userDist.group, color: '#22c55e' },
              { label: '관리자', value: userDist.admin, color: '#f59e0b' },
              { label: '서브관리자', value: userDist.subadmin, color: '#ef4444' },
            ]} />
          </div>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>검사 진행 현황</h3>
            <StackedBar segments={[
              { label: '완료', value: evalDist.completed, color: '#22c55e' },
              { label: '진행중', value: evalDist.inProgress, color: '#f59e0b' },
            ]} />
          </div>
        </div>

        {/* Section 4: Quick Actions */}
        <h2 className="dashboard-section-title">빠른 이동</h2>
        <div className="dashboard-quick-actions">
          <div className="quick-action-group">
            <div className="quick-action-group-label">회원 관리</div>
            <div className="quick-action-links">
              <Link to="/admin/users">회원 목록</Link>
              <Link to="/admin/deleted-users">탈퇴 회원</Link>
            </div>
          </div>
          <div className="quick-action-group">
            <div className="quick-action-group-label">콘텐츠 관리</div>
            <div className="quick-action-links">
              <Link to="/admin/questions">문항 관리</Link>
              <Link to="/admin/board">게시판</Link>
              <Link to="/admin/surveys">만족도 조사</Link>
              <Link to="/admin/survey-questions">설문 관리</Link>
            </div>
          </div>
          <div className="quick-action-group">
            <div className="quick-action-group-label">결제 / 쿠폰</div>
            <div className="quick-action-links">
              <Link to="/admin/coupons">쿠폰 관리</Link>
              <Link to="/admin/statistics">통계</Link>
            </div>
          </div>
          <div className="quick-action-group">
            <div className="quick-action-group-label">소통</div>
            <div className="quick-action-links">
              <Link to="/admin/notes">알림 / 메시지</Link>
              <Link to="/admin/mail">메일 발송</Link>
            </div>
          </div>
        </div>

        {/* Section 5: Recent Activity */}
        <h2 className="dashboard-section-title">최근 활동</h2>
        <div className="dashboard-recent-grid">
          {/* Recent Users */}
          <div className="card">
            <div className="dashboard-card-header">
              <h3>최근 가입 회원</h3>
              <Link to="/admin/users" className="dashboard-view-all">전체 보기</Link>
            </div>
            {recentUsers.length === 0 ? (
              <p className="dashboard-empty">데이터가 없습니다.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>이름</th><th>이메일</th><th>가입일</th></tr>
                </thead>
                <tbody>
                  {recentUsers.map(u => (
                    <tr key={u.id}>
                      <td><Link to={`/admin/users/${u.id}`} style={{ color: 'var(--primary-blue)' }}>{u.name || '-'}</Link></td>
                      <td>{u.email || '-'}</td>
                      <td>{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Evals */}
          <div className="card">
            <div className="dashboard-card-header">
              <h3>최근 검사</h3>
              <Link to="/admin/statistics" className="dashboard-view-all">전체 보기</Link>
            </div>
            {recentEvals.length === 0 ? (
              <p className="dashboard-empty">데이터가 없습니다.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>이름</th><th>유형</th><th>진행률</th></tr>
                </thead>
                <tbody>
                  {recentEvals.map(ev => (
                    <tr key={ev.id}>
                      <td>{ev.userName}</td>
                      <td>{ev.eval_type === 1 ? '자기평가' : ev.eval_type === 2 ? '동료평가' : '기타'}</td>
                      <td>
                        {ev.progress >= 100
                          ? <span className="badge badge-green">완료</span>
                          : <span className="badge badge-yellow">{ev.progress}%</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Purchases */}
          <div className="card">
            <div className="dashboard-card-header">
              <h3>최근 결제</h3>
              <Link to="/admin/statistics" className="dashboard-view-all">전체 보기</Link>
            </div>
            {recentPurchases.length === 0 ? (
              <p className="dashboard-empty">데이터가 없습니다.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>이름</th><th>금액</th><th>상태</th></tr>
                </thead>
                <tbody>
                  {recentPurchases.map(p => (
                    <tr key={p.id}>
                      <td>{p.userName}</td>
                      <td>{fmtWon(p.amount)}</td>
                      <td>
                        {p.status === 'paid'
                          ? <span className="badge badge-green">완료</span>
                          : <span className="badge badge-yellow">대기</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
