import { Link, useSearchParams } from 'react-router-dom';

const Confirmation = () => {
  const [searchParams] = useSearchParams();
  const evalId = searchParams.get('evalId');

  return (
    <div className="page-wrapper">
      <section style={{ padding: 'calc(var(--nav-height) + 60px) 20px 60px', textAlign: 'center' }}>
        <div className="container-narrow">
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#22c55e" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>결제가 완료되었습니다!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15 }}>
            핵심역량 검사를 시작할 준비가 되었습니다.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {evalId && (
              <Link to={`/evaluation/${evalId}`} className="btn btn-primary btn-lg">검사 시작하기</Link>
            )}
            <Link to="/main" className="btn btn-secondary btn-lg">메인으로</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Confirmation;
