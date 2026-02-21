import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import { CompetencyPolarChart } from '../../components/CompetencyChart';
import { COMPETENCY_LABELS } from '../../data/competencyInfo';
import '../../styles/group.css';
import '../../styles/result.css';

const GroupUserResult = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [memberProfile, setMemberProfile] = useState(null);
  const [evalResult, setEvalResult] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !user || !userId) {
          setLoading(false);
          return;
        }

        // Verify current user is group manager for this member
        const { data: group } = await supabase
          .from('groups')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (!group) {
          showToast('그룹 정보를 찾을 수 없습니다.', 'error');
          setLoading(false);
          return;
        }

        const { data: membership } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', group.id)
          .eq('user_id', userId)
          .single();

        if (!membership) {
          showToast('해당 멤버를 찾을 수 없습니다.', 'error');
          setLoading(false);
          return;
        }

        // Fetch member profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('name, email, phone')
          .eq('id', userId)
          .single();

        setMemberProfile(profile);

        // Fetch the latest completed eval
        const { data: evals } = await supabase
          .from('eval_list')
          .select('id, eval_type, times, progress, start_date, end_date')
          .eq('user_id', userId)
          .gte('progress', 100)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!evals || evals.length === 0) {
          setLoading(false);
          return;
        }

        const latestEval = evals[0];

        // Fetch result data
        const { data: result } = await supabase
          .from('results')
          .select('*')
          .eq('eval_id', latestEval.id)
          .single();

        if (result) {
          setEvalResult({ ...result, ...latestEval });

          // Extract scores for the 8 competencies
          const competencyScores = [
            result.point1 || 0,
            result.point2 || 0,
            result.point3 || 0,
            result.point4 || 0,
            result.point5 || 0,
            result.point6 || 0,
            result.point7 || 0,
            result.point8 || 0,
          ];
          setScores(competencyScores);
        }
      } catch (err) {
        console.error('Failed to load member result:', err);
        showToast('결과를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [user, userId, showToast]);

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
        <div className="container"><h1>멤버 검사 결과</h1></div>
      </section>

      <div className="group-page">
      <div className="group-header-bar">
        <Link to="/group/users" className="btn btn-secondary btn-sm">목록으로</Link>
      </div>

      {/* Member Info */}
      {memberProfile && (
        <div className="card mb-3">
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
            {memberProfile.name || '이름 없음'}
          </h2>
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <span>{memberProfile.email}</span>
            {memberProfile.phone && <span>{memberProfile.phone}</span>}
          </div>
        </div>
      )}

      {/* Result */}
      {!evalResult ? (
        <div className="card text-center" style={{ padding: '60px 20px' }}>
          <p style={{ fontSize: '16px', color: 'var(--text-light)' }}>
            완료된 검사 결과가 없습니다.
          </p>
        </div>
      ) : (
        <>
          {/* Eval Info */}
          <div className="card mb-3">
            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span>검사 유형: {evalResult.eval_type === 1 ? '자기평가' : evalResult.eval_type === 2 ? '동료평가' : '기타'}</span>
              <span>회차: {evalResult.times}회</span>
              {evalResult.end_date && (
                <span>완료일: {new Date(evalResult.end_date).toLocaleDateString('ko-KR')}</span>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="card mb-3">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', textAlign: 'center' }}>
              8대 핵심역량 분석 결과
            </h3>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <CompetencyPolarChart scores={scores} />
            </div>
          </div>

          {/* Score Table */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              역량별 점수
            </h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>역량</th>
                  <th>점수</th>
                  <th>등급</th>
                </tr>
              </thead>
              <tbody>
                {COMPETENCY_LABELS.map((label, idx) => {
                  const score = scores[idx] || 0;
                  let grade = 'D';
                  if (score >= 80) grade = 'A';
                  else if (score >= 60) grade = 'B';
                  else if (score >= 40) grade = 'C';

                  return (
                    <tr key={idx}>
                      <td>{label}</td>
                      <td>{score}점</td>
                      <td>
                        <span className={`badge ${grade === 'A' ? 'badge-green' : grade === 'B' ? 'badge-blue' : grade === 'C' ? 'badge-yellow' : 'badge-red'}`}>
                          {grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: '16px', textAlign: 'right', fontSize: '14px', color: 'var(--text-secondary)' }}>
              총점: {scores.reduce((a, b) => a + b, 0)}점 / 평균: {scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0}점
            </div>
          </div>
        </>
      )}
    </div>
    </div>
  );
};

export default GroupUserResult;
