import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getResult } from '../../utils/supabase';
import { CompetencyPolarChart, CompetencyDoughnutChart } from '../../components/CompetencyChart';
import Modal from '../../components/Modal';
import { COMPETENCY_INFO, COMPETENCY_COLORS, COMPETENCY_LABELS } from '../../data/competencyInfo';
import '../../styles/result.css';

// 역량별 SVG 아이콘 경로 & CSS 클래스
const COMP_ICONS = [
  '/images/idea.svg',
  '/images/plan.svg',
  '/images/agreement.svg',
  '/images/team.svg',
  '/images/wheel.svg',
  '/images/brain.svg',
  '/images/brain2.svg',
  '/images/business-and-finance.svg',
];

const COMP_CLASSES = [
  'critical', 'creative', 'communiccation', 'collaboration',
  'digital', 'emotional', 'solving', 'mind',
];

// NCS 계산 (legacy result.jsp 299~320행 동일)
const calcNCS = (point) => {
  const ncs = new Array(10);
  ncs[0] = (point[2] + point[3] + point[4] + point[5] + point[6]) / 5;
  ncs[1] = (point[0] + point[4] + point[6] + point[7]) / 4;
  ncs[2] = (point[0] + point[1] + point[2] + point[3] + point[4] + point[5] + point[6] + point[7]) / 8;
  ncs[3] = point[7];
  ncs[4] = (point[0] + point[1] + point[4] + point[7]) / 4;
  ncs[5] = (point[2] + point[3] + point[5]) / 3;
  ncs[6] = (point[2] + point[4] + point[6]) / 3;
  ncs[7] = (point[0] + point[1]) / 2;
  ncs[8] = (point[0] + point[2] + point[3] + point[5] + point[6]) / 3;
  ncs[9] = (point[5] + point[7]) / 2;
  return ncs.map(v => Math.round(v * 100) / 100);
};

// 점수 순위 정렬 (legacy getMost 동일)
const getRanked = (scores) => {
  return scores
    .map((score, i) => ({ score, index: i }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
};

// Gradient 계산 (legacy printGradient 동일)
const buildGradient = (ranked, scores) => {
  const total = scores.reduce((a, b) => a + b, 0);
  if (total === 0) return 'to bottom, #ccc 0%, #ccc 100%';
  const ratios = [];
  let cum = 0;
  for (let i = 0; i < 8; i++) {
    cum += (scores[ranked[i].index] / total) * 100;
    ratios.push(cum);
  }
  const parts = ['to bottom'];
  for (let i = 0; i < 8; i++) {
    const color = COMPETENCY_COLORS[ranked[i].index];
    if (i !== 0) parts.push(`${color} ${ratios[i - 1]}%`);
    parts.push(`${color} ${ratios[i]}%`);
  }
  return parts.join(', ');
};

const Result = () => {
  const { evalId } = useParams();
  const { profile } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState(1);
  const [selectedComp, setSelectedComp] = useState(null);

  useEffect(() => {
    const load = async () => {
      const data = await getResult(parseInt(evalId));
      setResult(data);
      setLoading(false);
    };
    load();
  }, [evalId]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="page-wrapper">
        <section className="page-header">
          <div className="container">
            <h1>검사 결과</h1>
            <p>아직 결과가 생성되지 않았습니다. 검사를 완료해주세요.</p>
          </div>
        </section>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Link to="/main" className="btn btn-primary">메인으로</Link>
        </div>
      </div>
    );
  }

  const scores = [
    result.point1, result.point2, result.point3, result.point4,
    result.point5, result.point6, result.point7, result.point8
  ];
  const total = scores.reduce((a, b) => a + b, 0);
  const ranked = getRanked(scores);
  const ncsScores = calcNCS(scores);

  // Gender image
  const gender = profile?.gender || '';
  const genderImg = gender === 'M' ? '/images/man2.png' : '/images/woman3.png';
  const gradient = buildGradient(ranked, scores);

  // Top 3 & Other 5
  const top3 = ranked.slice(0, 3);
  const other3 = ranked.slice(3, 6);
  const other2 = ranked.slice(6, 8);

  // 2015 교육과정 더블도넛
  const edu2015Colors = ['#A52A2A', '#FF4500', '#FFD700', '#BA55D3', '#fff', '#40E0D0', '#fff', '#4682B4'];
  const edu2015Data = [scores[0], scores[1], scores[2], scores[3], 0, scores[5], 0, scores[7]];
  const edu2015Labels = ['지식정보 처리역량', '창의적 사고역량', '의사소통 역량', '공동체 역량', '', '심미적 감성역량', '', '자기관리 역량'];

  // NCS 더블도넛
  const ncsColors = ['#6951a0', '#ad4d9c', '#ee5d90', '#f68920', '#f5c516', '#bad535', '#63c1b6', '#149dd7', '#0276bd', '#5164ae'];
  const ncsLabels = ['의사소통능력', '수리능력', '문제해결능력', '자기개발능력', '자원관리능력', '대인관계능력', '정보능력', '기술능력', '조직이해능력', '직업윤리'];

  const renderCompCard = (item, onClick) => {
    const idx = item.index;
    const info = COMPETENCY_INFO[idx];
    return (
      <a
        key={idx}
        className={`comp-card ${COMP_CLASSES[idx]}`}
        onClick={(e) => { e.preventDefault(); onClick(info); }}
        href="#"
      >
        <div className="comp-circle">
          <img src={COMP_ICONS[idx]} alt={info.name} />
        </div>
        <p>{info.name}</p>
      </a>
    );
  };

  return (
    <div className="page-wrapper result-domain">
      <div className="result-page">

        {/* Speech Bubble - 안내문 */}
        <blockquote className="speech-bubble">
          <p>
            <b>오늘날 빠르게 변화하는 세상에서 성공하고 싶습니까?</b><br /><br />
            기술과 지식을 습득하는 것은 시작에 불과합니다. 커뮤니케이션, 협업, 창의성 및 비판적 사고와 같은 핵심 역량을 갖추어야합니다.
            <br /><br />
            핵심 역량에는 지속 가능한 가치와 광범위한 적용성이 있습니다. 따라서 모든 각 계층의 사람들은 자신의 핵심 역량을 알고 이해하는 것이 중요합니다.
            <br /><br />
            핵심 역량을 탐색 할 준비가 되셨습니까?
            <br /><br />
            <b>이 테스트는 복잡한 알고리즘을 사용하여 4차 산업 혁명 시대에 성공할 수 있는 8가지 가장 중요한 핵심 역량을 평가합니다.</b>
            <br /><br />
            각 역량은 비판적/분석적인 사고, 창의성, 복합적 의사소통, 협업능력, 디지털 리터러시, 감성지능, 복합문제 해결능력 및 마음의 습관입니다.
            <br /><br />
            아래의 결과는 상위 3개의 핵심 역량 및 5개의 다른 핵심 역량뿐만 아니라 역량의 구조 및 관계를 탐색 할 수 있는 대화식 역량 차트를 보여줍니다.
            <br /><br />
            <b>3대 핵심 역량은 강점을 나타냅니다. 그러나 다른 5가지 핵심 역량을 약점으로 생각해서는 안됩니다.</b>
            <br /><br />
            결과에서 역량의 순서는 절대 가치가 아닌 핵심 역량 간의 상대 가치를 기준으로 평가되기 때문입니다. 예를 들어, 당신의 최소 핵심 역량이 다른 사람의 최고 핵심 역량보다 강력하거나 높을 수 있습니다.
            <br /><br />
            이제 사람 모양 인포그래픽을 만나보세요. 색상 순서가 다른 핵심 역량 측면에서 얼마나 독창적인지 보여줍니다.
            <br /><br />
            <b>자신의 핵심 역량을 알리고 싶으신가요?<br /><br />이미지를 캡처하여 소셜 미디어에 공유하세요!</b>
          </p>
        </blockquote>

        {/* Profile Card — 성별 이미지 + 역량 그라디언트 */}
        <div
          className="result-card-media"
          style={{
            backgroundImage: `url(${genderImg}), linear-gradient(${gradient})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
        />

        {/* Top 3 Competencies */}
        <div className="trd-ability">
          <h1>My Top 3 Competencies</h1>
          <h3>가장 높은 3가지 역량입니다.</h3>
          <p className="pulsetext">핵심 역량에 대한 설명을 보시려면 아이콘을 클릭하세요!</p>

          <div className="ability main-row">
            {top3.map(item => renderCompCard(item, setSelectedComp))}
          </div>

          <h1>My Other 5 Competencies</h1>
          <h3>3대 역량을 제외한 나머지 역량입니다.</h3>

          <div className="ability first-row">
            {other3.map(item => renderCompCard(item, setSelectedComp))}
          </div>
          <div className="ability second-row">
            {other2.map(item => renderCompCard(item, setSelectedComp))}
          </div>
        </div>

        {/* Interactive Charts */}
        <div className="chart-title">
          <h1>대화형 핵심역량 차트</h1>
        </div>

        <div className="chart-tabs">
          <ul>
            <li className={`chart-tab-btn${activeChart === 1 ? ' active' : ''}`} onClick={() => setActiveChart(1)}>8대핵심역량</li>
            <li className={`chart-tab-btn${activeChart === 2 ? ' active' : ''}`} onClick={() => setActiveChart(2)}>2015교육과정역량</li>
            <li className={`chart-tab-btn${activeChart === 3 ? ' active' : ''}`} onClick={() => setActiveChart(3)}>NCS직업기초능력</li>
          </ul>
        </div>

        {/* Chart 1: Polar */}
        {activeChart === 1 && (
          <div className="chart-panel">
            <blockquote className="speech-bubble">
              <p style={{ textAlign: 'center' }}>
                이 대화형 역량 차트는 핵심역량 간의 관계를 탐색할 수 있는 기회를 제공합니다.
                <br /><br />
                <b>8대 역량 중 몇 가지 핵심역량만 따로 뽑아서 결과를 보고 싶나요?</b>
                <br /><br />
                그럼 아래 차트 범례에서 제외하고 싶은 핵심역량을 선택하세요. 그러면 선택한 핵심역량을 제외한 나머지 핵심역량들 사이의 관계의 변화를 확인하실 수 있습니다.
              </p>
            </blockquote>
            <div className="chart-canvas-wrap">
              <CompetencyPolarChart scores={scores} />
            </div>
          </div>
        )}

        {/* Chart 2: 2015 교육과정 */}
        {activeChart === 2 && (
          <div className="chart-panel">
            <span className="chart-subtitle"><b>2015년 교육과정 핵심역량과 비교</b></span>
            <blockquote className="speech-bubble">
              <p style={{ textAlign: 'center' }}>
                8대 핵심역량과 2015년 교육과정의 6가지 핵심역량과 비교하여 보여주는 차트입니다.
                <br /><br />
                <span className="legend-inline">
                  <span style={{ color: '#A52A2A' }}>■■■</span>&nbsp;&nbsp;지식정보처리역량&nbsp;&nbsp;&nbsp;
                  <span style={{ color: '#FF4500' }}>■■■</span>&nbsp;&nbsp;창의적 사고역량&nbsp;&nbsp;&nbsp;
                  <span style={{ color: '#FFD700' }}>■■■</span>&nbsp;&nbsp;의사소통 역량
                  <br />
                  <span style={{ color: '#BA55D3' }}>■■■</span>&nbsp;&nbsp;공동체 역량&nbsp;&nbsp;&nbsp;
                  <span style={{ color: '#40E0D0' }}>■■■</span>&nbsp;&nbsp;심미적 감성역량&nbsp;&nbsp;&nbsp;
                  <span style={{ color: '#4682B4' }}>■■■</span>&nbsp;&nbsp;자기관리 역량
                </span>
              </p>
            </blockquote>
            <div className="chart-canvas-wrap">
              <CompetencyDoughnutChart
                outerData={scores}
                outerLabels={COMPETENCY_LABELS}
                outerColors={COMPETENCY_COLORS}
                innerData={edu2015Data}
                innerLabels={edu2015Labels}
                innerColors={edu2015Colors}
              />
            </div>
          </div>
        )}

        {/* Chart 3: NCS */}
        {activeChart === 3 && (
          <div className="chart-panel">
            <span className="chart-subtitle"><b>NCS 직업기초능력과 비교</b></span>
            <blockquote className="speech-bubble">
              <p style={{ textAlign: 'center' }}>
                8대 핵심역량과 NCS 직업기초능력의 10가지 핵심역량과 비교하여 보여주는 차트입니다.
                <br /><br />
                <span className="legend-inline">
                  <span style={{ color: '#6951a0' }}>■■■</span>&nbsp;&nbsp;의사소통능력&nbsp;&nbsp;&nbsp;
                  <span style={{ color: '#ad4d9c' }}>■■■</span>&nbsp;&nbsp;수리능력&nbsp;&nbsp;&nbsp;
                  <span style={{ color: '#ee5d90' }}>■■■</span>&nbsp;&nbsp;문제해결능력
                  <br />
                  <span style={{ color: '#f68920' }}>■■■</span>&nbsp;&nbsp;자기개발능력&nbsp;&nbsp;&nbsp;
                  <span style={{ color: '#f5c516' }}>■■■</span>&nbsp;&nbsp;자원관리능력&nbsp;&nbsp;&nbsp;
                  <span style={{ color: '#bad535' }}>■■■</span>&nbsp;&nbsp;대인관계능력
                  <br />
                  <span style={{ color: '#63c1b6' }}>■■■</span>&nbsp;&nbsp;정보능력&nbsp;&nbsp;&nbsp;
                  <span style={{ color: '#149dd7' }}>■■■</span>&nbsp;&nbsp;기술능력&nbsp;&nbsp;&nbsp;
                  <span style={{ color: '#0276bd' }}>■■■</span>&nbsp;&nbsp;조직이해능력&nbsp;&nbsp;&nbsp;
                  <span style={{ color: '#5164ae' }}>■■■</span>&nbsp;&nbsp;직업윤리
                </span>
              </p>
            </blockquote>
            <div className="chart-canvas-wrap">
              <CompetencyDoughnutChart
                outerData={scores}
                outerLabels={COMPETENCY_LABELS}
                outerColors={COMPETENCY_COLORS}
                innerData={ncsScores}
                innerLabels={ncsLabels}
                innerColors={ncsColors}
              />
            </div>
          </div>
        )}

        {/* Bottom buttons */}
        <div style={{ textAlign: 'center', marginTop: 40, marginBottom: 40 }}>
          <Link to="/results" className="btn btn-secondary" style={{ marginRight: 12 }}>전체 결과 보기</Link>
          <Link to="/main" className="btn btn-primary">메인으로</Link>
        </div>
      </div>

      {/* Competency Detail Modal */}
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
    </div>
  );
};

export default Result;
