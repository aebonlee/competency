import { COMPETENCY_2015_MAP, COMPETENCY_INFO } from '../../data/competencyInfo';

const Competency2015 = () => {
  const entries = Object.entries(COMPETENCY_2015_MAP);

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container">
          <h1>2015 교육과정 핵심역량</h1>
          <p>2015 교육과정 핵심역량과 4차산업혁명 8대 핵심역량의 관계</p>
        </div>
      </section>

      <section style={{ padding: '60px 20px' }}>
        <div className="container-narrow">
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.8 }}>
            2015 교육과정에서 제시한 6대 핵심역량이 4차산업혁명 8대 핵심역량과 어떻게 연결되는지 보여줍니다.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {entries.map(([name, compIds]) => (
              <div key={name} className="card" style={{ padding: '20px 24px' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--primary-blue)' }}>{name}</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {compIds.map(id => {
                    const comp = COMPETENCY_INFO[id - 1];
                    return (
                      <span key={id} className="badge" style={{ background: comp.color + '22', color: comp.color, padding: '6px 14px', fontSize: 13 }}>
                        {comp.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Competency2015;
