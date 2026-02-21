import { Link, useSearchParams } from 'react-router-dom';

const Confirmation = () => {
  const [searchParams] = useSearchParams();
  const evalId = searchParams.get('evalId');

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container">
          <h1>결제 완료</h1>
          <p>핵심역량 검사를 시작할 준비가 되었습니다</p>
        </div>
      </section>

      <section style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="container-narrow">
          <div className="confirmation-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#22c55e" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>결제가 완료되었습니다!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15 }}>
            아래 버튼을 눌러 검사를 시작하세요.
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
