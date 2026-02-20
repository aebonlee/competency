import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEvaluations, getResult } from '../../utils/supabase';
import { CompetencyPolarChart } from '../../components/CompetencyChart';
import '../../styles/result.css';

const PrevResult = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const evals = await getEvaluations(user.id);
      const completed = evals.filter(e => e.progress === 100);
      const withResults = await Promise.all(
        completed.map(async (ev) => {
          const result = await getResult(ev.id);
          return { ...ev, result };
        })
      );
      setResults(withResults.filter(r => r.result));
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return <div className="result-page"><div style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}><div className="loading-spinner" /></div></div>;
  }

  const latest = results[0];

  return (
    <div className="result-page">
      <div className="result-header">
        <h1>최근 검사 결과</h1>
        <p>{results.length}회 검사 완료</p>
      </div>

      {latest ? (
        <>
          <div className="chart-section">
            <h2>{latest.times}회차 결과</h2>
            <div className="chart-wrapper">
              <CompetencyPolarChart scores={[
                latest.result.point1, latest.result.point2, latest.result.point3, latest.result.point4,
                latest.result.point5, latest.result.point6, latest.result.point7, latest.result.point8
              ]} />
            </div>
          </div>

          {results.length > 1 && (
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>이전 결과</h2>
              <div className="prev-result-grid">
                {results.slice(1).map(r => (
                  <Link to={`/result/${r.id}`} key={r.id} className="card" style={{ textDecoration: 'none' }}>
                    <h4 style={{ marginBottom: 8 }}>{r.times}회차</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-light)' }}>{new Date(r.end_date).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>완료된 검사가 없습니다.</p>
          <Link to="/main" className="btn btn-primary">검사하기</Link>
        </div>
      )}
    </div>
  );
};

export default PrevResult;
