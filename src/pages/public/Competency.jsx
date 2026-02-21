import { useRef } from 'react';
import { COMPETENCY_INFO } from '../../data/competencyInfo';
import '../../styles/competency.css';

const ICON_IMAGES = [
  '/images/idea.svg',
  '/images/plan.svg',
  '/images/agreement.svg',
  '/images/team.svg',
  '/images/wheel.svg',
  '/images/brain.svg',
  '/images/brain2.svg',
  '/images/business-and-finance.svg',
];

const CIRCLE_CLASSES = [
  'critical', 'creative', 'communication', 'collaboration',
  'digital', 'emotional', 'solving', 'mind'
];

const Competency = () => {
  const abilityRefs = useRef([]);

  const scrollToAbility = (index) => {
    abilityRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="page-wrapper">
      <div className="competency-page">
        {/* Header */}
        <div className="comp-header">
          <h1>Core Competency</h1>
          <p className="comp-intro">
            핵심역량은 그동안 학교나 직업교육에서 기술이나 지식에 비해 주목받지 못했었습니다.<br />
            하지만, 핵심역량은 4차 산업혁명 시대에 당신의 성공과 미래를 준비하는데 있어 매우 중요한 역할을 하게 됩니다.<br />
            따라서, 본 검사를 통해 당신은 자신의 핵심역량을 들여다 보고 어떤 핵심역량들을 얼마나 보유하고 있는지 살펴보는 새로운 경험을 하게 될 것입니다.
          </p>
        </div>

        {/* Pulse text */}
        <div className="comp-pulse">
          <p>핵심 역량에 대한 자세한 설명을 보시려면 아래의 아이콘을 클릭하거나 스크롤을 내려보세요.</p>
          <span className="pulse-dot" />
        </div>

        {/* Icon Circle Area with tree background */}
        <div className="comp-top-content">
          <img src="/images/tree.svg" alt="" className="tree-bg" />
          {COMPETENCY_INFO.map((comp, i) => (
            <button
              key={comp.id}
              className={`comp-circle-btn ${CIRCLE_CLASSES[i]}`}
              onClick={() => scrollToAbility(i)}
              title={comp.name}
            >
              <div className="comp-circle" style={{ background: comp.color }}>
                <img src={ICON_IMAGES[i]} alt={comp.name} />
              </div>
              <span className="comp-circle-label">{comp.name}</span>
            </button>
          ))}
        </div>

        {/* Detailed Descriptions */}
        <div className="comp-abilities">
          {COMPETENCY_INFO.map((comp, i) => (
            <div key={comp.id} ref={el => abilityRefs.current[i] = el} className="comp-ability-section">
              <div className="comp-ability-icon">
                <div className={`comp-circle-display ${CIRCLE_CLASSES[i]}`}>
                  <div className="comp-circle" style={{ background: comp.color }}>
                    <img src={ICON_IMAGES[i]} alt={comp.name} />
                  </div>
                  <h3>{comp.name}</h3>
                </div>
              </div>
              <div className="comp-ability-desc">
                <h3><b>{comp.summary}</b></h3>
                {comp.description.map((para, j) => (
                  <p key={j}>{para}</p>
                ))}
                <div className="comp-back-top">
                  <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    ↑ Top
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom grass image */}
        <div className="comp-bottom-img">
          <img src="/images/grass2.png" alt="" />
        </div>
      </div>
    </div>
  );
};

export default Competency;
