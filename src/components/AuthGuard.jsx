import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthGuard = ({ children }) => {
  const { isLoggedIn, loading, needsProfileCompletion } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // OAuth 사용자: 인구통계학적 정보 미완성 시 프로필 완성 페이지로 이동
  if (needsProfileCompletion && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
};

export default AuthGuard;
