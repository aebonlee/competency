import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import { exportToCSV } from '../../utils/export';
import '../../styles/admin.css';
import '../../styles/base.css';

const generateCouponCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const CouponList = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(1);
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState([]);
  const [distributeEmail, setDistributeEmail] = useState('');
  const [distributeGroupId, setDistributeGroupId] = useState('');
  const [distributing, setDistributing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setLoading(false);
          return;
        }

        // Fetch all coupons
        const { data: couponData, error: couponError } = await supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false });

        if (couponError) throw couponError;
        setCoupons(couponData || []);

        // Fetch groups for assignment
        const { data: groupData } = await supabase
          .from('groups')
          .select('id, name')
          .order('name', { ascending: true });

        setGroups(groupData || []);
      } catch (err) {
        console.error('Failed to load coupons:', err);
        showToast('쿠폰 목록을 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  const handleGenerate = async () => {
    const count = Math.min(Math.max(1, Number(generateCount)), 100);

    setGenerating(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const newCoupons = Array.from({ length: count }, () => ({
        code: generateCouponCode(),
        is_used: false,
        created_by: user.id,
        group_id: groupId || null,
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('coupons')
        .insert(newCoupons)
        .select();

      if (error) throw error;

      setCoupons((prev) => [...(data || []), ...prev]);
      showToast(`${count}개의 쿠폰이 생성되었습니다.`, 'success');
    } catch (err) {
      console.error('Failed to generate coupons:', err);
      showToast('쿠폰 생성에 실패했습니다.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDistribute = async () => {
    if (!distributeEmail.trim() && !distributeGroupId) {
      showToast('이메일 또는 그룹을 선택해 주세요.', 'warning');
      return;
    }

    setDistributing(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const available = coupons.filter((c) => !c.is_used && !c.assigned_user);
      if (available.length === 0) {
        showToast('배포 가능한 쿠폰이 없습니다.', 'warning');
        return;
      }

      if (distributeEmail.trim()) {
        const coupon = available[0];
        const { error } = await supabase
          .from('coupons')
          .update({ assigned_user: distributeEmail.trim() })
          .eq('id', coupon.id);

        if (error) throw error;

        setCoupons((prev) =>
          prev.map((c) =>
            c.id === coupon.id ? { ...c, assigned_user: distributeEmail.trim() } : c
          )
        );
        showToast(`쿠폰이 ${distributeEmail.trim()}에게 배포되었습니다.`, 'success');
        setDistributeEmail('');
      } else if (distributeGroupId) {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id, user_profiles:user_id (email)')
          .eq('group_id', distributeGroupId);

        if (!members || members.length === 0) {
          showToast('그룹에 멤버가 없습니다.', 'warning');
          return;
        }

        const needed = Math.min(members.length, available.length);
        const updates = [];
        for (let i = 0; i < needed; i++) {
          const memberEmail = members[i].user_profiles?.email || members[i].user_id;
          updates.push(
            supabase
              .from('coupons')
              .update({ assigned_user: memberEmail })
              .eq('id', available[i].id)
          );
        }

        await Promise.all(updates);

        const { data: refreshed } = await supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false });
        setCoupons(refreshed || []);

        showToast(`${needed}명에게 쿠폰이 배포되었습니다.`, 'success');
        setDistributeGroupId('');
      }
    } catch (err) {
      console.error('Failed to distribute coupons:', err);
      showToast('쿠폰 배포에 실패했습니다.', 'error');
    } finally {
      setDistributing(false);
    }
  };

  const totalCoupons = coupons.length;
  const usedCoupons = coupons.filter((c) => c.is_used).length;
  const availableCoupons = coupons.filter((c) => !c.is_used).length;

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
        <div className="container"><h1>쿠폰 관리</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            exportToCSV(coupons, '쿠폰목록', [
              { key: 'code', label: '쿠폰코드' },
              { key: 'is_used', label: '사용여부' },
              { key: 'group_id', label: '그룹ID' },
              { key: 'used_by', label: '사용자' },
              { key: 'created_at', label: '생성일' },
              { key: 'used_at', label: '사용일' },
            ]);
          }}
          disabled={coupons.length === 0}
        >
          CSV 다운로드
        </button>
      </div>

      {/* Stats */}
      <div className="dashboard-stats" style={{ marginBottom: '24px' }}>
        <div className="dashboard-card blue">
          <div className="dashboard-card-label">전체 쿠폰</div>
          <div className="dashboard-card-value">{totalCoupons}</div>
        </div>
        <div className="dashboard-card green">
          <div className="dashboard-card-label">사용 가능</div>
          <div className="dashboard-card-value">{availableCoupons}</div>
        </div>
        <div className="dashboard-card red">
          <div className="dashboard-card-label">사용 완료</div>
          <div className="dashboard-card-value">{usedCoupons}</div>
        </div>
        <div className="dashboard-card orange">
          <div className="dashboard-card-label">사용률</div>
          <div className="dashboard-card-value">
            {totalCoupons > 0 ? Math.round((usedCoupons / totalCoupons) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Generate Form */}
      <div className="card mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
          쿠폰 생성
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="generate-count">생성 개수</label>
            <input
              id="generate-count"
              type="number"
              min="1"
              max="100"
              value={generateCount}
              onChange={(e) => setGenerateCount(e.target.value)}
              style={{ width: '100px' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
            <label htmlFor="assign-group">그룹 배정 (선택)</label>
            <select
              id="assign-group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">그룹 미배정</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? '생성 중...' : '쿠폰 생성'}
          </button>
        </div>
      </div>

      {/* Distribute Form */}
      <div className="card mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
          쿠폰 배포
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '220px' }}>
            <label htmlFor="distribute-email">이메일 (개인 배포)</label>
            <input
              id="distribute-email"
              type="email"
              value={distributeEmail}
              onChange={(e) => { setDistributeEmail(e.target.value); setDistributeGroupId(''); }}
              placeholder="이메일 주소"
            />
          </div>
          <span style={{ fontSize: '14px', color: 'var(--text-light)', alignSelf: 'center' }}>또는</span>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
            <label htmlFor="distribute-group">그룹 (일괄 배포)</label>
            <select
              id="distribute-group"
              value={distributeGroupId}
              onChange={(e) => { setDistributeGroupId(e.target.value); setDistributeEmail(''); }}
            >
              <option value="">그룹 선택</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleDistribute}
            disabled={distributing}
          >
            {distributing ? '배포 중...' : '쿠폰 배포'}
          </button>
        </div>
      </div>

      {/* Coupon Table */}
      <div className="admin-table-wrapper">
        {coupons.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
            등록된 쿠폰이 없습니다.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>쿠폰 코드</th>
                <th>상태</th>
                <th>그룹</th>
                <th>사용자</th>
                <th>생성일</th>
                <th>사용일</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon, idx) => (
                <tr key={coupon.id}>
                  <td>{idx + 1}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px' }}>
                    {coupon.code}
                  </td>
                  <td>
                    {coupon.is_used ? (
                      <span className="badge badge-gray">사용완료</span>
                    ) : (
                      <span className="badge badge-green">사용가능</span>
                    )}
                  </td>
                  <td>
                    {coupon.group_id
                      ? (groups.find((g) => g.id === coupon.group_id)?.name || coupon.group_id)
                      : '-'}
                  </td>
                  <td>{coupon.used_by || '-'}</td>
                  <td>{coupon.created_at ? new Date(coupon.created_at).toLocaleDateString('ko-KR') : '-'}</td>
                  <td>{coupon.used_at ? new Date(coupon.used_at).toLocaleDateString('ko-KR') : '-'}</td>
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

export default CouponList;
