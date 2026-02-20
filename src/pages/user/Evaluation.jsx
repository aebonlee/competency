import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { getEvalQuestions, saveAnswer } from '../../utils/supabase';
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

  useEffect(() => {
    const load = async () => {
      const data = await getEvalQuestions(parseInt(evalId));
      setQuestions(data);
      const existing = {};
      data.forEach(q => {
        if (q.std_point > 0) existing[q.id] = q.std_point;
      });
      setAnswers(existing);
      setLoading(false);
    };
    load();
  }, [evalId]);

  const handleAnswer = async (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    try {
      await saveAnswer(questionId, value);
    } catch (err) {
      console.error('Save answer error:', err);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const allAnswered = totalCount > 0 && answeredCount === totalCount;

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    try {
      const client = getSupabase();
      if (client) {
        // Update eval progress to 100
        await client.from('eval_list').update({
          progress: 100,
          end_date: new Date().toISOString()
        }).eq('id', parseInt(evalId));

        // Calculate results (call edge function or compute client-side)
        await client.functions.invoke('calculate-result', {
          body: { evalId: parseInt(evalId) }
        }).catch(() => {
          // Fallback: basic client-side calculation placeholder
          console.warn('Edge function not available, result will be calculated later');
        });
      }

      showToast('검사가 완료되었습니다!', 'success');
      navigate(`/result/${evalId}`);
    } catch (err) {
      showToast('검사 제출에 실패했습니다.', 'error');
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
      ) : (
        <div className="assessment-container">
          <div style={{ paddingBottom: 80 }}>
            {questions.map((q, idx) => (
              <div key={q.id} className="question-card">
                <div className="question-number">문항 {idx + 1} / {totalCount}</div>
                <div className="question-text question-text-top">
                  {q.std_question?.q_text || `표준 문항 #${q.stdq_id}`}
                </div>
                <AssessmentRadio
                  questionId={q.id}
                  value={answers[q.id] ?? null}
                  onChange={handleAnswer}
                />
                <div className="question-text question-text-bottom">
                  {q.cmp_question?.q_text || `비교 문항 #${q.cmpq_id}`}
                </div>
              </div>
            ))}

            <div className="assessment-submit">
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
              >
                {submitting ? '제출 중...' : allAnswered ? '검사 완료' : `${answeredCount}/${totalCount} 답변 완료`}
              </button>
            </div>
          </div>
          <ProgressBar current={answeredCount} total={totalCount} />
        </div>
      )}
    </div>
  );
};

export default Evaluation;
