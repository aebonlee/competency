import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/group.css';
import '../../styles/base.css';

const GroupEvalList = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvals = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !user) {
          setLoading(false);
          return;
        }

        // Get group for current manager
        const { data: group } = await supabase
          .from('groups')
          .select('id')
          .eq('manager_id', user.id)
          .single();

        if (!group) {
          setLoading(false);
          return;
        }

        // Get group member user IDs
        const { data: memberData } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', group.id);

        const userIds = memberData?.map((m) => m.user_id) || [];

        if (userIds.length === 0) {
          setEvals([]);
          setLoading(false);
          return;
        }

        // Get evaluations for all group members
        const { data: evalData, error } = await supabase
          .from('eval_list')
          .select(`
            id,
            user_id,
            eval_type,
            times,
            progress,
            start_date,
            end_date,
            created_at,
            profiles:user_id (
              name,
              email
            )
          `)
          .in('user_id', userIds)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setEvals(
          (evalData || []).map((ev) => ({
            ...ev,
            userName: ev.profiles?.name || '-',
            userEmail: ev.profiles?.email || '-',
          }))
        );
      } catch (err) {
        console.error('Failed to load evaluations:', err);
        showToast('검사 목록을 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchEvals();
  }, [user, showToast]);

  const getEvalTypeName = (evalType) => {
    switch (evalType) {
      case 1: return '자기평가';
      case 2: return '동료평가';
      case 3: return '상호평가';
      default: return '기타';
    }
  };

  const getProgressBadge = (progress) => {
    if (progress >= 100) {
      return <span className="badge badge-green">완료</span>;
    } else if (progress > 0) {
      return <span className="badge badge-yellow">{progress}%</span>;
    }
    return <span className="badge badge-gray">대기</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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
        <div className="container"><h1>검사 현황</h1></div>
      </section>

      <div className="group-page">
      <div className="group-header-bar">
        <Link to="/group" className="btn btn-secondary btn-sm">돌아가기</Link>
      </div>

      <div className="group-user-list">
        {evals.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
            등록된 검사가 없습니다.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>이름</th>
                <th>이메일</th>
                <th>검사 유형</th>
                <th>회차</th>
                <th>진행률</th>
                <th>시작일</th>
                <th>완료일</th>
              </tr>
            </thead>
            <tbody>
              {evals.map((ev, idx) => (
                <tr key={ev.id}>
                  <td>{idx + 1}</td>
                  <td>{ev.userName}</td>
                  <td>{ev.userEmail}</td>
                  <td>{getEvalTypeName(ev.eval_type)}</td>
                  <td>{ev.times}회</td>
                  <td>{getProgressBadge(ev.progress)}</td>
                  <td>{formatDate(ev.start_date)}</td>
                  <td>{formatDate(ev.end_date)}</td>
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

export default GroupEvalList;
