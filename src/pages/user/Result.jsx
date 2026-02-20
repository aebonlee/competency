import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getResult } from '../../utils/supabase';
import { CompetencyPolarChart } from '../../components/CompetencyChart';
import CompetencyIcons from '../../components/CompetencyIcons';
import { COMPETENCY_LABELS, COMPETENCY_COLORS } from '../../data/competencyInfo';
import '../../styles/result.css';

const Result = () => {
  const { evalId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getResult(parseInt(evalId));
      setResult(data);
      setLoading(false);
    };
    load();
  }, [evalId]);

  if (loading) {
    return (
      <div className="result-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-page">
        <div className="result-header">
          <h1>검사 결과</h1>
          <p>아직 결과가 생성되지 않았습니다. 검사를 완료해주세요.</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Link to="/main" className="btn btn-primary">메인으로</Link>
        </div>
      </div>
    );
  }

  const scores = [
    result.point1, result.point2, result.point3, result.point4,
    result.point5, result.point6, result.point7, result.point8
  ];

  const totalScore = scores.reduce((a, b) => a + b, 0);
  const avgScore = Math.round(totalScore / 8);

  return (
    <div className="result-page">
      <div className="result-header">
        <h1>핵심역량 검사 결과</h1>
        <p>4차 산업혁명 8대 핵심역량 진단 결과입니다</p>
      </div>

      {/* Polar Chart */}
      <div className="chart-section">
        <h2>역량 프로필</h2>
        <div className="chart-wrapper">
          <CompetencyPolarChart scores={scores} />
        </div>
      </div>

      {/* Top 3 */}
      <div className="top3-section">
        <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
          나의 TOP 3 역량
        </h2>
        <CompetencyIcons scores={scores} showTop={3} />
      </div>

      {/* Score Table */}
      <div className="score-table card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>역량별 점수</h3>
        {scores.map((score, i) => (
          <div className="score-row" key={i}>
            <div className="score-color" style={{ background: COMPETENCY_COLORS[i] }} />
            <div className="score-label">{COMPETENCY_LABELS[i]}</div>
            <div className="score-bar-wrapper">
              <div className="score-bar" style={{ width: `${score}%`, background: COMPETENCY_COLORS[i] }} />
            </div>
            <div className="score-value">{score}</div>
          </div>
        ))}
        <div className="score-row" style={{ borderTop: '2px solid var(--text-primary)', marginTop: 8, paddingTop: 12 }}>
          <div className="score-color" style={{ background: 'var(--primary-blue)' }} />
          <div className="score-label" style={{ fontWeight: 700 }}>평균 점수</div>
          <div className="score-bar-wrapper">
            <div className="score-bar" style={{ width: `${avgScore}%`, background: 'var(--primary-blue)' }} />
          </div>
          <div className="score-value" style={{ color: 'var(--primary-blue)' }}>{avgScore}</div>
        </div>
      </div>

      {/* Infographic */}
      <div className="infographic-section">
        <h2>검사 요약</h2>
        <div className="infographic-stats">
          <div className="infographic-stat">
            <div className="infographic-stat-value">{avgScore}</div>
            <div className="infographic-stat-label">평균 점수</div>
          </div>
          <div className="infographic-stat">
            <div className="infographic-stat-value">{Math.max(...scores)}</div>
            <div className="infographic-stat-label">최고 점수</div>
          </div>
          <div className="infographic-stat">
            <div className="infographic-stat-value">{Math.min(...scores)}</div>
            <div className="infographic-stat-label">최저 점수</div>
          </div>
          <div className="infographic-stat">
            <div className="infographic-stat-value">{totalScore}</div>
            <div className="infographic-stat-label">총점</div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link to="/results" className="btn btn-secondary" style={{ marginRight: 12 }}>전체 결과 보기</Link>
        <Link to="/main" className="btn btn-primary">메인으로</Link>
      </div>
    </div>
  );
};

export default Result;
