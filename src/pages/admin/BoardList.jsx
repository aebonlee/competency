import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const BoardList = () => {
  const { user: _user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('board_posts')
          .select(`
            id,
            title,
            content,
            author_id,
            views,
            created_at,
            updated_at,
            profiles:author_id (
              name,
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPosts(
          (data || []).map((post) => ({
            ...post,
            authorName: post.profiles?.name || post.profiles?.email || '-',
          }))
        );
      } catch (err) {
        console.error('Failed to load board posts:', err);
        showToast('게시판 목록을 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [showToast]);

  const handleDelete = async (postId) => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('board_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('게시글이 삭제되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to delete post:', err);
      showToast('게시글 삭제에 실패했습니다.', 'error');
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
        <div className="container"><h1>게시판 관리</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
      </div>

      <div className="admin-toolbar">
        <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>
          총 {posts.length}개 게시글
        </span>
        <Link to="/admin/board/new" className="btn btn-primary btn-sm">글쓰기</Link>
      </div>

      <div className="admin-table-wrapper">
        {posts.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
            등록된 게시글이 없습니다.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>번호</th>
                <th>제목</th>
                <th style={{ width: '120px' }}>작성자</th>
                <th style={{ width: '100px' }}>작성일</th>
                <th style={{ width: '80px' }}>조회수</th>
                <th style={{ width: '80px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, idx) => (
                <tr key={post.id}>
                  <td>{idx + 1}</td>
                  <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Link to={`/admin/board/${post.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {post.title || '(제목 없음)'}
                    </Link>
                  </td>
                  <td>{post.authorName}</td>
                  <td>{formatDate(post.created_at)}</td>
                  <td>{post.views ?? 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Link
                        to={`/admin/board/${post.id}/edit`}
                        className="btn btn-secondary btn-sm"
                      >
                        수정
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(post.id)}
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

export default BoardList;
