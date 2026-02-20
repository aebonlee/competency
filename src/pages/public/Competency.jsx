import { useState } from 'react';
import Modal from '../../components/Modal';
import { COMPETENCY_INFO } from '../../data/competencyInfo';

const Competency = () => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container">
          <h1>4차산업혁명 8대 핵심역량</h1>
          <p>미래사회를 이끌어갈 8가지 핵심 역량</p>
        </div>
      </section>

      <section style={{ padding: '60px 20px' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24
          }}>
            {COMPETENCY_INFO.map((comp) => (
              <div
                key={comp.id}
                className="card"
                style={{ cursor: 'pointer', borderLeft: `4px solid ${comp.color}`, transition: 'all 0.2s' }}
                onClick={() => setSelected(comp)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: comp.color, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, flexShrink: 0
                  }}>
                    {comp.id}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700 }}>{comp.name}</h3>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {comp.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <h1 style={{ color: selected.color }}>{selected.name}</h1>
            <p><b>{selected.summary}</b></p>
            {selected.description.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </>
        )}
      </Modal>
    </div>
  );
};

export default Competency;
