import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
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
          .select('id, group_name')
          .order('group_name', { ascending: true });

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

  const totalCoupons = coupons.length;
  const usedCoupons = coupons.filter((c) => c.is_used).length;
  const availableCoupons = coupons.filter((c) => !c.is_used).length;

  if (loading) {
    return (
      <div className="admin-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>쿠폰 관리</h1>
        <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
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
                <option key={g.id} value={g.id}>{g.group_name}</option>
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
                      ? (groups.find((g) => g.id === coupon.group_id)?.group_name || coupon.group_id)
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
  );
};

export default CouponList;
