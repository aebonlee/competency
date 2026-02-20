import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/group.css';
import '../../styles/base.css';

const GroupCouponList = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [groupId, setGroupId] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);

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

        // Get coupons assigned to this group
        const { data: couponData, error: couponError } = await supabase
          .from('coupons')
          .select('*')
          .eq('group_id', group.id)
          .order('created_at', { ascending: false });

        if (couponError && couponError.code !== '42P01') throw couponError;
        setCoupons(couponData || []);

        // Get group members
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

        setMembers(
          (memberData || []).map((m) => ({
            user_id: m.user_id,
            name: m.profiles?.name || '-',
            email: m.profiles?.email || '-',
          }))
        );
      } catch (err) {
        console.error('Failed to load coupon data:', err);
        showToast('쿠폰 정보를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, showToast]);

  const handleDistribute = async () => {
    if (!selectedCoupon || !selectedMember) return;

    setDistributing(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('coupons')
        .update({
          assigned_to: selectedMember,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', selectedCoupon);

      if (error) throw error;

      // Update local state
      const member = members.find((m) => m.user_id === selectedMember);
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === selectedCoupon
            ? {
                ...c,
                assigned_to: selectedMember,
                assigned_at: new Date().toISOString(),
                assigned_name: member?.name || '-',
              }
            : c
        )
      );

      setSelectedCoupon('');
      setSelectedMember('');
      showToast('쿠폰이 배포되었습니다.', 'success');
    } catch (err) {
      console.error('Failed to distribute coupon:', err);
      showToast('쿠폰 배포에 실패했습니다.', 'error');
    } finally {
      setDistributing(false);
    }
  };

  const availableCoupons = coupons.filter((c) => !c.is_used && !c.assigned_to);
  const distributedCoupons = coupons.filter((c) => c.assigned_to);
  const usedCoupons = coupons.filter((c) => c.is_used);

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
        <h1>쿠폰 관리</h1>
        <Link to="/group" className="btn btn-secondary btn-sm">돌아가기</Link>
      </div>

      {/* Stats */}
      <div className="group-stats">
        <div className="group-stat-card">
          <div className="group-stat-value">{coupons.length}</div>
          <div className="group-stat-label">전체 쿠폰</div>
        </div>
        <div className="group-stat-card">
          <div className="group-stat-value">{availableCoupons.length}</div>
          <div className="group-stat-label">미배포</div>
        </div>
        <div className="group-stat-card">
          <div className="group-stat-value">{distributedCoupons.length}</div>
          <div className="group-stat-label">배포완료</div>
        </div>
        <div className="group-stat-card">
          <div className="group-stat-value">{usedCoupons.length}</div>
          <div className="group-stat-label">사용완료</div>
        </div>
      </div>

      {/* Distribute Form */}
      {availableCoupons.length > 0 && members.length > 0 && (
        <div className="card mb-3">
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            쿠폰 배포
          </h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
              <label htmlFor="select-coupon">쿠폰 선택</label>
              <select
                id="select-coupon"
                value={selectedCoupon}
                onChange={(e) => setSelectedCoupon(e.target.value)}
              >
                <option value="">쿠폰을 선택하세요</option>
                {availableCoupons.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
              <label htmlFor="select-member">멤버 선택</label>
              <select
                id="select-member"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
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
              onClick={handleDistribute}
              disabled={!selectedCoupon || !selectedMember || distributing}
            >
              {distributing ? '배포 중...' : '배포'}
            </button>
          </div>
        </div>
      )}

      {/* Coupon Table */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
          쿠폰 목록
        </h3>
        {coupons.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-light)' }}>
            등록된 쿠폰이 없습니다.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>쿠폰 코드</th>
                <th>상태</th>
                <th>배포 대상</th>
                <th>사용 여부</th>
                <th>생성일</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon, idx) => (
                <tr key={coupon.id}>
                  <td>{idx + 1}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{coupon.code}</td>
                  <td>
                    {coupon.is_used ? (
                      <span className="badge badge-gray">사용완료</span>
                    ) : coupon.assigned_to ? (
                      <span className="badge badge-green">배포완료</span>
                    ) : (
                      <span className="badge badge-blue">미배포</span>
                    )}
                  </td>
                  <td>{coupon.assigned_to ? (members.find((m) => m.user_id === coupon.assigned_to)?.name || coupon.assigned_to) : '-'}</td>
                  <td>
                    {coupon.is_used ? (
                      <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                        {coupon.used_at ? new Date(coupon.used_at).toLocaleDateString('ko-KR') : '사용됨'}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{new Date(coupon.created_at).toLocaleDateString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GroupCouponList;
