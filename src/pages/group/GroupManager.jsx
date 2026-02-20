import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/group.css';
import '../../styles/base.css';

const GroupManager = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [groupId, setGroupId] = useState(null);
  const [managers, setManagers] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

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

        // Get sub-group managers
        const { data: managerData, error: mgrError } = await supabase
          .from('group_managers')
          .select(`
            id,
            user_id,
            role,
            assigned_at,
            profiles:user_id (
              name,
              email
            )
          `)
          .eq('group_id', group.id)
          .order('assigned_at', { ascending: false });

        if (mgrError && mgrError.code !== '42P01') throw mgrError;
        setManagers(
          (managerData || []).map((mgr) => ({
            ...mgr,
            name: mgr.profiles?.name || '-',
            email: mgr.profiles?.email || '-',
          }))
        );

        // Get group members (non-managers) for assignment
        const { data: memberData } = await supabase
          .from('group_members')
          .select(`
            user_id,
            profiles:user_id (
              name,
              email
            )
          `)
          .eq('group_id', group.id);

        const managerIds = (managerData || []).map((m) => m.user_id);
        const nonManagers = (memberData || [])
          .filter((m) => !managerIds.includes(m.user_id))
          .map((m) => ({
            user_id: m.user_id,
            name: m.profiles?.name || '-',
            email: m.profiles?.email || '-',
          }));

        setMembers(nonManagers);
      } catch (err) {
        console.error('Failed to load manager data:', err);
        showToast('관리자 정보를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, showToast]);

  const handleAssignManager = async () => {
    if (!selectedUserId || !groupId) return;

    setAssigning(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('group_managers')
        .insert({
          group_id: groupId,
          user_id: selectedUserId,
          role: 'sub_manager',
          assigned_at: new Date().toISOString(),
        })
        .select(`
          id,
          user_id,
          role,
          assigned_at,
          profiles:user_id (
            name,
            email
          )
        `)
        .single();

      if (error) throw error;

      const newManager = {
        ...data,
        name: data.profiles?.name || '-',
        email: data.profiles?.email || '-',
      };

      setManagers((prev) => [newManager, ...prev]);
      setMembers((prev) => prev.filter((m) => m.user_id !== selectedUserId));
      setSelectedUserId('');

      // Update user's usertype to sub-group manager (3)
      await supabase
        .from('profiles')
        .update({ usertype: 3 })
        .eq('id', selectedUserId);

      showToast('서브 관리자가 지정되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to assign manager:', err);
      showToast('관리자 지정에 실패했습니다.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveManager = async (managerId, managerUserId) => {
    if (!window.confirm('이 관리자를 해제하시겠습니까?')) return;

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('group_managers')
        .delete()
        .eq('id', managerId);

      if (error) throw error;

      const removed = managers.find((m) => m.id === managerId);
      setManagers((prev) => prev.filter((m) => m.id !== managerId));

      if (removed) {
        setMembers((prev) => [
          ...prev,
          { user_id: removed.user_id, name: removed.name, email: removed.email },
        ]);
      }

      // Revert usertype to group member (1)
      await supabase
        .from('profiles')
        .update({ usertype: 1 })
        .eq('id', managerUserId);

      showToast('관리자가 해제되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to remove manager:', err);
      showToast('관리자 해제에 실패했습니다.', 'error');
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
        <h1>서브 관리자 관리</h1>
        <Link to="/group" className="btn btn-secondary btn-sm">돌아가기</Link>
      </div>

      {/* Assign Manager Form */}
      <div className="card mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
          관리자 지정
        </h3>
        {members.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'var(--text-light)' }}>
            지정 가능한 멤버가 없습니다.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="select-member">멤버 선택</label>
              <select
                id="select-member"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">멤버를 선택하세요</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleAssignManager}
              disabled={!selectedUserId || assigning}
            >
              {assigning ? '지정 중...' : '관리자 지정'}
            </button>
          </div>
        )}
      </div>

      {/* Manager List */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
          서브 관리자 목록
        </h3>
        {managers.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-light)' }}>
            등록된 서브 관리자가 없습니다.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>이름</th>
                <th>이메일</th>
                <th>역할</th>
                <th>지정일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((mgr, idx) => (
                <tr key={mgr.id}>
                  <td>{idx + 1}</td>
                  <td>{mgr.name}</td>
                  <td>{mgr.email}</td>
                  <td>
                    <span className="badge badge-blue">
                      {mgr.role === 'sub_manager' ? '서브 관리자' : mgr.role}
                    </span>
                  </td>
                  <td>
                    {mgr.assigned_at
                      ? new Date(mgr.assigned_at).toLocaleDateString('ko-KR')
                      : '-'}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveManager(mgr.id, mgr.user_id)}
                    >
                      해제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GroupManager;
