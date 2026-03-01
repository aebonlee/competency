import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { getEvalQuestions, saveAnswer, calculateResults } from '../../utils/supabase';
import getSupabase from '../../utils/supabase';
import AssessmentRadio from '../../components/AssessmentRadio';
import ProgressBar from '../../components/ProgressBar';
import '../../styles/assessment.css';

const Evaluation = () => {
  const { evalId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

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
        // All answered → go to submit page
        setCurrentIndex(data.length);
      } else if (firstUnanswered > 0) {
        setCurrentIndex(firstUnanswered);
      }

      setLoading(false);
    };
    load();
  }, [evalId]);

  // Back button prevention
  useEffect(() => {
    if (!started) return;

    const preventBack = () => {
      window.history.pushState(null, '', window.location.href);
      showToast('검사 중에는 뒤로 갈 수 없습니다', 'warning');
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventBack);

    return () => {
      window.removeEventListener('popstate', preventBack);
    };
  }, [started, showToast]);

  // Scroll lock when started
  useEffect(() => {
    if (started) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [started]);

  // Keyboard shortcuts (1~4)
  useEffect(() => {
    if (!started || transitioning || currentIndex >= totalCount) return;

    const handleKeyDown = (e) => {
      const keyMap = { '1': 30, '2': 20, '3': 10, '4': 0 };
      const val = keyMap[e.key];
      if (val !== undefined) {
        const q = questions[currentIndex];
        if (q) handleAnswer(q.id, val);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started, transitioning, currentIndex, totalCount, questions]);

  const handleAnswer = useCallback(async (questionId, value) => {
    if (transitioning) return;

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
      setTransitioning(false);
    }, 600);
  }, [transitioning]);

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

  // Current question
  const currentQuestion = currentIndex < totalCount ? questions[currentIndex] : null;

  return (
    <div className="assessment-page">
      {!started ? (
        <>
          {/* Intro */}
          <div className="assessment-intro">
            <h1>MyCoreCompetency<br />핵심역량 검사</h1>
            <h2>( {totalCount} 문항 )</h2>
            <div className="scroll-indicator" onClick={() => setStarted(true)} style={{ cursor: 'pointer' }}>
              <div className="scroll-mouse"><span /></div>
              <p>시작하기</p>
            </div>
          </div>

          {/* Guide */}
          <div className="assessment-container">
            <div className="assessment-guide">
              <div className="speech-bubble">MyCoreCompetency 핵심역량 검사 안내문</div>
              <p>
                MyCoreCompetency 핵심역량 검사는 총 {totalCount}쌍의 문항들로 구성되어 있습니다.
              </p>
              <p>
                각 문항마다 위 아래 문장 사이에 있는 4개의 원 중 자신에게 가장 적합하다고 생각하는 문장쪽의 원을 선택해 주세요.
              </p>
              <p>
                위 아래 문장이 모두 자신에게 적합하다고 생각하는 경우, 좀 더 적합하다고 생각하는 쪽의 원을 선택해 주세요.
              </p>
              <p>
                각 문항 당 소요시간은 30초 이내 입니다. 정확한 검사 결과를 위해서 빠르게 선택해 주시기 바랍니다.
              </p>
              <button className="btn btn-primary btn-lg btn-full" onClick={() => setStarted(true)} style={{ marginTop: 24 }}>
                검사 시작
              </button>
            </div>
          </div>
        </>
      ) : currentQuestion ? (
        /* Single question fullpage */
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
      ) : (
        /* Submit page — all answered */
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
