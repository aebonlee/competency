import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const EvalManager = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [userName, setUserName] = useState('');
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !userId) {
          setLoading(false);
          return;
        }

        // Fetch user profile for name
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        setUserName(profileData?.name || '이름 없음');

        // Fetch evaluations with results for elapsed time
        const { data: evalData, error: evalError } = await supabase
          .from('eval_list')
          .select(`
            id,
            times,
            progress,
            created_at,
            end_date,
            results (
              id,
              elapsed_time
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (evalError) throw evalError;
        setEvals(evalData || []);
      } catch (err) {
        console.error('Failed to load evaluation data:', err);
        showToast('검사 목록을 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, showToast]);

  const handleDeleteEval = async (evalId) => {
    if (!window.confirm('이 검사를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('eval_list')
        .delete()
        .eq('id', evalId);

      if (error) throw error;

      setEvals((prev) => prev.filter((ev) => ev.id !== evalId));
      showToast('검사가 삭제되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to delete eval:', err);
      showToast('검사 삭제에 실패했습니다.', 'error');
    }
  };

  const formatElapsedTime = (seconds) => {
    if (!seconds && seconds !== 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const getElapsedTime = (ev) => {
    if (ev.results && ev.results.length > 0 && ev.results[0].elapsed_time != null) {
      return formatElapsedTime(ev.results[0].elapsed_time);
    }
    return '-';
  };

  const getResultId = (ev) => {
    if (ev.results && ev.results.length > 0) {
      return ev.results[0].id;
    }
    return null;
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
        <div className="container"><h1>검사 관리 - {userName}</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <Link to="/admin/users" className="btn btn-secondary btn-sm">회원 목록</Link>
      </div>

      {/* Eval Table */}
      <div className="admin-table-wrapper">
        {evals.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
            검사 이력이 없습니다.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>회차</th>
                <th>진행률</th>
                <th>소요시간</th>
                <th>상태</th>
                <th>결과보기</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {evals.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.times}회</td>
                  <td>{ev.progress != null ? `${ev.progress}%` : '-'}</td>
                  <td>{getElapsedTime(ev)}</td>
                  <td>
                    {ev.progress >= 100 ? (
                      <span className="badge badge-green">완료</span>
                    ) : (
                      <span className="badge badge-yellow">진행중</span>
                    )}
                  </td>
                  <td>
                    {getResultId(ev) ? (
                      <Link
                        to={`/admin/results/${getResultId(ev)}`}
                        className="btn btn-primary btn-sm"
                      >
                        결과보기
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>-</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteEval(ev.id)}
                    >
                      삭제
                    </button>
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

export default EvalManager;
