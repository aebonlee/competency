import { useState, useEffect } from 'react';
import getSupabase from '../../utils/supabase';
import { COMPETENCY_LABELS_SHORT, COMPETENCY_COLORS } from '../../data/competencyInfo';
import '../../styles/result.css';

const ResultAvg = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const client = getSupabase();
      if (!client) { setLoading(false); return; }

      // Get average scores by age and position
      const { data } = await client.rpc('get_average_scores').catch(() => ({ data: null }));
      setStats(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="result-page"><div style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}><div className="loading-spinner" /></div></div>;
  }

  return (
    <div className="result-page">
      <div className="result-header">
        <h1>나이별 &amp; 직무별 통계</h1>
        <p>전체 검사자 기준 평균 역량 점수</p>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>전체 평균 점수</h3>
        <p style={{ color: 'var(--text-light)', fontSize: 14 }}>
          데이터가 충분히 수집되면 나이별, 직무별 통계가 표시됩니다.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
          {COMPETENCY_LABELS_SHORT.map((label, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 12, border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: COMPETENCY_COLORS[i], margin: '0 auto 8px' }} />
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{stats ? '—' : '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultAvg;
