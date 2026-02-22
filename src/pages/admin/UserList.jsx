import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import { exportToCSV } from '../../utils/export';
import '../../styles/admin.css';
import '../../styles/base.css';

const PAGE_SIZE = 20;

const UserList = () => {
  const { user: _user } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async (page, search) => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .is('deleted_at', null);

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setUsers(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast('회원 목록을 불러오는 데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getUsertypeBadge = (usertype) => {
    switch (usertype) {
      case 0:
        return <span className="badge badge-gray">개인</span>;
      case 1:
        return <span className="badge badge-blue">그룹</span>;
      case 2:
        return <span className="badge badge-red">관리자</span>;
      case 3:
        return <span className="badge badge-yellow">서브관리자</span>;
      default:
        return <span className="badge badge-gray">개인</span>;
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const _pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return (
      <div className="pagination">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        >
          &laquo;
        </button>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          &lsaquo;
        </button>
        {start > 1 && <span style={{ padding: '0 4px', color: 'var(--text-light)' }}>...</span>}
        {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
          <button
            key={p}
            className={p === currentPage ? 'active' : ''}
            onClick={() => setCurrentPage(p)}
          >
            {p}
          </button>
        ))}
        {end < totalPages && <span style={{ padding: '0 4px', color: 'var(--text-light)' }}>...</span>}
        <button
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          &rsaquo;
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          &raquo;
        </button>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container"><h1>회원 관리</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            exportToCSV(users, '회원목록', [
              { key: 'name', label: '이름' },
              { key: 'email', label: '이메일' },
              { key: 'phone', label: '전화번호' },
              { key: 'usertype', label: '유형' },
              { key: 'age', label: '나이대' },
              { key: 'position', label: '직무' },
              { key: 'region', label: '지역' },
              { key: 'created_at', label: '가입일' },
            ]);
          }}
          disabled={users.length === 0}
        >
          CSV 다운로드
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="admin-toolbar">
        <form onSubmit={handleSearch} className="admin-search">
          <input
            type="text"
            placeholder="이름, 이메일, 전화번호 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">검색</button>
        </form>
        <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>
          총 {totalCount.toLocaleString()}명
        </span>
      </div>

      {/* User Table */}
      <div className="admin-table-wrapper">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="loading-spinner"></div>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-light)' }}>
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 회원이 없습니다.'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>이름</th>
                <th>이메일</th>
                <th>전화번호</th>
                <th>유형</th>
                <th>가입일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id}>
                  <td>{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                  <td>{u.name || '-'}</td>
                  <td>{u.email || '-'}</td>
                  <td>{u.phone || '-'}</td>
                  <td>{getUsertypeBadge(u.usertype)}</td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('ko-KR') : '-'}</td>
                  <td>
                    <Link to={`/admin/users/${u.id}`} className="btn btn-primary btn-sm">
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}
      </div>
    </div>
  );
};

export default UserList;
