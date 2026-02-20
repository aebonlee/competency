import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { COMPETENCY_INFO } from '../../data/competencyInfo';

const Home = () => {
  const { isLoggedIn } = useAuth();

  return (
    <div className="page-wrapper">
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #106bb5 0%, #0a4f8a 100%)',
        color: 'white',
        padding: '120px 20px 80px',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{ fontSize: 42, fontWeight: 700, marginBottom: 16, letterSpacing: -1 }}>
            MyCoreCompetency
          </h1>
          <p style={{ fontSize: 20, opacity: 0.9, marginBottom: 8 }}>
            4차 산업혁명 시대의 8대 핵심역량 검사
          </p>
          <p style={{ fontSize: 15, opacity: 0.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            나의 핵심역량을 진단하고, 미래를 준비하세요.<br />
            56쌍의 문항을 통해 8대 핵심역량을 측정합니다.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isLoggedIn ? (
              <Link to="/main" className="btn" style={{ background: 'white', color: '#106bb5', padding: '14px 32px', fontSize: 16, fontWeight: 700 }}>
                검사 시작하기
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn" style={{ background: 'white', color: '#106bb5', padding: '14px 32px', fontSize: 16, fontWeight: 700 }}>
                  회원가입
                </Link>
                <Link to="/login" className="btn" style={{ background: 'transparent', color: 'white', border: '2px solid rgba(255,255,255,0.5)', padding: '14px 32px', fontSize: 16 }}>
                  로그인
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 8대 역량 Grid */}
      <section style={{ padding: '80px 20px' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            4차 산업혁명 8대 핵심역량
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: 48 }}>
            미래사회를 이끌어갈 8가지 핵심 역량을 측정합니다
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20
          }}>
            {COMPETENCY_INFO.map((comp) => (
              <div key={comp.id} className="card" style={{ borderTop: `4px solid ${comp.color}` }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: comp.color, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, marginBottom: 16
                }}>
                  {comp.id}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{comp.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {comp.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--bg-light-gray)', padding: '60px 20px', textAlign: 'center' }}>
        <div className="container-narrow">
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            지금 바로 핵심역량을 진단해보세요
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            검사 소요시간: 약 20~30분 | 56쌍 문항 | 즉시 결과 확인
          </p>
          <Link to={isLoggedIn ? '/main' : '/register'} className="btn btn-primary btn-lg">
            {isLoggedIn ? '검사하기' : '무료 회원가입'}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
