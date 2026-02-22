import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { COMPETENCY_INFO } from '../../data/competencyInfo';
import '../../styles/home.css';

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

const STEPS = [
  { id: 'q1', title: '핵심역량 검사 안내문', img: '/images/metis-assets/placeholders/sampleQ1.png' },
  { id: 'q2', title: '핵심역량 예시문항 1', img: '/images/metis-assets/placeholders/sampleQ2.png' },
  { id: 'q3', title: '핵심역량 예시문항 2', img: '/images/metis-assets/placeholders/sampleQ3.png' },
  { id: 'q4', title: '결과 확인', img: '/images/metis-assets/placeholders/sampleQ4.png' },
];

const Home = () => {
  const { isLoggedIn, isAdmin, isGroup, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('q1');
  const activeStep = STEPS.find(s => s.id === activeTab);

  // 로그인 상태에서 홈 접근 시 역할별 리다이렉트
  useEffect(() => {
    if (!loading && isLoggedIn) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else if (isGroup) {
        navigate('/group', { replace: true });
      } else {
        navigate('/main', { replace: true });
      }
    }
  }, [isLoggedIn, isAdmin, isGroup, loading, navigate]);

  return (
    <div className="page-wrapper">
      {/* Hero Section — intro.jsp 재현 */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-text">
            <h2>당신의 <span className="text-blue">핵심역량</span>을 알고 이해하는 것이 성공에 중요합니다.</h2>
            <p className="home-hero-desc">
              미래에 성공하기 위한 8가지 가장 중요한 핵심역량이 있습니다. 당신은 얼마나 많은 핵심역량을 가지고 있다고 생각하십니까?
            </p>
            <Link to="/competency" className="btn btn-primary btn-lg">Learn more</Link>
          </div>
          <div className="home-hero-mockup">
            <div className="macbook-wrapper">
              <img className="macbook-img" src="/images/metis-assets/elements/macbook.png" alt="MacBook" />
              <div className="macbook-screen">
                <img src="/images/metis-assets/placeholders/app2.png" alt="App Preview" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blue CTA Section */}
      <section className="home-blue-cta">
        <div className="container">
          <div className="home-blue-cta-inner">
            <div className="home-blue-cta-text">
              <h2>본 검사를 통해 당신은 어떤 <span>핵심역량</span>들을 얼마나 보유하고 있는지 살펴보는 새로운 경험을 하게될 것입니다.</h2>
              <p>This assessment will provide you with an eye-opening experience to recognize your core competencies</p>
            </div>
            <div className="home-blue-cta-btn">
              <Link to={isLoggedIn ? '/main' : '/checkout'} className="btn home-cta-button">
                나의 핵심역량 검사 시작하기
              </Link>
            </div>
          </div>
        </div>
        <img className="home-blue-decoration" src="/images/metis-assets/elements/square-rotated.svg" alt="" />
      </section>

      {/* 4-Step Process */}
      <section className="home-steps-section">
        <div className="container">
          <div className="home-steps-header">
            <span className="home-badge">핵심역량 검사</span>
            <h2><span className="text-blue">MY CORE COMPETENCY</span> 핵심역량 검사 방법</h2>
            <p>MY CORE COMPETENCY test procedure</p>
          </div>

          <div className="home-steps-preview">
            {activeStep && <img src={activeStep.img} alt={activeStep.title} />}
          </div>

          <div className="home-steps-tabs">
            <div className="home-steps-line" />
            <div className="home-steps-buttons">
              {STEPS.map((step, i) => (
                <div key={step.id} className="home-step-item">
                  <button
                    className={`home-step-circle ${activeTab === step.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(step.id)}
                  >
                    <div className={`home-step-number ${activeTab === step.id ? 'active' : ''}`}>
                      {i + 1}
                    </div>
                  </button>
                  <p className={`home-step-label ${activeTab !== step.id ? 'dimmed' : ''}`}>
                    {step.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8대 역량 Grid */}
      <section className="home-competency-section">
        <div className="container">
          <div className="home-steps-header">
            <span className="home-badge">핵심역량 검사</span>
            <h2><span className="text-blue">MY CORE COMPETENCY</span> 핵심역량 검사의 활용</h2>
            <p>핵심역량은 당신의 성공과 미래를 준비하는데 있어 매우 중요한 역할을 하게 됩니다.</p>
          </div>

          <div className="home-competency-grid">
            {COMPETENCY_INFO.map((comp, i) => (
              <Link to="/competency" key={comp.id} className="home-competency-card" style={{ borderTop: `4px solid ${comp.color}` }}>
                <div className="home-comp-icon" style={{ background: comp.color }}>
                  <img src={ICON_IMAGES[i]} alt={comp.name} />
                </div>
                <h3>{comp.name}</h3>
                <p>{comp.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="home-bottom-cta">
        <div className="container-narrow">
          <h2>지금 바로 핵심역량을 진단해보세요</h2>
          <p>검사 소요시간: 약 20~30분 | 56쌍 문항 | 즉시 결과 확인</p>
          <Link to={isLoggedIn ? '/main' : '/register'} className="btn btn-primary btn-lg">
            {isLoggedIn ? '검사하기' : '무료 회원가입'}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
