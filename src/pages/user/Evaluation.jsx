import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { getEvalQuestions, saveAnswer, calculateResults } from '../../utils/supabase';
import getSupabase from '../../utils/supabase';
import AssessmentRadio from '../../components/AssessmentRadio';
import ProgressBar from '../../components/ProgressBar';
import '../../styles/assessment.css';

/* ── 예시문항 라디오 (DB 저장 없음, 팝오버 표시용) ── */
const EXAMPLE_LABELS = ['매우 그렇다', '그렇다', '아니다', '매우 아니다'];

const ExampleRadio = ({ type }) => {
  // 예시1: 4번(value=0) 체크됨, 예시2: 3번(value=10) 체크됨 (레거시 동일)
  const [selected, setSelected] = useState(type === 1 ? 0 : 10);
  const options = [30, 20, 10, 0];

  const getPopover = (idx) => {
    if (type === 1) {
      if (idx === 0) return { placement: 'left', text: '위의 문장에 동의하는 경우 이 원을 선택하십시오' };
      if (idx === 3) return { placement: 'right', text: '아래의 문장에 동의하는 경우 이 원을 선택하십시오' };
    } else {
      if (idx === 1) return { placement: 'right', text: '양쪽의 문장에 모두 동의하지만 위의 문장에 좀 더 동의하는경우 이 원을 선택하십시오' };
      if (idx === 2) return { placement: 'left', text: '양쪽의 문장에 모두 동의하지만 아래의 문장에 좀 더 동의하는경우 이 원을 선택하십시오' };
    }
    return null;
  };

  return (
    <div className="assessment-scale" role="radiogroup" aria-label="예시문항 선택">
      <div className="assessment-options">
        {options.map((val, idx) => {
          const popover = getPopover(idx);
          return (
            <div className="assessment-option" key={val}>
              {popover && (
                <div className={`example-popover example-popover-${popover.placement}`}>
                  {popover.text}
                </div>
              )}
              <input
                type="radio"
                id={`example${type}_${val}`}
                name={`example${type}`}
                value={val}
                checked={selected === val}
                onChange={() => setSelected(val)}
              />
              <label htmlFor={`example${type}_${val}`}>
                {EXAMPLE_LABELS[idx]}
              </label>
            </div>
          );
        })}
        <div className="assessment-bar">
          <div className="assessment-rating"><span>4</span></div>
        </div>
      </div>
    </div>
  );
};

const Evaluation = () => {
  const { evalId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('intro'); // 'intro' | 'guide' | 'example1' | 'example2' | 'test'
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const transitioningRef = useRef(false);

  const totalCount = questions.length;

  // Load questions + resume support
  useEffect(() => {
    const load = async () => {
      const data = await getEvalQuestions(parseInt(evalId));
      setQuestions(data);
      const existing = {};
      data.forEach(q => {
        if (q.std_point !== null && q.std_point >= 0) existing[q.id] = q.std_point;
      });
      setAnswers(existing);

      // Resume: find first unanswered question
      const firstUnanswered = data.findIndex(q => q.std_point === null || q.std_point < 0);
      if (firstUnanswered === -1 && data.length > 0) {
        // 전부 답변 완료 → 제출 페이지
        setStep('test');
        setCurrentIndex(data.length);
      } else if (Object.keys(existing).length > 0) {
        // 일부 답변 존재 → 이어하기
        setStep('test');
        setCurrentIndex(firstUnanswered > 0 ? firstUnanswered : 0);
      }

      setLoading(false);
    };
    load();
  }, [evalId]);

  // Back button prevention (레거시 onLeave 매칭)
  useEffect(() => {
    if (step === 'intro') return;

    const preventBack = () => {
      window.history.pushState(null, '', window.location.href);
      showToast('검사 중에는 뒤로 갈 수 없습니다', 'warning');
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventBack);

    return () => {
      window.removeEventListener('popstate', preventBack);
    };
  }, [step, showToast]);

  // Scroll lock (레거시 html.fp-enabled body { overflow: hidden } 매칭)
  useEffect(() => {
    if (step !== 'intro') {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [step]);

  // Answer handler — ref로 중복 클릭 차단, state로 UI disabled 반영
  const handleAnswer = useCallback(async (questionId, value) => {
    if (transitioningRef.current) return;

    transitioningRef.current = true;
    setTransitioning(true);
    setAnswers(prev => ({ ...prev, [questionId]: value }));

    try {
      await saveAnswer(questionId, value);
    } catch (err) {
      console.error('Save answer error:', err);
    }

    // Auto-advance after 600ms
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      transitioningRef.current = false;
      setTransitioning(false);
    }, 600);
  }, []);

  // Keyboard shortcuts (1~4)
  useEffect(() => {
    if (step !== 'test' || currentIndex >= totalCount) return;

    const handleKeyDown = (e) => {
      if (transitioningRef.current) return;
      const keyMap = { '1': 30, '2': 20, '3': 10, '4': 0 };
      const val = keyMap[e.key];
      if (val !== undefined) {
        const q = questions[currentIndex];
        if (q) handleAnswer(q.id, val);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, currentIndex, totalCount, questions, handleAnswer]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const client = getSupabase();
      if (client) {
        await client.from('eval_list').update({
          progress: 100,
          end_date: new Date().toISOString()
        }).eq('id', parseInt(evalId));

        await calculateResults(parseInt(evalId));
      }

      showToast('검사가 완료되었습니다!', 'success');
      navigate(`/result/${evalId}`);
    } catch {
      showToast('검사 제출에 실패했습니다.', 'error');
      setError('검사 제출에 실패했습니다. 다시 시도해주세요.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="assessment-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="assessment-page">
        <div className="assessment-container" style={{ textAlign: 'center', paddingTop: 80 }}>
          <h2>문항을 불러올 수 없습니다</h2>
          <p style={{ margin: '16px 0', color: '#666' }}>
            검사 문항이 아직 생성되지 않았습니다.<br />
            관리자에게 문의해 주세요.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/main')}>메인으로 돌아가기</button>
        </div>
      </div>
    );
  }

  // 현재 문항 — test 단계이고 currentIndex < totalCount 일 때만 존재
  const currentQuestion = step === 'test' && currentIndex < totalCount ? questions[currentIndex] : null;

  return (
    <div className="assessment-page">
      {/* ── iPhone X Device Frame — 데스크톱 전용 장식 (레거시 devices.css 매칭) ── */}
      <div className="device device-iphone-x" aria-hidden="true">
        <div className="device-frame">
          <div className="device-content" />
        </div>
        <div className="device-stripe" />
        <div className="device-header" />
        <div className="device-sensors" />
        <div className="device-btns" />
        <div className="device-power" />
      </div>

      {/* ── Intro (레거시 section1) ── */}
      {step === 'intro' && (
        <div className="assessment-fullpage">
          <div className="assessment-intro-content">
            <h1>MyCoreCompetency<br />핵심역량 검사</h1>
            <h2>( {totalCount} 문항 )</h2>
            <div className="scroll-btn-legacy" onClick={() => setStep('guide')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setStep('guide')}>
              <span className="mouse-legacy"><span /></span>
              <p>Scroll Down</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Guide (레거시 section2) ── */}
      {step === 'guide' && (
        <div className="assessment-fullpage">
          <div className="guide-content">
            <div className="test-info-legacy">
              <blockquote className="speech-bubble-legacy">
                <p>MyCoreCompetency<br />핵심역량 검사 안내문</p>
              </blockquote>
            </div>
            <div className="test-text-legacy">
              MyCoreCompetency 핵심역량 검사는 총 {totalCount}쌍의 문항들로 구성되어 있습니다.
              <br /><br />
              각 문항마다 위 아래 문장 사이에 있는 4개의 원 중 자신에게 가장 적합하다고 생각하는 문장쪽의 원을 선택해 주세요.
              <br /><br />
              위 아래 문장이 모두 자신에게 적합하다고 생각하는 경우, 좀 더 적합하다고 생각하는 쪽의 원을 선택해 주세요.
              <br /><br />
              각 문항 당 소요시간은 30초 이내 입니다. 정확한 검사 결과를 위해서 빠르게 선택해 주시기 바랍니다.
            </div>
            <div className="scroll-btn-legacy" onClick={() => setStep('example1')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setStep('example1')}>
              <span className="mouse-legacy"><span /></span>
              <p>Scroll Down</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Example 1 (레거시 section3 — 팝오버: 1번/4번 옵션) ── */}
      {step === 'example1' && (
        <div className="assessment-fullpage">
          <div className="example-content">
            <div className="test-info-legacy">
              <blockquote className="speech-bubble-legacy">
                <p style={{ fontWeight: 'bold' }}>핵심역량 검사 예시 문항</p>
              </blockquote>
            </div>
            <div className="example-label">( 예시문항 )</div>
            <div className="question-text question-text-top">
              나는 항상 창의적으로 생각한다.
            </div>
            <ExampleRadio type={1} />
            <div className="question-text question-text-bottom">
              나는 비판적 사고과정을 즐긴다.
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setStep('example2')}
              style={{ marginTop: 16 }}
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* ── Example 2 (레거시 section4 — 팝오버: 2번/3번 옵션) ── */}
      {step === 'example2' && (
        <div className="assessment-fullpage">
          <div className="example-content">
            <div className="test-info-legacy">
              <blockquote className="speech-bubble-legacy">
                <p>핵심역량 검사 예시 문항</p>
              </blockquote>
            </div>
            <div className="example-label">( 예시문항 )</div>
            <div className="question-text question-text-top">
              나는 항상 창의적으로 생각한다.
            </div>
            <ExampleRadio type={2} />
            <div className="question-text question-text-bottom">
              나는 비판적 사고과정을 즐긴다.
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setStep('test')}
              style={{ marginTop: 16 }}
            >
              검사 시작
            </button>
          </div>
        </div>
      )}

      {/* ── Test Questions (레거시 section.real — 1문항/1풀스크린) ── */}
      {step === 'test' && currentQuestion && (
        <div className="assessment-fullpage">
          <div key={currentIndex} className="question-card-fullpage">
            <div className="question-number">문항 {currentIndex + 1} / {totalCount}</div>
            <div className="question-text question-text-top">
              {currentQuestion.std_question?.q_text || `표준 문항 #${currentQuestion.stdq_id}`}
            </div>
            <AssessmentRadio
              questionId={currentQuestion.id}
              value={answers[currentQuestion.id] ?? null}
              onChange={handleAnswer}
              disabled={transitioning}
            />
            <div className="question-text question-text-bottom">
              {currentQuestion.cmp_question?.q_text || `비교 문항 #${currentQuestion.cmpq_id}`}
            </div>
          </div>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <div aria-live="polite" className="sr-only">
            문항 {currentIndex + 1}/{totalCount} 진행 중
          </div>
          <ProgressBar current={currentIndex + 1} total={totalCount} />
        </div>
      )}

      {/* ── Complete / Submit (레거시 SAVE 섹션) ── */}
      {step === 'test' && !currentQuestion && totalCount > 0 && (
        <div className="assessment-fullpage">
          <div className="assessment-complete">
            <h2>모든 문항을 완료했습니다!</h2>
            <p>{totalCount}개 문항에 모두 응답하셨습니다.<br />아래 버튼을 눌러 검사를 제출해 주세요.</p>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '제출 중...' : '검사 완료'}
            </button>
          </div>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <ProgressBar current={totalCount} total={totalCount} />
        </div>
      )}
    </div>
  );
};

export default Evaluation;
