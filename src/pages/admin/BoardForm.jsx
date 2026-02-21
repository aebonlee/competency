import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const BoardForm = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    content: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      let imageUrl = null;

      // Upload image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('board-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('board-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        image_url: imageUrl,
        author_id: user?.id || null,
        views: 0,
      };

      const { error } = await supabase
        .from('board_posts')
        .insert(payload);

      if (error) throw error;

      showToast('게시글이 등록되었습니다.', 'success');
      navigate('/admin/board');
    } catch (err) {
      console.error('Failed to save board post:', err);
      showToast('게시글 저장에 실패했습니다.', 'error');
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
        <div className="container"><h1>게시글 작성</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/admin/board" className="btn btn-secondary btn-sm">목록으로</Link>
          <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '700px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">제목 *</label>
            <input
              id="title"
              name="title"
              type="text"
              maxLength={100}
              value={form.title}
              onChange={handleChange}
              placeholder="제목을 입력하세요 (최대 100자)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">내용 *</label>
            <textarea
              id="content"
              name="content"
              rows="10"
              value={form.content}
              onChange={handleChange}
              placeholder="내용을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">이미지 (선택)</label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            {imageFile && (
              <span style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px' }}>
                선택된 파일: {imageFile.name}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
            <Link to="/admin/board" className="btn btn-secondary">취소</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '저장 중...' : '게시글 등록'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default BoardForm;
