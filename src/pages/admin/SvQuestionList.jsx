import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const SvQuestionList = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('survey_questions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setQuestions(data || []);
      } catch (err) {
        console.error('Failed to load survey questions:', err);
        showToast('설문 질문 목록을 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [showToast]);

  const handleDelete = async (questionId) => {
    if (!window.confirm('이 질문을 삭제하시겠습니까?')) return;

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('survey_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      showToast('질문이 삭제되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to delete survey question:', err);
      showToast('질문 삭제에 실패했습니다.', 'error');
    }
  };

  const getTargetLabel = (targetType) => {
    switch (targetType) {
      case 0: return '전체';
      case 1: return '비그룹';
      case 2: return '그룹회원';
      default: return '전체';
    }
  };

  const getTargetBadge = (targetType) => {
    switch (targetType) {
      case 0: return <span className="badge badge-blue">전체</span>;
      case 1: return <span className="badge badge-gray">비그룹</span>;
      case 2: return <span className="badge badge-green">그룹회원</span>;
      default: return <span className="badge badge-blue">전체</span>;
    }
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
        <div className="container"><h1>설문 질문 관리</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/admin/survey-questions/new" className="btn btn-primary btn-sm">질문 추가</Link>
          <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
        </div>
      </div>

      <div className="admin-toolbar">
        <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>
          총 {questions.length}개 질문
        </span>
      </div>

      <div className="admin-table-wrapper">
        {questions.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
            등록된 설문 질문이 없습니다.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>번호</th>
                <th>질문 내용</th>
                <th style={{ width: '100px' }}>대상</th>
                <th style={{ width: '200px' }}>기간</th>
                <th style={{ width: '140px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, idx) => (
                <tr key={q.id}>
                  <td>{idx + 1}</td>
                  <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.content || '-'}
                  </td>
                  <td>{getTargetBadge(q.target_type)}</td>
                  <td>
                    {formatDate(q.start_date)} ~ {formatDate(q.end_date)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link
                        to={`/admin/survey-questions/${q.id}/edit`}
                        className="btn btn-secondary btn-sm"
                      >
                        수정
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(q.id)}
                      >
                        삭제
                      </button>
                    </div>
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

export default SvQuestionList;
