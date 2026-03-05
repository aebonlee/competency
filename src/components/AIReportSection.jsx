import { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { generateAIReport, getAIReport } from '../utils/supabase';
import { COMPETENCY_LABELS } from '../data/competencyInfo';

const PROVIDERS = [
  { key: 'claude', label: 'Claude AI', icon: '🤖' },
  { key: 'openai', label: 'GPT AI', icon: '💡' },
];

/**
 * 경량 Markdown → HTML 변환
 * 외부 라이브러리 없이 기본적인 Markdown 요소를 처리
 */
function markdownToHtml(md) {
  if (!md) return '';
  let html = md
    // 코드 블록 (```...```)은 pre로
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.slice(3, -3).replace(/^\w*\n/, '');
      return `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    })
    // 헤더
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // 볼드+이탤릭
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // 볼드
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 이탤릭
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 순서 없는 리스트
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    // 순서 있는 리스트
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // 수평선
    .replace(/^---$/gm, '<hr />')
    // 줄바꿈 → 문단
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br />');

  // li 연속을 ul로 감싸기
  html = html.replace(/(<li>[\s\S]*?<\/li>)(\s*<br \/>)?/g, '$1');
  html = html.replace(/((?:<li>[\s\S]*?<\/li>\s*)+)/g, '<ul>$1</ul>');

  // p 태그 감싸기
  html = `<p>${html}</p>`;
  // 빈 p 제거
  html = html.replace(/<p>\s*<\/p>/g, '');
  // h, ul, hr 등이 p 안에 들어가지 않도록
  html = html.replace(/<p>\s*(<h[2-4]>)/g, '$1');
  html = html.replace(/(<\/h[2-4]>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<hr \/>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)\s*<\/p>/g, '$1');

  return html;
}

const AIReportSection = ({ evalId, scores }) => {
  const [activeProvider, setActiveProvider] = useState('claude');
  const [reports, setReports] = useState({}); // { claude: AIReport, openai: AIReport }
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  // 마운트 시 기존 보고서 로드
  useEffect(() => {
    const loadExisting = async () => {
      try {
        const existing = await getAIReport(parseInt(evalId));
        if (Array.isArray(existing) && existing.length > 0) {
          const map = {};
          for (const r of existing) {
            map[r.provider] = r;
          }
          setReports(map);
          // 저장된 보고서가 있으면 해당 provider 활성화
          if (map.claude) setActiveProvider('claude');
          else if (map.openai) setActiveProvider('openai');
        }
      } catch {
        // 기존 보고서 없음 — 무시
      } finally {
        setInitialLoading(false);
      }
    };
    loadExisting();
  }, [evalId]);

  // 로딩 프로그레스 애니메이션
  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }
    setProgress(5);
    const intervals = [
      setTimeout(() => setProgress(15), 500),
      setTimeout(() => setProgress(30), 1500),
      setTimeout(() => setProgress(50), 3000),
      setTimeout(() => setProgress(65), 5000),
      setTimeout(() => setProgress(78), 8000),
      setTimeout(() => setProgress(88), 12000),
    ];
    return () => intervals.forEach(clearTimeout);
  }, [loading]);

  const handleGenerate = useCallback(async (forceRegenerate = false) => {
    setLoading(true);
    setError(null);
    try {
      const report = await generateAIReport(
        parseInt(evalId),
        activeProvider,
        forceRegenerate
      );
      setReports(prev => ({ ...prev, [activeProvider]: report }));
      setProgress(100);
    } catch (err) {
      setError(err.message || 'AI 보고서 생성에 실패했습니다.');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  }, [evalId, activeProvider]);

  const currentReport = reports[activeProvider];

  // 점수 요약 (보고서 헤더용)
  const scoreSummary = scores
    ? COMPETENCY_LABELS.map((label, i) => ({
        name: label,
        score: scores[i],
        rank: 0,
      }))
        .sort((a, b) => b.score - a.score)
        .map((item, i) => ({ ...item, rank: i + 1 }))
    : [];

  if (initialLoading) {
    return (
      <div className="ai-report-section">
        <div className="ai-report-header">
          <h2>AI 역량 분석 보고서</h2>
          <p>기존 보고서를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-report-section">
      {/* 헤더 */}
      <div className="ai-report-header">
        <div className="ai-report-header-icon">AI</div>
        <h2>AI 역량 분석 보고서</h2>
        <p>AI가 검사 결과를 분석하여 맞춤형 역량 개발 보고서를 작성합니다.</p>
      </div>

      {/* Provider 탭 */}
      <div className="ai-provider-tabs">
        {PROVIDERS.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`ai-provider-tab ${activeProvider === key ? 'active' : ''}`}
            onClick={() => { setActiveProvider(key); setError(null); }}
            disabled={loading}
          >
            <span className="ai-provider-icon">{icon}</span>
            <span className="ai-provider-label">{label}</span>
            {reports[key] && (
              <span className="ai-provider-badge">저장됨</span>
            )}
          </button>
        ))}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="ai-report-error">
          <strong>오류:</strong> {error}
        </div>
      )}

      {/* 보고서 본문 또는 생성 버튼 */}
      {currentReport ? (
        <div className="ai-report-body">
          {/* 메타 정보 */}
          <div className="ai-report-meta">
            <span>모델: {currentReport.model}</span>
            <span>생성 시간: {Math.round((currentReport.generation_time_ms || 0) / 1000)}초</span>
            <span>
              생성일: {new Date(currentReport.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>

          {/* Markdown → HTML 렌더링 */}
          <div
            className="ai-report-content"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(markdownToHtml(currentReport.report_content))
            }}
          />

          {/* 재생성 버튼 */}
          <div className="ai-report-actions">
            <button
              className="btn btn-secondary ai-report-btn"
              onClick={() => handleGenerate(true)}
              disabled={loading}
            >
              {loading ? '재생성 중...' : '보고서 재생성'}
            </button>
          </div>
        </div>
      ) : (
        <div className="ai-report-empty">
          {loading ? (
            <div className="ai-report-loading">
              <div className="ai-loading-spinner" />
              <p className="ai-loading-text">
                {activeProvider === 'claude' ? 'Claude' : 'GPT'}가 역량 분석 보고서를 작성하고 있습니다...
              </p>
              <div className="ai-progress-bar">
                <div
                  className="ai-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="ai-loading-sub">약 10~15초 정도 소요됩니다.</p>
            </div>
          ) : (
            <>
              {/* 점수 미리보기 */}
              <div className="ai-score-preview">
                {scoreSummary.slice(0, 3).map((item) => (
                  <div key={item.name} className="ai-score-chip">
                    <span className="ai-score-rank">{item.rank}위</span>
                    <span className="ai-score-name">{item.name}</span>
                    <span className="ai-score-value">{item.score}점</span>
                  </div>
                ))}
              </div>
              <p>위 검사 결과를 바탕으로 AI가 맞춤형 보고서를 작성합니다.</p>
              <button
                className="btn btn-primary ai-report-btn"
                onClick={() => handleGenerate(false)}
              >
                {activeProvider === 'claude' ? 'Claude' : 'GPT'} AI 보고서 생성
              </button>
              <p className="ai-cost-note">
                {activeProvider === 'claude'
                  ? '예상 비용: ~$0.05/건 (Claude Sonnet)'
                  : '예상 비용: ~$0.002/건 (GPT-4o-mini)'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIReportSection;
