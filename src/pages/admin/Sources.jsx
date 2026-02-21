import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import getSupabase from '../../utils/supabase';
import '../../styles/admin.css';
import '../../styles/base.css';

const imageSources = [
  { item: '로고 이미지', source: 'Freepik', link: 'https://www.freepik.com' },
  { item: '역량 아이콘', source: 'Flaticon', link: 'https://www.flaticon.com' },
  { item: '나무 일러스트', source: 'Freepik', link: 'https://www.freepik.com' },
];

const librarySources = [
  { name: 'React 18', description: 'UI framework', link: 'https://react.dev' },
  { name: 'Vite', description: 'Build tool', link: 'https://vitejs.dev' },
  { name: 'Supabase', description: 'Backend/Auth/DB', link: 'https://supabase.com' },
  { name: 'Chart.js', description: '차트 라이브러리', link: 'https://www.chartjs.org' },
  { name: 'PortOne', description: '결제 SDK', link: 'https://portone.io' },
  { name: 'React Router', description: '라우팅', link: 'https://reactrouter.com' },
];

const Sources = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading] = useState(false);

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
        <div className="container"><h1>출처 및 참고</h1></div>
      </section>

      <div className="admin-page">
      <div className="admin-header-bar">
        <Link to="/admin" className="btn btn-secondary btn-sm">대시보드</Link>
      </div>

      {/* Image Sources */}
      <div className="card mb-3">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>이미지 출처</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>항목</th>
              <th>출처</th>
              <th>링크</th>
            </tr>
          </thead>
          <tbody>
            {imageSources.map((item, idx) => (
              <tr key={idx}>
                <td>{item.item}</td>
                <td>{item.source}</td>
                <td>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary-blue)' }}
                  >
                    {item.link}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Library / Plugin Sources */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>라이브러리 / 플러그인</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>설명</th>
              <th>링크</th>
            </tr>
          </thead>
          <tbody>
            {librarySources.map((lib, idx) => (
              <tr key={idx}>
                <td>{lib.name}</td>
                <td>{lib.description}</td>
                <td>
                  <a
                    href={lib.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary-blue)' }}
                  >
                    {lib.link}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

export default Sources;
