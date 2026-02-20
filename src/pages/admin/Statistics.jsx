import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import { AGE_LIST, POSITION_LIST, REGION_LIST } from '../../data/competencyInfo';
import '../../styles/admin.css';
import '../../styles/base.css';

const Statistics = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [ageStats, setAgeStats] = useState([]);
  const [positionStats, setPositionStats] = useState([]);
  const [regionStats, setRegionStats] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalEvals, setTotalEvals] = useState(0);
  const [completedEvals, setCompletedEvals] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setLoading(false);
          return;
        }

        // Get all profiles for demographic analysis
        const { data: profiles, count: userCount } = await supabase
          .from('profiles')
          .select('age, position, region', { count: 'exact' });

        setTotalUsers(userCount || 0);

        // Get eval counts
        const { count: evalCount } = await supabase
          .from('eval_list')
          .select('*', { count: 'exact', head: true });

        const { count: completedCount } = await supabase
          .from('eval_list')
          .select('*', { count: 'exact', head: true })
          .gte('progress', 100);

        setTotalEvals(evalCount || 0);
        setCompletedEvals(completedCount || 0);

        // Compute age distribution
        const ageCounts = {};
        AGE_LIST.forEach((a) => { ageCounts[a.code] = 0; });
        (profiles || []).forEach((p) => {
          if (p.age && ageCounts.hasOwnProperty(p.age)) {
            ageCounts[p.age]++;
          }
        });
        setAgeStats(
          AGE_LIST.map((a) => ({
            label: a.name,
            count: ageCounts[a.code] || 0,
          }))
        );

        // Compute position distribution
        const posCounts = {};
        POSITION_LIST.forEach((p) => { posCounts[p.code] = 0; });
        (profiles || []).forEach((p) => {
          if (p.position && posCounts.hasOwnProperty(p.position)) {
            posCounts[p.position]++;
          }
        });
        setPositionStats(
          POSITION_LIST.map((p) => ({
            label: p.name,
            count: posCounts[p.code] || 0,
          })).filter((p) => p.count > 0)
            .sort((a, b) => b.count - a.count)
        );

        // Compute region distribution
        const regionCounts = {};
        REGION_LIST.forEach((r) => { regionCounts[r] = 0; });
        (profiles || []).forEach((p) => {
          if (p.region && regionCounts.hasOwnProperty(p.region)) {
            regionCounts[p.region]++;
          }
        });
        setRegionStats(
          REGION_LIST.map((r) => ({
            label: r,
            count: regionCounts[r] || 0,
          })).filter((r) => r.count > 0)
            .sort((a, b) => b.count - a.count)
        );
      } catch (err) {
        console.error('Failed to load statistics:', err);
        showToast('통계 데이터를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [showToast]);

  const renderBar = (count, maxCount) => {
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        <div style={{
          flex: 1,
          height: '20px',
          background: 'var(--bg-light-gray)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: 'var(--primary-blue)',
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>
          {count}
        </span>
      </div>
    );
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

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>통계</h1>
        <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
      </div>

      {/* Summary Stats */}
      <div className="dashboard-stats" style={{ marginBottom: '32px' }}>
        <div className="dashboard-card blue">
          <div className="dashboard-card-label">전체 회원</div>
          <div className="dashboard-card-value">{totalUsers.toLocaleString()}</div>
        </div>
        <div className="dashboard-card green">
          <div className="dashboard-card-label">전체 검사</div>
          <div className="dashboard-card-value">{totalEvals.toLocaleString()}</div>
        </div>
        <div className="dashboard-card orange">
          <div className="dashboard-card-label">완료 검사</div>
          <div className="dashboard-card-value">{completedEvals.toLocaleString()}</div>
        </div>
        <div className="dashboard-card red">
          <div className="dashboard-card-label">완료율</div>
          <div className="dashboard-card-value">
            {totalEvals > 0 ? Math.round((completedEvals / totalEvals) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Age Distribution */}
      <div className="card mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
          연령별 분포
        </h3>
        {ageStats.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px 0' }}>데이터가 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ageStats.map((stat) => {
              const maxCount = Math.max(...ageStats.map((s) => s.count), 1);
              return (
                <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', minWidth: '80px', color: 'var(--text-secondary)' }}>
                    {stat.label}
                  </span>
                  {renderBar(stat.count, maxCount)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Position Distribution */}
      <div className="card mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
          직무별 분포
        </h3>
        {positionStats.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px 0' }}>데이터가 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {positionStats.map((stat) => {
              const maxCount = Math.max(...positionStats.map((s) => s.count), 1);
              return (
                <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', minWidth: '160px', color: 'var(--text-secondary)' }}>
                    {stat.label}
                  </span>
                  {renderBar(stat.count, maxCount)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Region Distribution */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
          지역별 분포
        </h3>
        {regionStats.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px 0' }}>데이터가 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {regionStats.map((stat) => {
              const maxCount = Math.max(...regionStats.map((s) => s.count), 1);
              return (
                <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', minWidth: '120px', color: 'var(--text-secondary)' }}>
                    {stat.label}
                  </span>
                  {renderBar(stat.count, maxCount)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
