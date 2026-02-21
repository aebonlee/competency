import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/group.css';
import '../../styles/base.css';

const GroupUserEvalList = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [memberName, setMemberName] = useState('');
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvalHistory = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !user || !userId) {
          setLoading(false);
          return;
        }

        // Fetch member name
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', userId)
          .single();

        setMemberName(profile?.name || '이름 없음');

        // Fetch all evaluations for this user
        const { data: evalData, error } = await supabase
          .from('eval_list')
          .select('id, times, progress, end_date')
          .eq('user_id', userId)
          .order('times', { ascending: false });

        if (error) throw error;

        // For completed evals, fetch elapsed time from results
        const evalsWithResult = await Promise.all(
          (evalData || []).map(async (ev) => {
            return {
              ...ev,
              elapsedTime: null,
            };
          })
        );

        setEvals(evalsWithResult);
      } catch (err) {
        console.error('Failed to load evaluation history:', err);
        showToast('검사 내역을 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchEvalHistory();
  }, [user, userId, showToast]);

  const formatElapsedTime = (seconds) => {
    if (!seconds && seconds !== 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
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
        <div className="container"><h1>{memberName} - 검사 내역</h1></div>
      </section>

      <div className="group-page">
      <div className="group-header-bar">
        <Link to="/group/users" className="btn btn-secondary btn-sm">돌아가기</Link>
      </div>

      <div className="group-user-list">
        {evals.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
            완료된 검사가 존재하지 않습니다
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>회차</th>
                <th>소요시간</th>
                <th>검사결과</th>
              </tr>
            </thead>
            <tbody>
              {evals.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.times}회</td>
                  <td>{ev.progress >= 100 ? formatElapsedTime(ev.elapsedTime) : '-'}</td>
                  <td>
                    {ev.progress >= 100 ? (
                      <Link
                        to={`/group/users/${userId}/result`}
                        className="btn btn-primary btn-sm"
                      >
                        결과 보기
                      </Link>
                    ) : (
                      <span className="badge badge-yellow">진행 중</span>
                    )}
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

export default GroupUserEvalList;
