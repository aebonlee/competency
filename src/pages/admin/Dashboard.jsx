import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, RadialLinearScale,
  Tooltip, Legend, Filler
} from 'chart.js';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import { COMPETENCY_COLORS, COMPETENCY_LABELS_SHORT } from '../../data/competencyInfo';
import '../../styles/admin.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale, Tooltip, Legend, Filler
);

const chartFont = { family: "'Noto Sans KR', sans-serif" };

const Dashboard = () => {
  const { user: _user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  // Section A: KPI
  const [kpi, setKpi] = useState({
    totalUsers: 0, todayUsers: 0,
    totalEvals: 0, completedEvals: 0, todayEvals: 0,
    totalRevenue: 0, todayRevenue: 0,
    totalCoupons: 0, usedCoupons: 0,
  });

  // Section B: Secondary stats
  const [secondary, setSecondary] = useState({
    groups: 0, posts: 0, unreadNotes: 0,
    avgRating: 0, deletedUsers: 0, questions: 0,
  });

  // Section C–D: Visualization
  const [userDist, setUserDist] = useState({ individual: 0, group: 0, admin: 0, subadmin: 0 });
  const [evalDist, setEvalDist] = useState({ completed: 0, inProgress: 0 });
  const [paymentDist, setPaymentDist] = useState({ paid: 0, pending: 0, failed: 0 });

  // Section C: Time-series
  const [dailySignups, setDailySignups] = useState([]);
  const [dailyEvals, setDailyEvals] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);

  // Section E: Competency
  const [competencyAvg, setCompetencyAvg] = useState([0, 0, 0, 0, 0, 0, 0, 0]);

  // Section G: Recent activity
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

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const sevenDaysAgoISO = sevenDaysAgo.toISOString();

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
          // Q17: recent 10 purchases + join
          supabase.from('purchases').select('id, amount, status, payment_id, created_at, profiles:user_id ( name, email )').order('created_at', { ascending: false }).limit(10),
          // Q18: recent 7 days signups
          supabase.from('user_profiles').select('created_at').gte('created_at', sevenDaysAgoISO).is('deleted_at', null),
          // Q19: recent 7 days completed evals
          supabase.from('eval_list').select('created_at').gte('created_at', sevenDaysAgoISO).gte('progress', 100),
          // Q20: competency scores (all results)
          supabase.from('results').select('point1,point2,point3,point4,point5,point6,point7,point8'),
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

        // User type distribution
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
          (v(16).data || []).map(p => ({ ...p, userName: p.profiles?.name || '-', userEmail: p.profiles?.email || '-' }))
        );

        // Payment status distribution (from Q6 purchases)
        const paidCount = purchases.filter(p => p.status === 'paid').length;
        const pendingCount = purchases.filter(p => p.status === 'pending').length;
        const failedCount = purchases.filter(p => p.status === 'failed').length;
        setPaymentDist({ paid: paidCount, pending: pendingCount, failed: failedCount });

        // Daily signups (7 days)
        const signupRows = v(17).data || [];
        const signupMap = {};
        for (let i = 0; i < 7; i++) {
          const d = new Date(sevenDaysAgo);
          d.setDate(d.getDate() + i);
          signupMap[d.toISOString().slice(0, 10)] = 0;
        }
        signupRows.forEach(r => {
          const key = r.created_at?.slice(0, 10);
          if (key && signupMap[key] !== undefined) signupMap[key]++;
        });
        setDailySignups(Object.entries(signupMap).map(([date, count]) => ({ date, count })));

        // Daily completed evals (7 days)
        const evalRows = v(18).data || [];
        const evalMap = {};
        for (let i = 0; i < 7; i++) {
          const d = new Date(sevenDaysAgo);
          d.setDate(d.getDate() + i);
          evalMap[d.toISOString().slice(0, 10)] = 0;
        }
        evalRows.forEach(r => {
          const key = r.created_at?.slice(0, 10);
          if (key && evalMap[key] !== undefined) evalMap[key]++;
        });
        setDailyEvals(Object.entries(evalMap).map(([date, count]) => ({ date, count })));

        // Monthly revenue (6 months)
        const now = new Date();
        const monthMap = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthMap[key] = 0;
        }
        purchases.filter(p => p.status === 'paid').forEach(p => {
          const key = p.created_at?.slice(0, 7);
          if (key && monthMap[key] !== undefined) monthMap[key] += (p.amount || 0);
        });
        setMonthlyRevenue(Object.entries(monthMap).map(([month, amount]) => ({ month, amount })));

        // Competency averages
        const compRows = v(19).data || [];
        if (compRows.length > 0) {
          const sums = [0, 0, 0, 0, 0, 0, 0, 0];
          compRows.forEach(r => {
            for (let i = 0; i < 8; i++) {
              sums[i] += (r[`point${i + 1}`] || 0);
            }
          });
          setCompetencyAvg(sums.map(s => Math.round((s / compRows.length) * 10) / 10));
        }
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
  const fmtDate = (d) => `${parseInt(d.slice(5, 7))}/${parseInt(d.slice(8, 10))}`;
  const fmtMonth = (m) => `${parseInt(m.slice(5, 7))}월`;

  // Chart common options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { titleFont: chartFont, bodyFont: chartFont },
    },
    scales: {
      x: { ticks: { font: { ...chartFont, size: 11 } } },
      y: { beginAtZero: true, ticks: { font: { ...chartFont, size: 11 }, precision: 0 } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { ...chartFont, size: 11 }, padding: 12 } },
      tooltip: { titleFont: chartFont, bodyFont: chartFont },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { titleFont: chartFont, bodyFont: chartFont },
    },
    scales: {
      r: {
        beginAtZero: true,
        pointLabels: { font: { ...chartFont, size: 11 } },
        ticks: { font: { size: 10 }, stepSize: 20 },
      },
    },
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

        {/* Section A: KPI Cards */}
        <div className="dashboard-stats">
          <div className="dashboard-card blue">
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon blue">👤</div>
              <div>
                <div className="dashboard-card-label">전체 회원</div>
                <div className="dashboard-card-value">{fmtNum(kpi.totalUsers)}</div>
              </div>
            </div>
            <div className="dashboard-card-sub">
              오늘 <span className={`dashboard-trend ${kpi.todayUsers > 0 ? 'up' : ''}`}>+{fmtNum(kpi.todayUsers)}</span>
            </div>
          </div>

          <div className="dashboard-card green">
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon green">📋</div>
              <div>
                <div className="dashboard-card-label">검사 현황</div>
                <div className="dashboard-card-value">{fmtNum(kpi.totalEvals)}</div>
              </div>
            </div>
            <div className="dashboard-card-progress">
              <div className="dashboard-card-progress-bar" style={{ width: `${pct(kpi.completedEvals, kpi.totalEvals)}%`, background: '#22c55e' }} />
            </div>
            <div className="dashboard-card-sub">완료율 {pct(kpi.completedEvals, kpi.totalEvals)}% · 오늘 +{fmtNum(kpi.todayEvals)}</div>
          </div>

          <div className="dashboard-card orange">
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon orange">💰</div>
              <div>
                <div className="dashboard-card-label">총 매출</div>
                <div className="dashboard-card-value">{fmtWon(kpi.totalRevenue)}</div>
              </div>
            </div>
            <div className="dashboard-card-sub">
              오늘 <span className={`dashboard-trend ${kpi.todayRevenue > 0 ? 'up' : ''}`}>+{fmtWon(kpi.todayRevenue)}</span>
            </div>
          </div>

          <div className="dashboard-card red">
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon red">🎟️</div>
              <div>
                <div className="dashboard-card-label">쿠폰 현황</div>
                <div className="dashboard-card-value">{fmtNum(kpi.totalCoupons)}</div>
              </div>
            </div>
            <div className="dashboard-card-progress">
              <div className="dashboard-card-progress-bar" style={{ width: `${pct(kpi.usedCoupons, kpi.totalCoupons)}%`, background: 'var(--accent-red)' }} />
            </div>
            <div className="dashboard-card-sub">사용률 {pct(kpi.usedCoupons, kpi.totalCoupons)}%</div>
          </div>
        </div>

        {/* Section B: Secondary Stats */}
        <h2 className="dashboard-section-title">보조 통계</h2>
        <div className="dashboard-secondary-stats">
          <div className="dashboard-mini-stat">
            <div className="dashboard-mini-stat-icon">👥</div>
            <div className="dashboard-mini-stat-value">{fmtNum(secondary.groups)}</div>
            <div className="dashboard-mini-stat-label">그룹 수</div>
          </div>
          <div className="dashboard-mini-stat">
            <div className="dashboard-mini-stat-icon">📝</div>
            <div className="dashboard-mini-stat-value">{fmtNum(secondary.posts)}</div>
            <div className="dashboard-mini-stat-label">게시글 수</div>
          </div>
          <div className="dashboard-mini-stat">
            <div className="dashboard-mini-stat-icon">🔔</div>
            <div className="dashboard-mini-stat-value">{fmtNum(secondary.unreadNotes)}</div>
            <div className="dashboard-mini-stat-label">미확인 알림</div>
          </div>
          <div className="dashboard-mini-stat">
            <div className="dashboard-mini-stat-icon">⭐</div>
            <div className="dashboard-mini-stat-value">{secondary.avgRating.toFixed(1)}</div>
            <div className="dashboard-mini-stat-label">만족도 평균</div>
          </div>
          <div className="dashboard-mini-stat">
            <div className="dashboard-mini-stat-icon">🚪</div>
            <div className="dashboard-mini-stat-value">{fmtNum(secondary.deletedUsers)}</div>
            <div className="dashboard-mini-stat-label">탈퇴 회원</div>
          </div>
          <div className="dashboard-mini-stat">
            <div className="dashboard-mini-stat-icon">❓</div>
            <div className="dashboard-mini-stat-value">{fmtNum(secondary.questions)}</div>
            <div className="dashboard-mini-stat-label">등록 문항</div>
          </div>
        </div>

        {/* Section C: Time-series Charts */}
        <h2 className="dashboard-section-title">추이 분석</h2>
        <div className="dashboard-chart-grid">
          {/* C1: Weekly signups */}
          <div className="dashboard-chart-card">
            <h3>주간 가입자 추이</h3>
            <div className="dashboard-chart-wrapper">
              <Line
                data={{
                  labels: dailySignups.map(d => fmtDate(d.date)),
                  datasets: [{
                    label: '가입자',
                    data: dailySignups.map(d => d.count),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#3b82f6',
                  }],
                }}
                options={lineOptions}
              />
            </div>
          </div>

          {/* C2: Weekly completed evals */}
          <div className="dashboard-chart-card">
            <h3>주간 검사 완료 추이</h3>
            <div className="dashboard-chart-wrapper">
              <Line
                data={{
                  labels: dailyEvals.map(d => fmtDate(d.date)),
                  datasets: [{
                    label: '검사 완료',
                    data: dailyEvals.map(d => d.count),
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34,197,94,0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#22c55e',
                  }],
                }}
                options={lineOptions}
              />
            </div>
          </div>

          {/* C3: Monthly revenue */}
          <div className="dashboard-chart-card">
            <h3>월별 매출 추이</h3>
            <div className="dashboard-chart-wrapper">
              <Bar
                data={{
                  labels: monthlyRevenue.map(d => fmtMonth(d.month)),
                  datasets: [{
                    label: '매출',
                    data: monthlyRevenue.map(d => d.amount),
                    backgroundColor: 'rgba(245,158,11,0.7)',
                    borderColor: '#f59e0b',
                    borderWidth: 1,
                    borderRadius: 4,
                  }],
                }}
                options={{
                  ...lineOptions,
                  scales: {
                    ...lineOptions.scales,
                    y: { ...lineOptions.scales.y, ticks: { ...lineOptions.scales.y.ticks, callback: (v) => v >= 10000 ? `${v / 10000}만` : v.toLocaleString() } },
                  },
                }}
              />
            </div>
          </div>

          {/* C4: Coupon usage */}
          <div className="dashboard-chart-card">
            <h3>쿠폰 사용률</h3>
            <div className="dashboard-chart-wrapper">
              <Doughnut
                data={{
                  labels: ['사용', '미사용'],
                  datasets: [{
                    data: [kpi.usedCoupons, kpi.totalCoupons - kpi.usedCoupons],
                    backgroundColor: ['#ef4444', '#e5e7eb'],
                    borderWidth: 0,
                  }],
                }}
                options={doughnutOptions}
              />
            </div>
          </div>
        </div>

        {/* Section D: Distribution Charts */}
        <h2 className="dashboard-section-title">분포 현황</h2>
        <div className="dashboard-chart-grid dashboard-chart-grid-3">
          <div className="dashboard-chart-card">
            <h3>회원 유형 분포</h3>
            <div className="dashboard-chart-wrapper">
              <Doughnut
                data={{
                  labels: ['개인', '그룹', '관리자', '서브관리자'],
                  datasets: [{
                    data: [userDist.individual, userDist.group, userDist.admin, userDist.subadmin],
                    backgroundColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'],
                    borderWidth: 0,
                  }],
                }}
                options={doughnutOptions}
              />
            </div>
          </div>
          <div className="dashboard-chart-card">
            <h3>검사 진행 현황</h3>
            <div className="dashboard-chart-wrapper">
              <Doughnut
                data={{
                  labels: ['완료', '진행중'],
                  datasets: [{
                    data: [evalDist.completed, evalDist.inProgress],
                    backgroundColor: ['#22c55e', '#f59e0b'],
                    borderWidth: 0,
                  }],
                }}
                options={doughnutOptions}
              />
            </div>
          </div>
          <div className="dashboard-chart-card">
            <h3>결제 상태 분포</h3>
            <div className="dashboard-chart-wrapper">
              <Doughnut
                data={{
                  labels: ['완료', '대기', '실패'],
                  datasets: [{
                    data: [paymentDist.paid, paymentDist.pending, paymentDist.failed],
                    backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                    borderWidth: 0,
                  }],
                }}
                options={doughnutOptions}
              />
            </div>
          </div>
        </div>

        {/* Section E: Competency Stats */}
        <h2 className="dashboard-section-title">역량별 통계</h2>
        <div className="dashboard-competency-grid">
          <div className="dashboard-chart-card">
            <h3>전체 평균 역량 레이더</h3>
            <div className="dashboard-chart-wrapper">
              <Radar
                data={{
                  labels: COMPETENCY_LABELS_SHORT,
                  datasets: [{
                    label: '평균 점수',
                    data: competencyAvg,
                    backgroundColor: 'rgba(59,130,246,0.15)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    pointBackgroundColor: COMPETENCY_COLORS,
                    pointBorderColor: COMPETENCY_COLORS,
                    pointRadius: 5,
                  }],
                }}
                options={radarOptions}
              />
            </div>
          </div>
          <div className="dashboard-chart-card">
            <h3>역량별 평균 점수</h3>
            <div className="dashboard-chart-wrapper">
              <Bar
                data={{
                  labels: COMPETENCY_LABELS_SHORT,
                  datasets: [{
                    label: '평균 점수',
                    data: competencyAvg,
                    backgroundColor: COMPETENCY_COLORS.map(c => c + 'CC'),
                    borderColor: COMPETENCY_COLORS,
                    borderWidth: 1,
                    borderRadius: 4,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: 'y',
                  plugins: {
                    legend: { display: false },
                    tooltip: { titleFont: chartFont, bodyFont: chartFont },
                  },
                  scales: {
                    x: { beginAtZero: true, ticks: { font: { ...chartFont, size: 11 } } },
                    y: { ticks: { font: { ...chartFont, size: 11 } } },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Section F: Quick Actions */}
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

        {/* Section G: Recent Activity */}
        <h2 className="dashboard-section-title">최근 활동</h2>
        <div className="dashboard-recent-grid dashboard-recent-grid-2">
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
        </div>

        {/* Recent Purchases — full width */}
        <div className="dashboard-payment-table card">
          <div className="dashboard-card-header">
            <h3>최근 결제</h3>
            <Link to="/admin/statistics" className="dashboard-view-all">전체 보기</Link>
          </div>
          {recentPurchases.length === 0 ? (
            <p className="dashboard-empty">데이터가 없습니다.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>결제일시</th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>금액</th>
                  <th>결제ID</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map(p => (
                  <tr key={p.id}>
                    <td>{new Date(p.created_at).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace('-', '.').replace('-', '.')}</td>
                    <td>{p.userName}</td>
                    <td>{p.userEmail}</td>
                    <td>{fmtWon(p.amount)}</td>
                    <td><span className="payment-id-cell">{p.payment_id ? (p.payment_id.length > 12 ? p.payment_id.slice(0, 12) + '...' : p.payment_id) : '-'}</span></td>
                    <td>
                      {p.status === 'paid'
                        ? <span className="badge badge-green">완료</span>
                        : p.status === 'failed'
                          ? <span className="badge badge-red">실패</span>
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
  );
};

export default Dashboard;
