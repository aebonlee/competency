import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/group.css';
import '../../styles/admin.css';

const GROUP_TYPE_LABELS = {
  company: '기업',
  university: '대학',
  institution: '기관',
  other: '기타',
};

const GROUP_TYPES = [
  { value: 'company', label: '기업' },
  { value: 'university', label: '대학' },
  { value: 'institution', label: '기관' },
  { value: 'other', label: '기타' },
];

const GroupMain = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [groupInfo, setGroupInfo] = useState(null);
  const [noGroup, setNoGroup] = useState(false);

  // Group creation state
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    org: '',
    group_type: 'other',
    description: '',
  });
  const [stats, setStats] = useState({
    members: 0,
    completed: 0,
    inProgress: 0,
    total: 0,
    totalCoupons: 0,
    usedCoupons: 0,
    subgroupCount: 0,
    maxMembers: 100,
  });
  const [recentMembers, setRecentMembers] = useState([]);
  const [recentEvals, setRecentEvals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase || !user) {
          setLoading(false);
          return;
        }

        // Fetch group info
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('owner_id', user.id)
          .single();

        if (groupError && groupError.code !== 'PGRST116') {
          throw groupError;
        }

        if (!group) {
          setNoGroup(true);
          setLoading(false);
          return;
        }

        if (group) {
          setGroupInfo(group);

          // Fetch member count
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          // Fetch member user_ids
          const { data: memberRows } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', group.id);

          const memberIds = memberRows?.map(m => m.user_id) || [];

          // Fetch evaluation stats
          let completedCount = 0;
          let inProgressCount = 0;
          let totalEvals = 0;

          if (memberIds.length > 0) {
            const { data: evals } = await supabase
              .from('eval_list')
              .select('id, progress, user_id')
              .in('user_id', memberIds);

            totalEvals = evals?.length || 0;
            completedCount = evals?.filter(e => e.progress >= 100).length || 0;
            inProgressCount = evals?.filter(e => e.progress > 0 && e.progress < 100).length || 0;
          }

          // Fetch coupon stats
          let totalCoupons = 0;
          let usedCoupons = 0;
          const { data: coupons } = await supabase
            .from('coupons')
            .select('id, used')
            .eq('group_id', group.id);

          if (coupons) {
            totalCoupons = coupons.length;
            usedCoupons = coupons.filter(c => c.used).length;
          }

          // Fetch subgroup count
          const { count: subgroupCount } = await supabase
            .from('group_subgroups')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          setStats({
            members: memberCount || 0,
            completed: completedCount,
            inProgress: inProgressCount,
            total: totalEvals,
            totalCoupons,
            usedCoupons,
            subgroupCount: subgroupCount || 0,
            maxMembers: group.max_members || 100,
          });

          // Fetch recent members (5)
          if (memberIds.length > 0) {
            const { data: recentMemberData } = await supabase
              .from('group_members')
              .select(`
                id,
                user_id,
                joined_at,
                profiles:user_id ( name, email )
              `)
              .eq('group_id', group.id)
              .order('joined_at', { ascending: false })
              .limit(5);

            setRecentMembers(recentMemberData || []);
          }

          // Fetch recent evals (5)
          if (memberIds.length > 0) {
            const { data: recentEvalData } = await supabase
              .from('eval_list')
              .select('id, progress, user_id, created_at')
              .in('user_id', memberIds)
              .order('created_at', { ascending: false })
              .limit(5);

            // Attach member names
            if (recentEvalData?.length > 0) {
              const evalUserIds = [...new Set(recentEvalData.map(e => e.user_id))];
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name')
                .in('id', evalUserIds);

              const profileMap = {};
              profiles?.forEach(p => { profileMap[p.id] = p.name; });

              setRecentEvals(
                recentEvalData.map(e => ({
                  ...e,
                  userName: profileMap[e.user_id] || '-',
                }))
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to load group data:', err);
        showToast('그룹 정보를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [user, showToast]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      showToast('그룹명을 입력해 주세요.', 'warning');
      return;
    }
    setCreating(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: createForm.name.trim(),
          org: createForm.org.trim(),
          group_type: createForm.group_type,
          description: createForm.description.trim(),
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      showToast('그룹이 생성되었습니다!', 'success');
      setGroupInfo(data);
      setNoGroup(false);
    } catch (err) {
      console.error('Failed to create group:', err);
      showToast('그룹 생성에 실패했습니다.', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (noGroup && !groupInfo) {
    return (
      <div className="page-wrapper">
        <section className="page-header">
          <div className="container"><h1>그룹 관리</h1></div>
        </section>
        <div className="group-page">
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              새 그룹 만들기
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              기업, 대학, 기관 등의 그룹을 생성하여 멤버를 관리하고 검사 현황을 확인할 수 있습니다.
            </p>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label htmlFor="create_name">그룹명 *</label>
                <input
                  id="create_name"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="예: OO대학교, OO기업"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="create_org">기관/조직명</label>
                <input
                  id="create_org"
                  type="text"
                  value={createForm.org}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, org: e.target.value }))}
                  placeholder="기관 또는 조직명"
                />
              </div>
              <div className="form-group">
                <label htmlFor="create_type">그룹 유형</label>
                <select
                  id="create_type"
                  value={createForm.group_type}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, group_type: e.target.value }))}
                >
                  {GROUP_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="create_desc">설명</label>
                <textarea
                  id="create_desc"
                  rows="3"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="그룹에 대한 간략한 설명"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? '생성 중...' : '그룹 생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!groupInfo) return null;

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const memberUsage = stats.maxMembers > 0 ? Math.round((stats.members / stats.maxMembers) * 100) : 0;
  const couponUsage = stats.totalCoupons > 0 ? Math.round((stats.usedCoupons / stats.totalCoupons) * 100) : 0;

  const getProgressBadge = (progress) => {
    if (progress >= 100) return <span className="badge badge-green">완료</span>;
    if (progress > 0) return <span className="badge badge-yellow">{progress}%</span>;
    return <span className="badge badge-gray">대기</span>;
  };

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container"><h1>그룹 관리</h1></div>
      </section>

      <div className="group-page">

      {/* Group Info Header */}
      <div className="group-info-header">
        {groupInfo.logo_url && (
          <img
            src={groupInfo.logo_url}
            alt="그룹 로고"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <div className="group-info-header-text">
          <h2>
            {groupInfo.name}
            {groupInfo.group_type && groupInfo.group_type !== 'other' && (
              <span className="group-type-badge">
                {GROUP_TYPE_LABELS[groupInfo.group_type] || groupInfo.group_type}
              </span>
            )}
          </h2>
          {groupInfo.org && <p>{groupInfo.org}</p>}
        </div>
      </div>

      {/* KPI Cards (5) */}
      <div className="group-stats-5">
        <div className="dashboard-card blue">
          <div className="dashboard-card-label">총 멤버</div>
          <div className="dashboard-card-value">{stats.members}</div>
          <div className="dashboard-card-sub">max 대비 {memberUsage}%</div>
        </div>
        <div className="dashboard-card green">
          <div className="dashboard-card-label">검사 완료</div>
          <div className="dashboard-card-value">{stats.completed}</div>
          <div className="dashboard-card-sub">완료율 {completionRate}%</div>
        </div>
        <div className="dashboard-card orange">
          <div className="dashboard-card-label">검사 진행중</div>
          <div className="dashboard-card-value">{stats.inProgress}</div>
          <div className="dashboard-card-sub">총 {stats.total}건</div>
        </div>
        <div className="dashboard-card red">
          <div className="dashboard-card-label">쿠폰 현황</div>
          <div className="dashboard-card-value">{stats.totalCoupons}</div>
          <div className="dashboard-card-sub">사용률 {couponUsage}%</div>
        </div>
        <div className="dashboard-card blue">
          <div className="dashboard-card-label">서브그룹</div>
          <div className="dashboard-card-value">{stats.subgroupCount}</div>
          <div className="dashboard-card-sub">&nbsp;</div>
        </div>
      </div>

      {/* Recent Activity (2 columns) */}
      <div className="dashboard-section-title">최근 활동</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        {/* Recent Members */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>최근 가입 멤버</h3>
            <Link to="/group/users" className="dashboard-view-all">전체 보기</Link>
          </div>
          {recentMembers.length === 0 ? (
            <div className="dashboard-empty">최근 가입 멤버가 없습니다.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentMembers.map((m) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <Link
                    to={`/group/users/${m.user_id}/info`}
                    style={{ fontSize: '14px', color: 'var(--primary-blue)', textDecoration: 'none' }}
                  >
                    {m.profiles?.name || m.profiles?.email || '-'}
                  </Link>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                    {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Evals */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>최근 검사</h3>
            <Link to="/group/evals" className="dashboard-view-all">전체 보기</Link>
          </div>
          {recentEvals.length === 0 ? (
            <div className="dashboard-empty">최근 검사가 없습니다.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentEvals.map((e) => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '14px' }}>{e.userName}</span>
                  {getProgressBadge(e.progress)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions (3 groups) */}
      <div className="dashboard-section-title">빠른 이동</div>
      <div className="dashboard-quick-actions" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="quick-action-group">
          <div className="quick-action-group-label">멤버</div>
          <div className="quick-action-links">
            <Link to="/group/users">멤버 목록</Link>
            <Link to="/group/invite">초대 관리</Link>
            <Link to="/group/org">조직도</Link>
          </div>
        </div>
        <div className="quick-action-group">
          <div className="quick-action-group-label">검사/통계</div>
          <div className="quick-action-links">
            <Link to="/group/evals">검사 현황</Link>
            <Link to="/group/statistics">통계</Link>
          </div>
        </div>
        <div className="quick-action-group">
          <div className="quick-action-group-label">관리</div>
          <div className="quick-action-links">
            <Link to="/group/manager">서브관리자</Link>
            <Link to="/group/coupons">쿠폰 관리</Link>
            <Link to="/group/settings">그룹 설정</Link>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
};

export default GroupMain;
