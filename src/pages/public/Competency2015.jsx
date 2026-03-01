import { COMPETENCY_2015_MAP, COMPETENCY_INFO } from '../../data/competencyInfo';
import '../../styles/competency.css';

const Competency2015 = () => {
  const entries = Object.entries(COMPETENCY_2015_MAP);

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container">
          <h1>2015개정 교육과정 핵심역량</h1>
          <p>2015 교육과정 핵심역량과 4차산업혁명 8대 핵심역량의 관계</p>
        </div>
      </section>

      <section className="section-content">
        <div className="container-narrow">
          <h1 className="c2015-title">2015개정 교육과정 핵심역량</h1>

          <div className="c2015">
            <object type="image/svg+xml" data="/images/competency-2015.svg" aria-label="2015 교육과정 핵심역량 인포그래픽" style={{ width: '100%' }}>
              인포그래픽을 표시할 수 없습니다.
            </object>
          </div>

          <div className="c2015-text">
            <p>
              <br />
              <b>
                <span className="c2015-tight">
                  교육부는 &apos;15. 9. 23.(수) 창의융합형 인재 양성을 목표로 하는「2015 개정 교육과정」을 확정·발표하였다.
                </span>
              </b>
              <br /><br />
              ㅇ 이번 교육과정은 학교교육 전 과정에서 학생들에게 중점적으로 길러주고자 하는 핵심역량을 설정하고,<br />
              ㅇ 통합사회·통합과학 등 문·이과 공통 과목 신설, 연극·소프트웨어 교육 등 인문·사회·과학기술에 대한 기초 소양 교육을 강화하며,<br />
              ㅇ 교과별 핵심 개념과 원리를 중심으로 학습내용을 적정화하고, 교실 수업을 교사 중심에서 학생 활동 중심으로 전환하기 위한 교수·학습 및 평가 방법을 제시한 점이 가장 큰 특징으로 볼 수 있다.
              <br />
              ㅇ 2017년부터 학년별로 단계적으로 확대해 오다가 2020년부터는 초·중·고 전 학년에 적용돼 실시되고 있다.
              <br /><br />
              <b>《 총론 주요 개정 내용 》</b>
              <br />
              <span className="c2015-tight">
                □ 2015개정 교육과정은 2009 개정 교육과정이 추구하는 인간상을 기초로 창조경제 사회가 요구하는 핵심역량을 갖춘 <b>&apos;창의융합형 인재&apos;</b>상을 제시하였다.
              </span>
              <br /><br />
              <span className="c2015-wide">
                ㅇ 또한 이를 구체적으로 구현하기 위해 추구하는 인간상(*4가지)과 창의융합형 인재가 갖추어야 할 핵심역량으로{' '}
              </span>
              <b>
                <span style={{ color: '#4682B4' }}>&#9650;</span>&nbsp;자기관리 역량,{' '}
                <span style={{ color: '#A52A2A' }}>&#9650;</span>&nbsp;지식정보처리 역량,{' '}
                <span style={{ color: '#FF4500' }}>&#9650;</span>&nbsp;창의적 사고 역량,{' '}
                <span style={{ color: '#40E0D0' }}>&#9650;</span>&nbsp;심미적 감성 역량,{' '}
                <span style={{ color: '#FFD700' }}>&#9650;</span>&nbsp;의사소통 역량,{' '}
                <span style={{ color: '#BA55D3' }}>&#9650;</span>&nbsp;공동체 역량&nbsp;
              </b>
              을 제시하였다.
            </p>
            <div className="c2015-div">
              <b>* 자주적인 사람, 창의적인 사람, <br />교양있는 사람, 더불어 사는 사람</b>
            </div>
            <p className="c2015-source">
              [출처] 교육부 보도자료 일부 발췌. 2015-09-23 <br />
              <a
                href="https://www.moe.go.kr/boardCnts/view.do?boardID=294&boardSeq=60753&lev=0&m=0204"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://www.moe.go.kr/boardCnts/view.do?boardID=294&amp;boardSeq=60753&amp;lev=0&amp;m=0204
              </a>
            </p>
          </div>

          <div className="c2015-mapping">
            <h2 className="c2015-mapping-title">교육과정 핵심역량 ↔ 8대 핵심역량 매핑</h2>
            <div className="c2015-card-list">
              {entries.map(([name, compIds]) => (
                <div key={name} className="card c2015-card">
                  <h3>{name}</h3>
                  <div className="comp-badge-list">
                    {compIds.map(id => {
                      const comp = COMPETENCY_INFO[id - 1];
                      return (
                        <span key={id} className="comp-badge" style={{ background: comp.color, color: '#fff' }}>
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

export default Competency2015;
