import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import { CompetencyPolarChart } from '../../components/CompetencyChart';
import { COMPETENCY_LABELS, COMPETENCY_COLORS, AGE_LIST } from '../../data/competencyInfo';
import '../../styles/group.css';
import '../../styles/admin.css';

const getGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const renderBar = (value, maxValue, color = 'var(--primary-blue)') => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
      <div style={{
        flex: 1,
        height: '20px',
        background: 'var(--bg-light)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          borderRadius: '4px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
};

const GroupStatistics = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ members: 0, totalEvals: 0, completed: 0 });
  const [competencyAvg, setCompetencyAvg] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const [subgroupCompletion, setSubgroupCompletion] = useState([]);
  const [ageDist, setAgeDist] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !user) {
          setLoading(false);
          return;
        }

        // Get group
        const { data: group } = await supabase
          .from('groups')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (!group) {
          setLoading(false);
          return;
        }

        // Get members
        const { data: memberRows } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', group.id);

        const memberIds = memberRows?.map(m => m.user_id) || [];
        const memberCount = memberIds.length;

        if (memberIds.length === 0) {
          setStats({ members: 0, totalEvals: 0, completed: 0 });
          setLoading(false);
          return;
        }

        // Get evals
        const { data: evals } = await supabase
          .from('eval_list')
          .select('id, progress, user_id')
          .in('user_id', memberIds);

        const totalEvals = evals?.length || 0;
        const completedEvals = evals?.filter(e => e.progress >= 100) || [];

        setStats({
          members: memberCount,
          totalEvals,
          completed: completedEvals.length,
        });

        // Get competency averages from results
        const completedEvalIds = completedEvals.map(e => e.id);
        if (completedEvalIds.length > 0) {
          const { data: results } = await supabase
            .from('results')
            .select('point1, point2, point3, point4, point5, point6, point7, point8')
            .in('eval_id', completedEvalIds);

          if (results && results.length > 0) {
            const sums = [0, 0, 0, 0, 0, 0, 0, 0];
            results.forEach(r => {
              for (let i = 0; i < 8; i++) {
                sums[i] += (r[`point${i + 1}`] || 0);
              }
            });
            setCompetencyAvg(sums.map(s => Math.round((s / results.length) * 10) / 10));
          }
        }

        // Get subgroup completion rates
        const { data: subgroups } = await supabase
          .from('group_subgroups')
          .select('id, name')
          .eq('group_id', group.id)
          .order('sort_order', { ascending: true });

        if (subgroups && subgroups.length > 0) {
          // Get member profiles with subgroup info
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, subgrp')
            .in('id', memberIds);

          const profileMap = {};
          profiles?.forEach(p => { profileMap[p.id] = p.subgrp; });

          const subCompletions = subgroups.map(sg => {
            const sgMembers = memberIds.filter(uid => profileMap[uid] === sg.name || profileMap[uid] === String(sg.id));
            const sgCompleted = evals?.filter(e =>
              sgMembers.includes(e.user_id) && e.progress >= 100
            ).length || 0;
            const sgTotal = evals?.filter(e => sgMembers.includes(e.user_id)).length || 0;
            return {
              name: sg.name,
              total: sgTotal,
              completed: sgCompleted,
              rate: sgTotal > 0 ? Math.round((sgCompleted / sgTotal) * 100) : 0,
            };
          });

          setSubgroupCompletion(subCompletions);
        }

        // Get age distribution
        const { data: profiles2 } = await supabase
          .from('user_profiles')
          .select('id, age')
          .in('id', memberIds);

        if (profiles2) {
          const ageCount = {};
          AGE_LIST.forEach(a => { ageCount[a.code] = 0; });
          profiles2.forEach(p => {
            if (p.age && ageCount[p.age] !== undefined) {
              ageCount[p.age]++;
            }
          });
          const ageData = AGE_LIST.map(a => ({
            label: a.name,
            count: ageCount[a.code],
          }));
          setAgeDist(ageData);
        }
      } catch (err) {
        console.error('Failed to load group statistics:', err);
        showToast('통계를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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

  const completionRate = stats.totalEvals > 0 ? Math.round((stats.completed / stats.totalEvals) * 100) : 0;
  const maxAge = Math.max(...ageDist.map(a => a.count), 1);
  const maxSubgroupRate = 100;

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container"><h1>그룹 통계</h1></div>
      </section>

      <div className="group-page">
      <div className="group-header-bar">
        <Link to="/group" className="btn btn-secondary btn-sm">돌아가기</Link>
      </div>

      {/* Section 1: Summary KPI (4 cards) */}
      <div className="dashboard-stats">
        <div className="dashboard-card blue">
          <div className="dashboard-card-label">총 멤버</div>
          <div className="dashboard-card-value">{stats.members}</div>
        </div>
        <div className="dashboard-card green">
          <div className="dashboard-card-label">총 검사</div>
          <div className="dashboard-card-value">{stats.totalEvals}</div>
        </div>
        <div className="dashboard-card orange">
          <div className="dashboard-card-label">완료</div>
          <div className="dashboard-card-value">{stats.completed}</div>
        </div>
        <div className="dashboard-card red">
          <div className="dashboard-card-label">완료율</div>
          <div className="dashboard-card-value">{completionRate}%</div>
        </div>
      </div>

      {/* Section 2: Competency Averages */}
      <div className="dashboard-section-title">8대 역량 평균 점수</div>
      <div className="dashboard-viz-row">
        <div className="dashboard-card">
          <div style={{ maxWidth: '360px', margin: '0 auto' }}>
            <CompetencyPolarChart scores={competencyAvg} />
          </div>
        </div>
        <div className="dashboard-card">
          <table className="data-table" style={{ fontSize: '14px' }}>
            <thead>
              <tr>
                <th>역량</th>
                <th style={{ textAlign: 'right' }}>평균 점수</th>
                <th style={{ textAlign: 'center' }}>등급</th>
              </tr>
            </thead>
            <tbody>
              {COMPETENCY_LABELS.map((label, i) => (
                <tr key={i}>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: COMPETENCY_COLORS[i],
                        marginRight: '8px',
                        verticalAlign: 'middle',
                      }}
                    />
                    {label}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{competencyAvg[i]}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge badge-${getGrade(competencyAvg[i]) <= 'B' ? 'green' : getGrade(competencyAvg[i]) <= 'C' ? 'yellow' : 'gray'}`}>
                      {getGrade(competencyAvg[i])}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Subgroup Completion Rates */}
      {subgroupCompletion.length > 0 && (
        <>
          <div className="dashboard-section-title">서브그룹별 완료율</div>
          <div className="card mb-3">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {subgroupCompletion.map((sg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', minWidth: '100px', fontWeight: 500 }}>{sg.name}</span>
                  {renderBar(sg.rate, maxSubgroupRate, 'var(--primary-blue)')}
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', minWidth: '60px' }}>
                    {sg.completed}/{sg.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Section 4: Age Distribution */}
      {ageDist.length > 0 && (
        <>
          <div className="dashboard-section-title">멤버 연령대 분포</div>
          <div className="card mb-3">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ageDist.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', minWidth: '80px', fontWeight: 500 }}>{a.label}</span>
                  {renderBar(a.count, maxAge, '#6366f1')}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      </div>
    </div>
  );
};

export default GroupStatistics;
