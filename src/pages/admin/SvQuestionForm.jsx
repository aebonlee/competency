import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const SvQuestionForm = () => {
  const { id } = useParams();
  const { user: _user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState({
    target_type: 0,
    group_name: '',
    content: '',
    start_date: '',
    end_date: '',
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
          .from('survey_questions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setForm({
          target_type: data.target_type ?? 0,
          group_name: data.group_name || '',
          content: data.content || '',
          start_date: data.start_date || '',
          end_date: data.end_date || '',
        });
      } catch (err) {
        console.error('Failed to load survey question:', err);
        showToast('질문 정보를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id, isEditing, showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'target_type' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.content.trim()) {
      showToast('질문 내용을 입력해 주세요.', 'warning');
      return;
    }

    if (!form.start_date || !form.end_date) {
      showToast('시작일과 종료일을 입력해 주세요.', 'warning');
      return;
    }

    if (form.target_type === 2 && !form.group_name.trim()) {
      showToast('그룹명을 입력해 주세요.', 'warning');
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
        content: form.content.trim(),
        target_type: form.target_type,
        group_name: form.target_type === 2 ? form.group_name.trim() : null,
        start_date: form.start_date,
        end_date: form.end_date,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('survey_questions')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
        showToast('질문이 수정되었습니다.', 'success');
      } else {
        const { error } = await supabase
          .from('survey_questions')
          .insert(payload);

        if (error) throw error;
        showToast('질문이 등록되었습니다.', 'success');
      }

      navigate('/admin/survey-questions');
    } catch (err) {
      console.error('Failed to save survey question:', err);
      showToast('질문 저장에 실패했습니다.', 'error');
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
        <div className="container"><h1>{isEditing ? '설문 질문 수정' : '설문 질문 추가'}</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <Link to="/admin/survey-questions" className="btn btn-secondary btn-sm">목록으로</Link>
      </div>

      <div className="card" style={{ maxWidth: '700px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="target_type">대상 *</label>
            <select
              id="target_type"
              name="target_type"
              value={form.target_type}
              onChange={handleChange}
            >
              <option value={0}>전체회원</option>
              <option value={1}>비그룹회원</option>
              <option value={2}>그룹회원</option>
            </select>
          </div>

          {form.target_type === 2 && (
            <div className="form-group">
              <label htmlFor="group_name">그룹명 *</label>
              <input
                id="group_name"
                name="group_name"
                type="text"
                value={form.group_name}
                onChange={handleChange}
                placeholder="그룹명을 입력하세요"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="content">질문 내용 *</label>
            <textarea
              id="content"
              name="content"
              rows="5"
              value={form.content}
              onChange={handleChange}
              placeholder="질문 내용을 입력하세요"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_date">시작일 *</label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="end_date">종료일 *</label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
            <Link to="/admin/survey-questions" className="btn btn-secondary">취소</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '저장 중...' : isEditing ? '수정 완료' : '질문 등록'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default SvQuestionForm;
