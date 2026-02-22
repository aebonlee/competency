import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const SurveyList = () => {
  const { user: _user } = useAuth();
  const { showToast } = useToast();
  const [surveys, setSurveys] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('surveys')
          .select(`
            id,
            rating,
            comment,
            created_at,
            user_id,
            profiles:user_id (
              name,
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const surveyData = (data || []).map((s) => ({
          ...s,
          userName: s.profiles?.name || s.profiles?.email || '-',
        }));

        setSurveys(surveyData);

        // Calculate average rating
        if (surveyData.length > 0) {
          const totalRating = surveyData.reduce((sum, s) => sum + (s.rating || 0), 0);
          setAverageRating(Math.round((totalRating / surveyData.length) * 10) / 10);

          // Calculate distribution
          const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          surveyData.forEach((s) => {
            const r = Math.min(5, Math.max(1, Math.round(s.rating || 0)));
            dist[r]++;
          });
          setRatingDistribution(dist);
        }
      } catch (err) {
        console.error('Failed to load surveys:', err);
        showToast('만족도 조사 목록을 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, [showToast]);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span
          key={i}
          style={{
            color: i < fullStars ? '#f59e0b' : '#e5e7eb',
            fontSize: '16px',
          }}
        >
          ★
        </span>
      );
    }
    return <span style={{ display: 'inline-flex' }}>{stars}</span>;
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
        <div className="container"><h1>만족도 조사</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '32px' }}>
        {/* Average Rating Card */}
        <div className="card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--primary-blue)' }}>
            {averageRating}
          </div>
          <div style={{ margin: '8px 0' }}>
            {renderStars(averageRating)}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>
            총 {surveys.length}건의 응답
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            평점 분포
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating] || 0;
              const maxCount = Math.max(...Object.values(ratingDistribution), 1);
              const percentage = surveys.length > 0 ? Math.round((count / surveys.length) * 100) : 0;

              return (
                <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', minWidth: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {rating}
                  </span>
                  <span style={{ color: '#f59e0b', fontSize: '14px' }}>★</span>
                  <div style={{
                    flex: 1,
                    height: '16px',
                    background: 'var(--bg-light-gray)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
                      height: '100%',
                      background: '#f59e0b',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '13px', minWidth: '60px', textAlign: 'right', color: 'var(--text-light)' }}>
                    {count}건 ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Survey List */}
      <div className="admin-table-wrapper">
        {surveys.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
            등록된 만족도 조사 결과가 없습니다.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>번호</th>
                <th style={{ width: '120px' }}>작성자</th>
                <th style={{ width: '120px' }}>평점</th>
                <th>의견</th>
                <th style={{ width: '120px' }}>작성일</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey, idx) => (
                <tr key={survey.id}>
                  <td>{idx + 1}</td>
                  <td>{survey.userName}</td>
                  <td>{renderStars(survey.rating)}</td>
                  <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {survey.comment || '-'}
                  </td>
                  <td>{new Date(survey.created_at).toLocaleDateString('ko-KR')}</td>
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

export default SurveyList;
