import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const BoardView = () => {
  const { id } = useParams();
  const { user: _user } = useAuth();
  const { showToast } = useToast();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !id) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('board_posts')
          .select(`
            id,
            title,
            content,
            image_url,
            author_id,
            views,
            created_at,
            profiles:author_id (
              name,
              email
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        setPost({
          ...data,
          authorName: data.profiles?.name || data.profiles?.email || '-',
        });

        // 조회수 증가 (fire-and-forget)
        supabase
          .from('board_posts')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', id);
      } catch (err) {
        console.error('Failed to load board post:', err);
        showToast('게시글을 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, showToast]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
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

  if (!post) {
    return (
      <div className="page-wrapper">
        <section className="page-header">
          <div className="container"><h1>게시글 상세</h1></div>
        </section>

        <div className="admin-page">
        <div className="admin-header-bar">
          <Link to="/admin/board" className="btn btn-secondary btn-sm">목록</Link>
        </div>
        <div className="card text-center" style={{ padding: '60px 20px' }}>
          <p style={{ fontSize: '16px', color: 'var(--text-light)' }}>
            게시글을 찾을 수 없습니다.
          </p>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container"><h1>게시글 상세</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to={`/admin/board/${post.id}/edit`} className="btn btn-primary btn-sm">수정</Link>
          <Link to="/admin/board" className="btn btn-secondary btn-sm">목록</Link>
          <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        {/* Title */}
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>
          {post.title || '(제목 없음)'}
        </h2>

        {/* Meta Info */}
        <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--text-light)', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-medium)' }}>
          <div>
            <span style={{ marginRight: '4px' }}>작성자:</span>
            <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{post.authorName}</span>
          </div>
          <div>
            <span style={{ marginRight: '4px' }}>작성일:</span>
            <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{formatDate(post.created_at)}</span>
          </div>
          <div>
            <span style={{ marginRight: '4px' }}>조회수:</span>
            <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{post.views ?? 0}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ fontSize: '15px', lineHeight: '1.8', whiteSpace: 'pre-wrap', marginBottom: '24px' }}>
          {post.content || ''}
        </div>

        {/* Image */}
        {post.image_url && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '8px' }}>첨부 이미지</p>
            <img
              src={post.image_url}
              alt="첨부 이미지"
              style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}
            />
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default BoardView;
