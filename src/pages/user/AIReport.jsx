import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEvaluations, getResult } from '../../utils/supabase';
import AIReportSection from '../../components/AIReportSection';
import '../../styles/result.css';
import '../../styles/ai-report.css';

const AIReport = () => {
  const { user } = useAuth();
  const [completedEvals, setCompletedEvals] = useState([]);
  const [selectedEvalId, setSelectedEvalId] = useState(null);
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(false);

  // 점수 로드 함수 (effect 외부에서만 호출)
  const loadScores = async (evalId) => {
    setScoresLoading(true);
    setScores(null);
    const result = await getResult(evalId);
    if (result) {
      setScores([
        result.point1, result.point2, result.point3, result.point4,
        result.point5, result.point6, result.point7, result.point8,
      ]);
    }
    setScoresLoading(false);
  };

  // 완료된 검사 목록 로드 + 최신 검사 자동 선택
  useEffect(() => {
    if (!user) return;
    getEvaluations(user.id).then(data => {
      const completed = data.filter(ev => ev.progress === 100);
      setCompletedEvals(completed);
      if (completed.length > 0) {
        const firstId = completed[0].id;
        setSelectedEvalId(firstId);
        loadScores(firstId);
      }
      setLoading(false);
    });
  }, [user]);

  // 드롭다운 변경 핸들러
  const handleEvalChange = (e) => {
    const evalId = Number(e.target.value);
    setSelectedEvalId(evalId);
    loadScores(evalId);
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container">
          <h1>AI 역량 분석 보고서</h1>
          <p>AI가 검사 결과를 분석하여 맞춤형 역량 개발 보고서를 작성합니다.</p>
        </div>
      </section>

      <div className="result-page">
        {completedEvals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>
              완료된 검사가 없습니다. 검사를 먼저 완료해 주세요.
            </p>
            <Link to="/main" className="btn btn-primary">검사하기</Link>
          </div>
        ) : (
          <>
            {/* 회차 선택 드롭다운 */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="eval-select" style={{ fontWeight: 600, marginRight: '12px', fontSize: '15px' }}>
                검사 회차 선택
              </label>
              <select
                id="eval-select"
                value={selectedEvalId || ''}
                onChange={handleEvalChange}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                  background: 'var(--bg-white)',
                }}
              >
                {completedEvals.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.times}회차 — {ev.end_date ? new Date(ev.end_date).toLocaleDateString('ko-KR') : new Date(ev.created_at).toLocaleDateString('ko-KR')}
                  </option>
                ))}
              </select>
            </div>

            {/* AI 보고서 섹션 */}
            {scoresLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <div className="loading-spinner" />
              </div>
            ) : scores ? (
              <AIReportSection evalId={selectedEvalId} scores={scores} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
                검사 결과를 불러올 수 없습니다.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIReport;
