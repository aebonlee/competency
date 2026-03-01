import { useState, useEffect } from 'react';
import getSupabase from '../../utils/supabase';
import { COMPETENCY_LABELS_SHORT, COMPETENCY_COLORS, AGE_LIST, POSITION_LIST } from '../../data/competencyInfo';
import '../../styles/result.css';

const ResultAvg = () => {
  const [overallAvg, setOverallAvg] = useState(null);
  const [ageAvg, setAgeAvg] = useState([]);
  const [posAvg, setPosAvg] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const client = getSupabase();
      if (!client) { setLoading(false); return; }

      try {
        // Fetch completed results (최근 10,000건 제한)
        const { data: results } = await client
          .from('results')
          .select('point1, point2, point3, point4, point5, point6, point7, point8, eval_id')
          .order('created_at', { ascending: false })
          .limit(10000);

        if (!results || results.length === 0) {
          setLoading(false);
          return;
        }

        // Calculate overall averages
        const sums = [0, 0, 0, 0, 0, 0, 0, 0];
        results.forEach(r => {
          for (let i = 0; i < 8; i++) {
            sums[i] += r[`point${i + 1}`] || 0;
          }
        });
        const avg = sums.map(s => Math.round(s / results.length));
        setOverallAvg(avg);

        // Fetch eval_list to get user_ids for completed evals
        const evalIds = results.map(r => r.eval_id);
        const { data: evals } = await client
          .from('eval_list')
          .select('id, user_id')
          .in('id', evalIds);

        if (!evals) { setLoading(false); return; }

        // Build eval_id → user_id map
        const evalUserMap = {};
        evals.forEach(e => { evalUserMap[e.id] = e.user_id; });

        // Get unique user_ids
        const userIds = [...new Set(Object.values(evalUserMap))];

        // Fetch user profiles (age, position)
        const { data: profiles } = await client
          .from('user_profiles')
          .select('id, age, position')
          .in('id', userIds);

        if (!profiles) { setLoading(false); return; }

        // Build user_id → profile map
        const profileMap = {};
        profiles.forEach(p => { profileMap[p.id] = p; });

        // Group results by age
        const ageGroups = {};
        AGE_LIST.forEach(a => { ageGroups[a.code] = { label: a.name, sums: [0,0,0,0,0,0,0,0], count: 0 }; });

        // Group results by position
        const posGroups = {};
        POSITION_LIST.forEach(p => { posGroups[p.code] = { label: p.name, sums: [0,0,0,0,0,0,0,0], count: 0 }; });

        results.forEach(r => {
          const userId = evalUserMap[r.eval_id];
          const prof = profileMap[userId];
          if (!prof) return;

          const scores = [r.point1||0, r.point2||0, r.point3||0, r.point4||0, r.point5||0, r.point6||0, r.point7||0, r.point8||0];

          if (prof.age && ageGroups[prof.age]) {
            ageGroups[prof.age].count++;
            scores.forEach((s, i) => { ageGroups[prof.age].sums[i] += s; });
          }

          if (prof.position && posGroups[prof.position]) {
            posGroups[prof.position].count++;
            scores.forEach((s, i) => { posGroups[prof.position].sums[i] += s; });
          }
        });

        // Compute age averages
        const ageResult = AGE_LIST
          .map(a => {
            const g = ageGroups[a.code];
            if (g.count === 0) return null;
            return {
              label: g.label,
              count: g.count,
              avg: g.sums.map(s => Math.round(s / g.count)),
            };
          })
          .filter(Boolean);
        setAgeAvg(ageResult);

        // Compute position averages
        const posResult = POSITION_LIST
          .map(p => {
            const g = posGroups[p.code];
            if (g.count === 0) return null;
            return {
              label: g.label,
              count: g.count,
              avg: g.sums.map(s => Math.round(s / g.count)),
            };
          })
          .filter(Boolean);
        setPosAvg(posResult);

      } catch (err) {
        console.error('Failed to load average scores:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="page-wrapper"><div style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}><div className="loading-spinner" /></div></div>;
  }

  const renderScoreRow = (avg) => (
    <div className="stat-grid-4">
      {COMPETENCY_LABELS_SHORT.map((label, i) => (
        <div key={i} className="stat-cell">
          <div className="stat-dot" style={{ background: COMPETENCY_COLORS[i] }} />
          <div className="stat-cell-label">{label}</div>
          <div className="stat-cell-value">{avg ? avg[i] : '—'}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container">
          <h1>나이별 &amp; 직무별 통계</h1>
          <p>전체 검사자 기준 평균 역량 점수</p>
        </div>
      </section>

      <div className="result-page">
        {/* Overall Average */}
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>전체 평균 점수</h3>
          {!overallAvg ? (
            <p style={{ color: 'var(--text-light)', fontSize: 14 }}>
              아직 충분한 검사 데이터가 없습니다.
            </p>
          ) : (
            renderScoreRow(overallAvg)
          )}
        </div>

        {/* Age-based Average */}
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>나이별 평균 점수</h3>
          {ageAvg.length === 0 ? (
            <p style={{ color: 'var(--text-light)', fontSize: 14 }}>데이터가 없습니다.</p>
          ) : (
            ageAvg.map(group => (
              <div key={group.label} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{group.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-light)' }}>({group.count}명)</span>
                </div>
                {renderScoreRow(group.avg)}
              </div>
            ))
          )}
        </div>

        {/* Position-based Average */}
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>직무별 평균 점수</h3>
          {posAvg.length === 0 ? (
            <p style={{ color: 'var(--text-light)', fontSize: 14 }}>데이터가 없습니다.</p>
          ) : (
            posAvg.map(group => (
              <div key={group.label} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{group.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-light)' }}>({group.count}명)</span>
                </div>
                {renderScoreRow(group.avg)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultAvg;
