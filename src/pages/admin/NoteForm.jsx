import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const NoteForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState({
    receiver_id: searchParams.get('user_id') || '',
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) return;

    const fetchNote = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setForm({
          receiver_id: data.receiver_id || '',
          title: data.title || '',
          content: data.content || '',
        });
      } catch (err) {
        console.error('Failed to load note:', err);
        showToast('메시지 정보를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id, isEditing, showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.receiver_id.trim()) {
      showToast('받는 사람을 입력해 주세요.', 'warning');
      return;
    }

    if (!form.title.trim()) {
      showToast('제목을 입력해 주세요.', 'warning');
      return;
    }

    if (!form.content.trim()) {
      showToast('내용을 입력해 주세요.', 'warning');
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
        sender_id: user?.id || null,
        receiver_id: form.receiver_id.trim(),
        title: form.title.trim(),
        content: form.content.trim(),
        note_type: 'message',
        is_read: false,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('notes')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
        showToast('메시지가 수정되었습니다.', 'success');
      } else {
        const { error } = await supabase
          .from('notes')
          .insert(payload);

        if (error) throw error;
        showToast('메시지가 전송되었습니다.', 'success');
      }

      navigate('/admin/notes');
    } catch (err) {
      console.error('Failed to save note:', err);
      showToast('메시지 저장에 실패했습니다.', 'error');
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
        <div className="container"><h1>{isEditing ? '메시지 수정' : '메시지 작성'}</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/admin/notes" className="btn btn-secondary btn-sm">목록으로</Link>
          <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '700px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="receiver_id">받는 사람 (User ID) *</label>
            <input
              id="receiver_id"
              name="receiver_id"
              type="text"
              value={form.receiver_id}
              onChange={handleChange}
              placeholder="받는 사람의 User ID를 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="title">제목 *</label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">내용 *</label>
            <textarea
              id="content"
              name="content"
              rows="8"
              value={form.content}
              onChange={handleChange}
              placeholder="내용을 입력하세요"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
            <Link to="/admin/notes" className="btn btn-secondary">취소</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '저장 중...' : isEditing ? '수정 완료' : '메시지 전송'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default NoteForm;
