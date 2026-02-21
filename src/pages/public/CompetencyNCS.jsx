import { NCS_MAP, COMPETENCY_INFO } from '../../data/competencyInfo';
import '../../styles/competency.css';

const CompetencyNCS = () => {
  const entries = Object.entries(NCS_MAP);

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container">
          <h1>NCS 직업기초능력</h1>
          <p>NCS 직업기초능력과 4차산업혁명 8대 핵심역량의 비교</p>
        </div>
      </section>

      <section style={{ padding: '60px 20px' }}>
        <div className="container-narrow">
          <p className="text-center" style={{ color: 'var(--text-secondary)', marginBottom: 40, lineHeight: 1.8 }}>
            국가직무능력표준(NCS)의 10대 직업기초능력이 4차산업혁명 8대 핵심역량과 어떻게 연결되는지 보여줍니다.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {entries.map(([name, compIds]) => (
              <div key={name} className="card" style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, minWidth: 140 }}>{name}</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {compIds.map(id => {
                      const comp = COMPETENCY_INFO[id - 1];
                      return (
                        <span key={id} className="badge" style={{ background: comp.color + '22', color: comp.color, padding: '4px 12px', fontSize: 12 }}>
                          {comp.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CompetencyNCS;
