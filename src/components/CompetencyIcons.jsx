import { useState } from 'react';
import Modal from './Modal';
import { COMPETENCY_INFO } from '../data/competencyInfo';

const CompetencyIcons = ({ scores, showTop = 3 }) => {
  const [selectedComp, setSelectedComp] = useState(null);

  // Sort by score descending, take top N
  const ranked = scores
    .map((score, i) => ({ ...COMPETENCY_INFO[i], score, index: i }))
    .sort((a, b) => b.score - a.score)
    .slice(0, showTop);

  return (
    <>
      <div className="top3-grid">
        {ranked.map((comp, rank) => (
          <div
            key={comp.id}
            className="top3-card"
            onClick={() => setSelectedComp(comp)}
            style={{ borderColor: comp.color }}
          >
            <div className="top3-rank">TOP {rank + 1}</div>
            <div className="top3-icon" style={{ background: comp.color }}>
              {comp.id}
            </div>
            <div className="top3-name">{comp.name}</div>
            <div className="top3-score">{comp.score}</div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedComp} onClose={() => setSelectedComp(null)}>
        {selectedComp && (
          <>
            <h1 style={{ color: selectedComp.color }}>{selectedComp.name}</h1>
            <p><b>{selectedComp.summary}</b></p>
            {selectedComp.description.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </>
        )}
      </Modal>
    </>
  );
};

export default CompetencyIcons;
