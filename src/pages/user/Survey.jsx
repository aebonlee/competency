import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getActiveSurveyQuestions,
  checkSurveyCompleted,
  submitSurvey,
} from '../../utils/supabase';
import '../../styles/base.css';

const Survey = () => {
  const { evalId } = useParams();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const completed = await checkSurveyCompleted(parseInt(evalId));
        if (completed) {
          setAlreadyCompleted(true);
          setLoading(false);
          return;
        }

        const userGroupName = profile?.usertype === 1 ? 'group' : 'individual';
        const qs = await getActiveSurveyQuestions(userGroupName);
        setQuestions(qs);

        const initial = {};
        qs.forEach((q) => {
          initial[q.id] = { rating: 0, comment: '' };
        });
        setResponses(initial);
      } catch (err) {
        console.error('Failed to load survey:', err);
        showToast('설문 데이터를 불러오는 데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [evalId, profile, showToast]);

  const handleRating = (questionId, rating) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], rating },
    }));
  };

  const handleComment = (questionId, comment) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], comment },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const unanswered = questions.filter((q) => !responses[q.id]?.rating);
    if (unanswered.length > 0) {
      showToast('모든 문항에 별점을 선택해 주세요.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        rating: responses[q.id].rating,
        comment: responses[q.id].comment,
      }));

      await submitSurvey(parseInt(evalId), user.id, payload);
      showToast('설문이 제출되었습니다. 감사합니다!', 'success');
      navigate(`/result/${evalId}`);
    } catch (err) {
      console.error('Failed to submit survey:', err);
      showToast('설문 제출에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (alreadyCompleted) {
    return (
      <div className="page-wrapper">
        <section className="page-header">
          <div className="container">
            <h1>설문조사</h1>
            <p>이미 설문에 응답하셨습니다.</p>
          </div>
        </section>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Link to={`/result/${evalId}`} className="btn btn-primary">결과 보기</Link>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="page-wrapper">
        <section className="page-header">
          <div className="container">
            <h1>설문조사</h1>
            <p>현재 진행 중인 설문이 없습니다.</p>
          </div>
        </section>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Link to={`/result/${evalId}`} className="btn btn-primary">결과 보기</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <section className="page-header">
        <div className="container">
          <h1>설문조사</h1>
          <p>검사 경험에 대한 설문입니다. 솔직하게 응답해 주세요.</p>
        </div>
      </section>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 16px 60px' }}>
        <form onSubmit={handleSubmit}>
          {questions.map((q, idx) => (
            <div key={q.id} className="card mb-3">
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
                {idx + 1}. {q.question_text}
              </h3>

              {/* Star rating */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRating(q.id, star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '28px',
                      color: (responses[q.id]?.rating || 0) >= star ? '#f5c516' : '#ddd',
                      padding: '2px',
                      lineHeight: 1,
                    }}
                    aria-label={`${star}점`}
                  >
                    ★
                  </button>
                ))}
                <span style={{ fontSize: '14px', color: 'var(--text-light)', alignSelf: 'center', marginLeft: '8px' }}>
                  {responses[q.id]?.rating ? `${responses[q.id].rating}점` : '선택해 주세요'}
                </span>
              </div>

              {/* Comment */}
              <textarea
                rows="2"
                placeholder="의견을 입력해 주세요 (선택)"
                value={responses[q.id]?.comment || ''}
                onChange={(e) => handleComment(q.id, e.target.value)}
                style={{ width: '100%', resize: 'vertical', fontSize: '14px' }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
            <Link to={`/result/${evalId}`} className="btn btn-secondary">건너뛰기</Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '제출 중...' : '설문 제출'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Survey;
