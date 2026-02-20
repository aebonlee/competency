import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/group.css';
import '../../styles/base.css';

const GroupInvitation = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [groupId, setGroupId] = useState(null);
  const [email, setEmail] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !user) {
          setLoading(false);
          return;
        }

        // Get group
        const { data: group } = await supabase
          .from('groups')
          .select('id')
          .eq('manager_id', user.id)
          .single();

        if (!group) {
          setLoading(false);
          return;
        }

        setGroupId(group.id);

        // Get pending invitations
        const { data: invData, error } = await supabase
          .from('group_invitations')
          .select('*')
          .eq('group_id', group.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setInvitations(invData || []);
      } catch (err) {
        console.error('Failed to load invitations:', err);
        showToast('초대 목록을 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, showToast]);

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!email.trim() || !groupId) return;

    setSending(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        showToast('서비스에 연결할 수 없습니다.', 'error');
        return;
      }

      // Check if already invited
      const existing = invitations.find(
        (inv) => inv.email === email.trim() && inv.status === 'pending'
      );
      if (existing) {
        showToast('이미 초대된 이메일입니다.', 'warning');
        setSending(false);
        return;
      }

      const { data, error } = await supabase
        .from('group_invitations')
        .insert({
          group_id: groupId,
          email: email.trim(),
          invited_by: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setInvitations((prev) => [data, ...prev]);
      setEmail('');
      showToast('초대가 발송되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to send invitation:', err);
      showToast('초대 발송에 실패했습니다.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('group_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId ? { ...inv, status: 'cancelled' } : inv
        )
      );
      showToast('초대가 취소되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to cancel invitation:', err);
      showToast('초대 취소에 실패했습니다.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-yellow">대기중</span>;
      case 'accepted':
        return <span className="badge badge-green">수락</span>;
      case 'cancelled':
        return <span className="badge badge-gray">취소</span>;
      case 'expired':
        return <span className="badge badge-red">만료</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="group-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="group-page">
      <div className="group-header">
        <h1>초대 관리</h1>
        <Link to="/group" className="btn btn-secondary btn-sm">돌아가기</Link>
      </div>

      {/* Invitation Form */}
      <div className="card mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
          새 초대 발송
        </h3>
        <form onSubmit={handleSendInvitation} className="invitation-form">
          <div className="form-group">
            <label htmlFor="invite-email">이메일 주소</label>
            <input
              id="invite-email"
              type="email"
              placeholder="초대할 이메일 주소를 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={sending || !email.trim()}>
            {sending ? '발송 중...' : '초대 발송'}
          </button>
        </form>
      </div>

      {/* Invitation List */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
          초대 목록
        </h3>
        {invitations.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-light)' }}>
            발송된 초대가 없습니다.
          </div>
        ) : (
          <div className="invitation-list">
            {invitations.map((inv) => (
              <div key={inv.id} className="invitation-item">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{inv.email}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                    {new Date(inv.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {getStatusBadge(inv.status)}
                  {inv.status === 'pending' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancelInvitation(inv.id)}
                    >
                      취소
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupInvitation;
