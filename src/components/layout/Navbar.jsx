import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/navbar.css';

const Navbar = () => {
  const { isLoggedIn, isAdmin, isGroup, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef();

  useEffect(() => {
    const handleClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setOpenMenu(null);
    setMobileOpen(false);
  };

  return (
    <nav className="navbar navbar-main" ref={navRef}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-badge">MCC</span>
          <span>MyCoreCompetency</span>
        </Link>

        <button className="navbar-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={mobileOpen}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {mobileOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            ) : (
              <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
            )}
          </svg>
        </button>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          {/* 역량 코치 */}
          <div className="nav-dropdown">
            <button className="nav-btn" onClick={() => toggleMenu('competency')}>역량 코치</button>
            <div className={`nav-dropdown-menu ${openMenu === 'competency' ? 'open' : ''}`}>
              <Link to="/competency" className="nav-dropdown-item" onClick={() => setOpenMenu(null)}>
                4차산업혁명 8대 핵심역량
              </Link>
              <Link to="/competency/2015" className="nav-dropdown-item" onClick={() => setOpenMenu(null)}>
                2015교육과정 핵심역량
              </Link>
              <Link to="/competency/ncs" className="nav-dropdown-item" onClick={() => setOpenMenu(null)}>
                NCS 직업기초능력
              </Link>
            </div>
          </div>

          {/* 나의 역량 */}
          {isLoggedIn && (
            <div className="nav-dropdown">
              <button className="nav-btn" onClick={() => toggleMenu('assessment')}>나의 역량</button>
              <div className={`nav-dropdown-menu ${openMenu === 'assessment' ? 'open' : ''}`}>
                <Link to="/main" className="nav-dropdown-item" onClick={() => setOpenMenu(null)}>검사하기</Link>
                <Link to="/results" className="nav-dropdown-item" onClick={() => setOpenMenu(null)}>검사결과</Link>
                <Link to="/results/average" className="nav-dropdown-item" onClick={() => setOpenMenu(null)}>
                  나이별 &amp; 직무별 통계
                </Link>
                <Link to="/history" className="nav-dropdown-item" onClick={() => setOpenMenu(null)}>검사내역</Link>
              </div>
            </div>
          )}

          {/* Login / Profile */}
          {!isLoggedIn ? (
            <Link to="/login" className="nav-btn" onClick={() => setMobileOpen(false)}>로그인</Link>
          ) : (
            <div className="nav-dropdown">
              <button className="nav-btn" onClick={() => toggleMenu('profile')}>
                {profile?.name || '내 프로필'}
              </button>
              <div className={`nav-dropdown-menu ${openMenu === 'profile' ? 'open' : ''}`}>
                <Link to="/profile" className="nav-dropdown-item" onClick={() => setOpenMenu(null)}>
                  프로필 수정
                </Link>
                {(isGroup || isAdmin) && (
                  <Link to="/group" className="nav-dropdown-item" onClick={() => setOpenMenu(null)}>
                    그룹 관리
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="nav-dropdown-item" onClick={() => setOpenMenu(null)}>
                    관리자 대시보드
                  </Link>
                )}
                <div className="nav-dropdown-divider" />
                <button className="nav-dropdown-item" onClick={handleSignOut} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', font: 'inherit' }}>
                  로그아웃
                </button>
                <div className="nav-dropdown-footer">
                  MyCoreCompetency, LLC &copy; 2020
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
