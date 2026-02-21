import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const QuestionForm = () => {
  const { questionId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isEditing = !!questionId;

  const [form, setForm] = useState({
    q_text: '',
    category: '',
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) return;

    const fetchQuestion = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('id', questionId)
          .single();

        if (error) throw error;

        setForm({
          q_text: data.q_text || '',
          category: data.category || '',
        });
      } catch (err) {
        console.error('Failed to load question:', err);
        showToast('문항 정보를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId, isEditing, showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.q_text.trim()) {
      showToast('문항 내용을 입력해 주세요.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        showToast('서비스에 연결할 수 없습니다.', 'error');
        return;
      }

      const payload = {
        q_text: form.q_text.trim(),
        category: form.category.trim() || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('questions')
          .update(payload)
          .eq('id', questionId);

        if (error) throw error;
        showToast('문항이 수정되었습니다.', 'success');
      } else {
        const { error } = await supabase
          .from('questions')
          .insert(payload);

        if (error) throw error;
        showToast('문항이 등록되었습니다.', 'success');
      }

      navigate('/admin/questions');
    } catch (err) {
      console.error('Failed to save question:', err);
      showToast('문항 저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
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
        <div className="container"><h1>{isEditing ? '문항 수정' : '문항 추가'}</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <Link to="/admin/questions" className="btn btn-secondary btn-sm">목록으로</Link>
      </div>

      <div className="card" style={{ maxWidth: '700px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="q_text">문항 내용 *</label>
            <textarea
              id="q_text"
              name="q_text"
              rows="5"
              value={form.q_text}
              onChange={handleChange}
              placeholder="문항 내용을 입력하세요"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">카테고리</label>
            <input
              id="category"
              name="category"
              type="text"
              value={form.category}
              onChange={handleChange}
              placeholder="카테고리를 입력하세요 (예: 비판적사고, 창의력)"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
            <Link to="/admin/questions" className="btn btn-secondary">취소</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '저장 중...' : isEditing ? '수정 완료' : '문항 등록'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default QuestionForm;
