import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEvaluations } from '../../utils/supabase';
import '../../styles/result.css';

const History = () => {
  const { user } = useAuth();
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getEvaluations(user.id).then(data => {
        setEvals(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) {
    return <div className="page-wrapper"><div style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}><div className="loading-spinner" /></div></div>;
  }

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container">
          <h1>검사 내역</h1>
          <p>총 {evals.length}회 검사</p>
        </div>
      </section>

      <div className="result-page">
      {evals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>검사 내역이 없습니다.</p>
          <Link to="/main" className="btn btn-primary">검사하기</Link>
        </div>
      ) : (
        <div className="history-list">
          {evals.map(ev => (
            <div key={ev.id} className="history-item">
              <div className="history-info">
                <span className="history-times">{ev.times}회차 검사</span>
                <span className="history-date">
                  {ev.start_date ? new Date(ev.start_date).toLocaleDateString() : '—'}
                  {ev.end_date ? ` ~ ${new Date(ev.end_date).toLocaleDateString()}` : ''}
                </span>
              </div>
              <div className="history-progress">
                <span className={`badge ${ev.progress === 100 ? 'badge-green' : 'badge-yellow'}`}>
                  {ev.progress === 100 ? '완료' : `${ev.progress}%`}
                </span>
                {ev.progress === 100 ? (
                  <Link to={`/result/${ev.id}`} className="btn btn-sm btn-primary">결과보기</Link>
                ) : (
                  <Link to={`/evaluation/${ev.id}`} className="btn btn-sm btn-secondary">이어하기</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default History;
