import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from 'chart.js';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import { exportToCSV } from '../../utils/export';
import '../../styles/admin.css';
import '../../styles/base.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PAGE_SIZE = 20;
const chartFont = { family: "'Noto Sans KR', sans-serif" };

const STATUS_MAP = {
  paid: { label: '완료', cls: 'badge-green' },
  pending: { label: '대기', cls: 'badge-yellow' },
  failed: { label: '실패', cls: 'badge-red' },
  refunded: { label: '환불', cls: 'badge-gray' },
};

const PERIOD_TABS = [
  { key: 'daily', label: '일별' },
  { key: 'monthly', label: '월별' },
  { key: 'quarterly', label: '분기별' },
  { key: 'yearly', label: '연도별' },
];

/* ── helpers ── */
const fmtNum = (n) => (n || 0).toLocaleString();
const fmtWon = (n) => (n || 0).toLocaleString() + '원';

const fmtDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = (v) => String(v).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/* ── period aggregation ── */
const aggregateByPeriod = (rows, period) => {
  const paid = rows.filter((r) => r.status === 'paid');
  const now = new Date();

  if (period === 'daily') {
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    paid.forEach((r) => {
      const key = r.created_at?.slice(0, 10);
      if (key && map[key] !== undefined) map[key] += r.amount || 0;
    });
    return Object.entries(map).map(([k, v]) => ({
      label: `${parseInt(k.slice(5, 7))}/${parseInt(k.slice(8, 10))}`,
      value: v,
    }));
  }

  if (period === 'monthly') {
    const map = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = 0;
    }
    paid.forEach((r) => {
      const key = r.created_at?.slice(0, 7);
      if (key && map[key] !== undefined) map[key] += r.amount || 0;
    });
    return Object.entries(map).map(([k, v]) => ({
      label: `${parseInt(k.slice(5, 7))}월`,
      value: v,
    }));
  }

  if (period === 'quarterly') {
    const map = {};
    for (let i = 3; i >= 0; i--) {
      const q = Math.ceil((now.getMonth() + 1) / 3) - i;
      let year = now.getFullYear();
      let quarter = q;
      if (quarter <= 0) { quarter += 4; year -= 1; }
      const key = `${year}-Q${quarter}`;
      map[key] = 0;
    }
    paid.forEach((r) => {
      if (!r.created_at) return;
      const d = new Date(r.created_at);
      const q = Math.ceil((d.getMonth() + 1) / 3);
      const key = `${d.getFullYear()}-Q${q}`;
      if (map[key] !== undefined) map[key] += r.amount || 0;
    });
    return Object.entries(map).map(([k, v]) => ({
      label: k,
      value: v,
    }));
  }

  // yearly
  const map = {};
  paid.forEach((r) => {
    if (!r.created_at) return;
    const year = r.created_at.slice(0, 4);
    map[year] = (map[year] || 0) + (r.amount || 0);
  });
  if (Object.keys(map).length === 0) {
    map[String(now.getFullYear())] = 0;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({ label: `${k}년`, value: v }));
};

const PurchaseList = () => {
  const { showToast } = useToast();

  /* ── KPI + chart data (all purchases, one-time fetch) ── */
  const [allPurchases, setAllPurchases] = useState([]);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [periodTab, setPeriodTab] = useState('daily');

  /* ── table data (paginated) ── */
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tableLoading, setTableLoading] = useState(true);

  /* ── fetch all purchases for KPI + chart ── */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) { setKpiLoading(false); return; }

        const { data, error } = await supabase
          .from('purchases')
          .select('amount, status, created_at');

        if (error) throw error;
        setAllPurchases(data || []);
      } catch (err) {
        console.error('Failed to load purchase summary:', err);
        showToast('결제 요약 데이터를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setKpiLoading(false);
      }
    };
    fetchAll();
  }, [showToast]);

  /* ── fetch paginated table data ── */
  const fetchTable = useCallback(async (page, search, status) => {
    setTableLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) { setTableLoading(false); return; }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('purchases')
        .select('id, amount, status, payment_id, created_at, profiles:user_id ( name, email )', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`payment_id.ilike.%${search}%,profiles.name.ilike.%${search}%,profiles.email.ilike.%${search}%`);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setRows((data || []).map((r) => ({
        ...r,
        userName: r.profiles?.name || '-',
        userEmail: r.profiles?.email || '-',
      })));
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Failed to load purchases:', err);
      showToast('결제 내역을 불러오는 데 실패했습니다.', 'error');
    } finally {
      setTableLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTable(currentPage, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter, fetchTable]);

  /* ── event handlers ── */
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  /* ── KPI computation ── */
  const paidRows = allPurchases.filter((p) => p.status === 'paid');
  const totalPaidCount = paidRows.length;
  const totalRevenue = paidRows.reduce((s, p) => s + (p.amount || 0), 0);

  const nowMonth = new Date();
  const monthStart = `${nowMonth.getFullYear()}-${String(nowMonth.getMonth() + 1).padStart(2, '0')}-01`;
  const thisMonthRevenue = paidRows
    .filter((p) => p.created_at >= monthStart)
    .reduce((s, p) => s + (p.amount || 0), 0);

  const avgAmount = totalPaidCount > 0 ? Math.round(totalRevenue / totalPaidCount) : 0;

  /* ── chart data ── */
  const chartData = aggregateByPeriod(allPurchases, periodTab);

  const barChartData = {
    labels: chartData.map((d) => d.label),
    datasets: [{
      label: '매출',
      data: chartData.map((d) => d.value),
      backgroundColor: 'rgba(59,130,246,0.7)',
      borderColor: '#3b82f6',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: chartFont,
        bodyFont: chartFont,
        callbacks: { label: (ctx) => fmtWon(ctx.raw) },
      },
    },
    scales: {
      x: { ticks: { font: { ...chartFont, size: 11 } } },
      y: {
        beginAtZero: true,
        ticks: {
          font: { ...chartFont, size: 11 },
          callback: (v) => (v >= 10000 ? `${v / 10000}만` : v.toLocaleString()),
        },
      },
    },
  };

  /* ── CSV download ── */
  const handleCSV = () => {
    exportToCSV(rows, '결제내역', [
      { key: 'created_at', label: '결제일시' },
      { key: 'userName', label: '이름' },
      { key: 'userEmail', label: '이메일' },
      { key: 'amount', label: '금액' },
      { key: 'payment_id', label: '결제ID' },
      { key: 'status', label: '상태' },
    ]);
  };

  /* ── pagination ── */
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return (
      <div className="pagination">
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>&laquo;</button>
        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>&lsaquo;</button>
        {start > 1 && <span style={{ padding: '0 4px', color: 'var(--text-light)' }}>...</span>}
        {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
          <button key={p} className={p === currentPage ? 'active' : ''} onClick={() => setCurrentPage(p)}>{p}</button>
        ))}
        {end < totalPages && <span style={{ padding: '0 4px', color: 'var(--text-light)' }}>...</span>}
        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>&rsaquo;</button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>&raquo;</button>
      </div>
    );
  };

  /* ── render ── */
  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container"><h1>결제 내역</h1></div>
      </section>

      <div className="admin-page">
        <div className="admin-header-bar">
          <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
          <button className="btn btn-secondary btn-sm" onClick={handleCSV} disabled={rows.length === 0}>
            CSV 다운로드
          </button>
        </div>

        {/* ── KPI Cards ── */}
        {kpiLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="dashboard-stats" style={{ marginBottom: '24px' }}>
            <div className="dashboard-card blue">
              <div className="dashboard-card-label">전체 결제 건수</div>
              <div className="dashboard-card-value">{fmtNum(totalPaidCount)}</div>
            </div>
            <div className="dashboard-card green">
              <div className="dashboard-card-label">전체 매출</div>
              <div className="dashboard-card-value">{fmtWon(totalRevenue)}</div>
            </div>
            <div className="dashboard-card orange">
              <div className="dashboard-card-label">이번 달 매출</div>
              <div className="dashboard-card-value">{fmtWon(thisMonthRevenue)}</div>
            </div>
            <div className="dashboard-card red">
              <div className="dashboard-card-label">평균 결제 금액</div>
              <div className="dashboard-card-value">{fmtWon(avgAmount)}</div>
            </div>
          </div>
        )}

        {/* ── Period Revenue Chart ── */}
        {!kpiLoading && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>기간별 매출</h3>
              <div style={{ display: 'flex', gap: '4px' }}>
                {PERIOD_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    className={`btn btn-sm ${periodTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPeriodTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: '280px' }}>
              <Bar data={barChartData} options={barOptions} />
            </div>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="admin-toolbar">
          <form onSubmit={handleSearch} className="admin-search">
            <input
              type="text"
              placeholder="이름, 이메일, 결제ID 검색..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">검색</button>
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
            >
              <option value="">전체 상태</option>
              <option value="paid">완료</option>
              <option value="pending">대기</option>
              <option value="failed">실패</option>
              <option value="refunded">환불</option>
            </select>
            <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>
              총 {totalCount.toLocaleString()}건
            </span>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="admin-table-wrapper">
          {tableLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
              {searchTerm || statusFilter ? '검색 결과가 없습니다.' : '결제 내역이 없습니다.'}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>번호</th>
                  <th>결제일시</th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>금액</th>
                  <th>결제ID</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const st = STATUS_MAP[r.status] || { label: r.status, cls: 'badge-gray' };
                  return (
                    <tr key={r.id}>
                      <td>{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                      <td>{fmtDateTime(r.created_at)}</td>
                      <td>{r.userName}</td>
                      <td>{r.userEmail}</td>
                      <td>{fmtWon(r.amount)}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                          {r.payment_id ? (r.payment_id.length > 16 ? r.payment_id.slice(0, 16) + '...' : r.payment_id) : '-'}
                        </span>
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        {renderPagination()}
      </div>
    </div>
  );
};

export default PurchaseList;
