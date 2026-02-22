import { NavLink, Outlet, useLocation } from 'react-router-dom';
import '../../styles/admin.css';

const menuGroups = [
  {
    label: null,
    items: [
      { to: '/admin', label: '대시보드', icon: '📊', exact: true },
    ],
  },
  {
    label: '회원 관리',
    items: [
      { to: '/admin/users', label: '회원 목록', icon: '👤' },
      { to: '/admin/deleted-users', label: '탈퇴 회원', icon: '🚪' },
    ],
  },
  {
    label: '검사 관리',
    items: [
      { to: '/admin/questions', label: '문항 관리', icon: '❓' },
      { to: '/admin/statistics', label: '통계', icon: '📈' },
    ],
  },
  {
    label: '콘텐츠',
    items: [
      { to: '/admin/board', label: '게시판', icon: '📝' },
      { to: '/admin/surveys', label: '만족도 조사', icon: '⭐' },
      { to: '/admin/survey-questions', label: '설문 관리', icon: '📋' },
      { to: '/admin/sources', label: '출처 관리', icon: '📂' },
    ],
  },
  {
    label: '결제 / 쿠폰',
    items: [
      { to: '/admin/coupons', label: '쿠폰 관리', icon: '🎟️' },
    ],
  },
  {
    label: '소통',
    items: [
      { to: '/admin/notes', label: '알림 / 메시지', icon: '🔔' },
      { to: '/admin/mail', label: '메일 발송', icon: '✉️' },
    ],
  },
];

const AdminLayout = () => {
  const { pathname } = useLocation();

  const isActive = (to, exact) => {
    if (exact) return pathname === to;
    return pathname === to || pathname.startsWith(to + '/');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">관리자</div>
        <nav className="admin-sidebar-nav">
          {menuGroups.map((group, gi) => (
            <div key={gi} className="admin-sidebar-group">
              {group.label && (
                <div className="admin-sidebar-group-label">{group.label}</div>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={`admin-sidebar-link${isActive(item.to, item.exact) ? ' active' : ''}`}
                >
                  <span className="admin-sidebar-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
