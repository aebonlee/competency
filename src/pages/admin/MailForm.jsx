import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const MailForm = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preEmail = searchParams.get('email') || '';
  const preName = searchParams.get('name') || '';

  const [email, setEmail] = useState(preEmail);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast('받는 사람 이메일을 입력해주세요.', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('제목을 입력해주세요.', 'error');
      return;
    }
    if (!content.trim()) {
      showToast('내용을 입력해주세요.', 'error');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('notes')
        .insert({
          sender_id: user?.id || null,
          title: title.trim(),
          content: content.trim(),
          note_type: 'email',
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      showToast('메일이 전송되었습니다.', 'success');
      navigate(-1);
    } catch (err) {
      console.error('Failed to send mail:', err);
      showToast('메일 전송에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container"><h1>메일 보내기</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <button className="btn btn-secondary btn-sm" onClick={handleCancel}>뒤로가기</button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>받는 사람 이메일</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소를 입력하세요"
            />
            {preName && (
              <span style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                수신자: {preName}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="메일 제목을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label>내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="메일 내용을 입력하세요"
              rows={10}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '전송 중...' : '전송'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default MailForm;
