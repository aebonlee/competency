import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/group.css';
import '../../styles/base.css';

const GroupUserList = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subgroups, setSubgroups] = useState([]);
  const [selectedSubgroup, setSelectedSubgroup] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !user) {
          setLoading(false);
          return;
        }

        // Get group for current manager
        const { data: group } = await supabase
          .from('groups')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (!group) {
          setLoading(false);
          return;
        }

        // Fetch subgroups
        const { data: subs } = await supabase
          .from('group_subgroups')
          .select('id, name')
          .eq('group_id', group.id)
          .order('sort_order', { ascending: true });

        setSubgroups(subs || []);

        // Get group members with profiles and latest eval info
        const { data: memberData, error } = await supabase
          .from('group_members')
          .select(`
            id,
            user_id,
            joined_at,
            profiles:user_id (
              name,
              email,
              phone,
              subgrp
            )
          `)
          .eq('group_id', group.id)
          .order('joined_at', { ascending: false });

        if (error) throw error;

        // For each member, fetch their latest eval status
        const membersWithEval = await Promise.all(
          (memberData || []).map(async (member) => {
            const { data: evals } = await supabase
              .from('eval_list')
              .select('id, progress, end_date')
              .eq('user_id', member.user_id)
              .order('created_at', { ascending: false })
              .limit(1);

            const latestEval = evals?.[0] || null;
            let evalStatus = '미실시';
            if (latestEval) {
              if (latestEval.progress >= 100) {
                evalStatus = '완료';
              } else if (latestEval.progress > 0) {
                evalStatus = '진행중';
              } else {
                evalStatus = '대기';
              }
            }

            return {
              ...member,
              name: member.profiles?.name || '-',
              email: member.profiles?.email || '-',
              phone: member.profiles?.phone || '-',
              subgrp: member.profiles?.subgrp || '',
              evalStatus,
              latestEvalId: latestEval?.id || null,
            };
          })
        );

        setMembers(membersWithEval);
      } catch (err) {
        console.error('Failed to load group members:', err);
        showToast('멤버 목록을 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [user, showToast]);

  const filteredMembers = members.filter((m) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      m.phone.includes(term);

    const matchesSubgroup = !selectedSubgroup ||
      m.subgrp === selectedSubgroup;

    return matchesSearch && matchesSubgroup;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case '완료':
        return <span className="badge badge-green">완료</span>;
      case '진행중':
        return <span className="badge badge-yellow">진행중</span>;
      case '대기':
        return <span className="badge badge-blue">대기</span>;
      default:
        return <span className="badge badge-gray">미실시</span>;
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
        <div className="container"><h1>멤버 관리</h1></div>
      </section>

      <div className="group-page">
      <div className="group-header-bar">
        <Link to="/group" className="btn btn-secondary btn-sm">돌아가기</Link>
      </div>

      {/* Search + Subgroup Filter */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <input
            type="text"
            placeholder="이름, 이메일, 전화번호 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {subgroups.length > 0 && (
            <select
              value={selectedSubgroup}
              onChange={(e) => setSelectedSubgroup(e.target.value)}
              style={{
                padding: '8px 14px',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
              }}
            >
              <option value="">전체 서브그룹</option>
              {subgroups.map((sg) => (
                <option key={sg.id} value={sg.name}>{sg.name}</option>
              ))}
            </select>
          )}
        </div>
        <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>
          총 {filteredMembers.length}명
        </span>
      </div>

      {/* Member Table */}
      <div className="group-user-list">
        {filteredMembers.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
            {searchTerm || selectedSubgroup ? '검색 결과가 없습니다.' : '등록된 멤버가 없습니다.'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>이름</th>
                <th>이메일</th>
                <th>전화번호</th>
                {subgroups.length > 0 && <th>서브그룹</th>}
                <th>검사 상태</th>
                <th>정보</th>
                <th>검사내역</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, idx) => (
                <tr key={member.id}>
                  <td>{idx + 1}</td>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.phone}</td>
                  {subgroups.length > 0 && (
                    <td>
                      <span style={{ fontSize: '13px', color: member.subgrp ? 'var(--text-primary)' : 'var(--text-light)' }}>
                        {member.subgrp || '-'}
                      </span>
                    </td>
                  )}
                  <td>{getStatusBadge(member.evalStatus)}</td>
                  <td>
                    <Link
                      to={`/group/users/${member.user_id}/info`}
                      className="btn btn-secondary btn-sm"
                    >
                      정보
                    </Link>
                  </td>
                  <td>
                    <Link
                      to={`/group/users/${member.user_id}/evals`}
                      className="btn btn-secondary btn-sm"
                    >
                      내역
                    </Link>
                  </td>
                  <td>
                    {member.evalStatus === '완료' && member.latestEvalId ? (
                      <Link
                        to={`/group/users/${member.user_id}/result`}
                        className="btn btn-primary btn-sm"
                      >
                        결과 보기
                      </Link>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled
                        style={{ opacity: 0.5, cursor: 'not-allowed' }}
                      >
                        결과 보기
                      </button>
                    )}
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

export default GroupUserList;
