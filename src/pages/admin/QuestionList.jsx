import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const QuestionList = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .order('id', { ascending: true });

        if (error) throw error;

        setQuestions(data || []);

        // Extract unique categories
        const uniqueCategories = [...new Set((data || []).map((q) => q.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error('Failed to load questions:', err);
        showToast('문항 목록을 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [showToast]);

  const handleDelete = async (questionId) => {
    if (!window.confirm('이 문항을 삭제하시겠습니까?')) return;

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      showToast('문항이 삭제되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to delete question:', err);
      showToast('문항 삭제에 실패했습니다.', 'error');
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = !searchTerm || (q.q_text && q.q_text.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !filterCategory || q.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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
        <div className="container"><h1>문항 관리</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/admin/questions/new" className="btn btn-primary btn-sm">문항 추가</Link>
          <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <input
            type="text"
            placeholder="문항 내용 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '8px 14px',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
            }}
          >
            <option value="">전체 카테고리</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>
          총 {filteredQuestions.length}개
        </span>
      </div>

      {/* Question Table */}
      <div className="admin-table-wrapper">
        {filteredQuestions.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
            {searchTerm || filterCategory ? '검색 결과가 없습니다.' : '등록된 문항이 없습니다.'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>문항 내용</th>
                <th style={{ width: '120px' }}>카테고리</th>
                <th style={{ width: '140px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q) => (
                <tr key={q.id}>
                  <td>{q.id}</td>
                  <td style={{ maxWidth: '500px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.q_text || '-'}
                  </td>
                  <td>
                    {q.category ? (
                      <span className="badge badge-blue">{q.category}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link
                        to={`/admin/questions/${q.id}/edit`}
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

export default QuestionList;
