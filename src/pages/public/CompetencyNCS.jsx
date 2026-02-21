import { useState, useEffect } from 'react';
import { NCS_MAP, COMPETENCY_INFO } from '../../data/competencyInfo';
import '../../styles/competency.css';

const SVG_FALLBACK_LOADING = '<div style="text-align:center;padding:40px;color:#888;">Loading infographic...</div>';

const NCS_DEFINITIONS = [
  { name: '의사소통능력', color: '#6951A0', desc: '업무를 수행함에 있어 글과 말을 읽고 들음으로써 다른 사람이 뜻한 바를 파악하고, 자기가 뜻한 바를 글과 말을 통해 정확하게 쓰거나 말하는 능력이다.' },
  { name: '수리능력', color: '#27A5DE', desc: '업무를 수행함에 있어 사칙연산, 통계, 확률의 의미를 정확하게 이해하고, 이를 업무에 적용하는 능력이다.' },
  { name: '문제해결능력', color: '#CFD733', desc: '업무를 수행함에 있어 문제 상황이 발생하였을 경우, 창조적이고 논리적인 사고를 통하여 이를 올바르게 인식하고 적절히 해결하는 능력이다.' },
  { name: '자기개발능력', color: '#F7D509', desc: '업무를 추진하는데 스스로를 관리하고 개발하는 능력이다.' },
  { name: '자원관리능력', color: '#C9DB32', desc: '업무를 수행하는데 시간, 자본, 재료 및 시설, 인적자원 등의 자원 가운데 무엇이 얼마나 필요한지를 확인하고, 이용 가능한 자원을 최대한 수집하여 실제 업무에 어떻게 활용할 것인지를 계획하고, 계획대로 업무 수행에 이를 할당하는 능력이다.' },
  { name: '대인관계능력', color: '#F0A121', desc: '업무를 수행함에 있어 접촉하게 되는 사람들과 문제를 일으키지 않고 원만하게 지내는 능력이다.' },
  { name: '정보능력', color: '#7DC8A9', desc: '업무와 관련된 정보를 수집하고, 이를 분석하여 의미있는 정보를 찾아내며, 의미있는 정보를 업무수행에 적절하도록 조직하고, 조직된 정보를 관리하며, 업무 수행에 이러한 정보를 활용하고, 이러한 제 과정에 컴퓨터를 사용하는 능력이다.' },
  { name: '기술능력', color: '#F98B20', desc: '업무를 수행함에 있어 도구, 장치 등을 포함하여 필요한 기술에는 어떠한 것들이 있는지 이해하고, 실제로 업무를 수행함에 있어 적절한 기술을 선택하여 적용하는 능력이다.' },
  { name: '조직이해능력', color: '#E62257', desc: '업무를 원활하게 수행하기 위해 국제적인 추세를 포함하여 조직의 체제와 경영에 대해 이해하는 능력이다.' },
  { name: '직업윤리', color: '#6172B6', desc: '업무를 수행함에 있어 원만한 직업생활을 위해 필요한 태도, 매너, 올바른 직업관이다.' }
];

const CompetencyNCS = () => {
  const [svgHtml, setSvgHtml] = useState(SVG_FALLBACK_LOADING);
  const entries = Object.entries(NCS_MAP);

  useEffect(() => {
    fetch('/images/competency-ncs.svg')
      .then(res => {
        if (!res.ok) throw new Error('SVG not found');
        return res.text();
      })
      .then(text => {
        const svgMatch = text.match(/<svg[\s\S]*<\/svg>/);
        setSvgHtml(svgMatch ? svgMatch[0] : text);
      })
      .catch(() => {
        setSvgHtml('<div style="text-align:center;padding:40px;color:#999;">Infographic SVG could not be loaded.</div>');
      });
  }, []);

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container">
          <h1>NCS 직업기초능력</h1>
          <p>NCS 직업기초능력과 4차산업혁명 8대 핵심역량의 비교</p>
        </div>
      </section>

      <section className="section-content">
        <div className="container-narrow">
          <h1 className="c2015-title">
            NCS 직업기초능력 VS<br />4차 산업혁명 8대 핵심역량
          </h1>

          <div className="c2015-text">
            <p style={{ textAlign: 'center' }}>
              4차 산업혁명 8대 핵심역량을 클릭하시면<br />
              NCS 직업기초능력과의 연계도를 볼 수 있습니다.
            </p>
          </div>

          <div className="c2015" dangerouslySetInnerHTML={{ __html: svgHtml }} />

          <div className="c2015-text">
            <p>
              <b className="c2015-tight">
                NCS 국가직무능력표준 직업기초능력은 4차 산업혁명 8대 핵심역량의 하위 능력으로
                직업인으로 소양해야 하는 기본적인 업무에 관련된 능력을 정의하고 있습니다.
              </b>
            </p>
          </div>

          <div className="ncs-definitions">
            {NCS_DEFINITIONS.map((ncs, i) => (
              <div key={i} className="ncs-def-item">
                <span className="ncs-def-bullet" style={{ background: ncs.color }} />
                <div>
                  <b>{ncs.name}</b>
                  <span className="ncs-def-text">{ncs.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="c2015-source" style={{ marginTop: 24 }}>
            [출처] NCS 국가직무능력표준<br />
            <a
              href="https://www.ncs.go.kr/th03/TH0302List.do?dirSeq=121"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.ncs.go.kr/th03/TH0302List.do?dirSeq=121
            </a>
          </p>

          <div className="c2015-mapping">
            <h2 className="c2015-mapping-title">NCS 직업기초능력 ↔ 8대 핵심역량 매핑</h2>
            <div className="c2015-card-list">
              {entries.map(([name, compIds]) => (
                <div key={name} className="card c2015-card">
                  <h3>{name}</h3>
                  <div className="comp-badge-list">
                    {compIds.map(id => {
                      const comp = COMPETENCY_INFO[id - 1];
                      return (
                        <span key={id} className="comp-badge" style={{ background: comp.color + '22', color: comp.color }}>
                          {comp.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CompetencyNCS;
