import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const NoteList = () => {
  const { user: _user } = useAuth();
  const { showToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('notes')
          .select(`
            id,
            sender_id,
            receiver_id,
            title,
            content,
            is_read,
            note_type,
            created_at,
            sender:sender_id (
              name,
              email
            ),
            receiver:receiver_id (
              name,
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setNotes(
          (data || []).map((note) => ({
            ...note,
            senderName: note.sender?.name || note.sender?.email || '-',
            receiverName: note.receiver?.name || note.receiver?.email || '-',
          }))
        );
      } catch (err) {
        console.error('Failed to load notes:', err);
        showToast('메시지 목록을 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [showToast]);

  const handleDelete = async (noteId) => {
    if (!window.confirm('이 메시지를 삭제하시겠습니까?')) return;

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      showToast('메시지가 삭제되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to delete note:', err);
      showToast('메시지 삭제에 실패했습니다.', 'error');
    }
  };

  const filteredNotes = notes.filter((note) => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !note.is_read;
    if (filterType === 'notification') return note.note_type === 'notification';
    if (filterType === 'message') return note.note_type === 'message' || !note.note_type;
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getNoteTypeBadge = (noteType) => {
    switch (noteType) {
      case 'notification':
        return <span className="badge badge-blue">알림</span>;
      case 'system':
        return <span className="badge badge-red">시스템</span>;
      case 'message':
      default:
        return <span className="badge badge-gray">메시지</span>;
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
        <div className="container"><h1>메시지/알림 관리</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('all')}
          >
            전체 ({notes.length})
          </button>
          <button
            className={`btn btn-sm ${filterType === 'unread' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('unread')}
          >
            읽지 않음 ({notes.filter((n) => !n.is_read).length})
          </button>
          <button
            className={`btn btn-sm ${filterType === 'notification' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('notification')}
          >
            알림
          </button>
          <button
            className={`btn btn-sm ${filterType === 'message' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterType('message')}
          >
            메시지
          </button>
        </div>
        <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>
          {filteredNotes.length}건
        </span>
      </div>

      {/* Notes Table */}
      <div className="admin-table-wrapper">
        {filteredNotes.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
            {filterType !== 'all' ? '해당 조건의 메시지가 없습니다.' : '등록된 메시지가 없습니다.'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>번호</th>
                <th style={{ width: '80px' }}>유형</th>
                <th>제목</th>
                <th style={{ width: '100px' }}>보낸 사람</th>
                <th style={{ width: '100px' }}>받는 사람</th>
                <th style={{ width: '60px' }}>읽음</th>
                <th style={{ width: '100px' }}>날짜</th>
                <th style={{ width: '60px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.map((note, idx) => (
                <tr key={note.id} style={{ background: note.is_read ? 'transparent' : 'var(--primary-blue-light)' }}>
                  <td>{idx + 1}</td>
                  <td>{getNoteTypeBadge(note.note_type)}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: note.is_read ? 400 : 600 }}>
                      {note.title || '(제목 없음)'}
                    </span>
                  </td>
                  <td>{note.senderName}</td>
                  <td>{note.receiverName}</td>
                  <td>
                    {note.is_read ? (
                      <span className="badge badge-green">읽음</span>
                    ) : (
                      <span className="badge badge-yellow">안 읽음</span>
                    )}
                  </td>
                  <td>{formatDate(note.created_at)}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(note.id)}
                    >
                      삭제
                    </button>
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

export default NoteList;
