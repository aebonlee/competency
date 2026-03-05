# 세션 30 개발일지 — AI 역량 분석 보고서 기능 구현

**날짜**: 2026-03-06
**세션**: 30
**작업 유형**: 신규 기능 개발

---

## 1. 개요

Result 페이지(`/result/:evalId`)에 **AI 역량 분석 보고서** 기능을 추가하였다.
사용자의 8대 핵심역량 검사 결과를 Claude 또는 GPT AI가 분석하여 **종합 해설 + 역량개발 방향 + 직무 추천 + 실천 계획**을 담은 맞춤형 보고서를 자동 생성한다.

### 핵심 특징
- **듀얼 AI 지원**: Claude (Anthropic) + OpenAI (GPT) 둘 다 지원, 사용자가 탭으로 선택
- **보고서 캐싱**: Supabase DB에 저장하여 재열람 가능 (API 비용 절약)
- **자동 로드**: 페이지 로드 시 기존 보고서 자동 로드
- **재생성**: 기존 보고서를 새로 생성하는 기능 지원

---

## 2. 수정/생성 파일 목록

| # | 파일 | 작업 | 설명 |
|---|------|------|------|
| 1 | `supabase/migrations/20260306_ai_reports.sql` | **신규** | ai_reports 테이블 + RLS 정책 |
| 2 | `supabase/functions/generate-ai-report/index.ts` | **신규** | AI 보고서 생성 Edge Function |
| 3 | `src/types/index.ts` | 수정 | AIReport 인터페이스 추가 |
| 4 | `src/utils/supabase.ts` | 수정 | generateAIReport, getAIReport 함수 추가 |
| 5 | `src/components/AIReportSection.jsx` | **신규** | 보고서 UI 컴포넌트 |
| 6 | `src/styles/ai-report.css` | **신규** | 보고서 스타일 |
| 7 | `src/pages/user/Result.jsx` | 수정 | AIReportSection import + 렌더링 삽입 |

---

## 3. 상세 구현 내용

### 3-1. DB 스키마 (`ai_reports` 테이블)

```sql
CREATE TABLE public.ai_reports (
  id               UUID PRIMARY KEY,
  eval_id          INTEGER NOT NULL REFERENCES eval_list(id),
  user_id          UUID NOT NULL REFERENCES auth.users(id),
  provider         TEXT NOT NULL CHECK ('claude' | 'openai'),
  model            TEXT NOT NULL,
  report_content   TEXT NOT NULL,
  scores_snapshot  JSONB NOT NULL,
  user_context     JSONB,
  prompt_tokens    INTEGER,
  completion_tokens INTEGER,
  generation_time_ms INTEGER,
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

- **UNIQUE(eval_id, provider)**: 동일 검사에 대해 provider별 1개 보고서 (upsert 가능)
- **RLS 정책**: 본인 CRUD + 관리자(usertype=2) 전체 열람

### 3-2. Edge Function (`generate-ai-report`)

기존 `verify-payment` 패턴을 따르는 Deno Edge Function:

1. JWT 인증 → 사용자 확인
2. DB 캐시 확인 → 있으면 `cached: true`로 즉시 반환
3. `results` + `user_profiles` 조회 → 점수/프로필 수집
4. 프롬프트 구성 (역량 점수, 순위, Top3/Bottom3, 사용자 정보)
5. AI API 호출:
   - **Claude**: `claude-sonnet-4-5-20250514` (Anthropic Messages API)
   - **OpenAI**: `gpt-4o-mini` (Chat Completions API)
6. 결과를 `ai_reports`에 upsert 후 반환

**프롬프트 역할**: "4차 산업혁명 핵심역량 분석 전문 커리어 컨설턴트"
**출력 섹션**: 종합 해설 / 역량별 개발 방향 / 직무 추천 / 실천 계획
**톤**: 격려적, 건설적, 성장 가능성 중심

### 3-3. AIReportSection 컴포넌트

- **Provider 탭**: Claude AI / GPT AI 전환 (저장된 보고서 "저장됨" 뱃지)
- **생성 전**: 상위 3개 역량 미리보기 + 생성 버튼 + 예상 비용
- **생성 중**: 로딩 스피너 + 프로그레스 바 (5→15→30→50→65→78→88%)
- **생성 후**: Markdown → HTML 변환 렌더링 + 메타 정보 + 재생성 버튼
- **Markdown 렌더링**: 외부 라이브러리 없이 경량 regex 기반 변환
- **XSS 방지**: DOMPurify(기존 설치됨)로 sanitize

### 3-4. 예상 비용

| Provider | 모델 | 예상 비용/건 |
|----------|------|-------------|
| Claude | claude-sonnet-4-5 | ~$0.05 |
| OpenAI | gpt-4o-mini | ~$0.002 |

---

## 4. 배포 전 필요 작업

### Supabase 대시보드
1. **마이그레이션 SQL 실행**: `20260306_ai_reports.sql`을 SQL Editor에서 실행
2. **Edge Function 배포**: `supabase functions deploy generate-ai-report`
3. **Secrets 설정**:
   - `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
   - `supabase secrets set OPENAI_API_KEY=sk-...`

---

## 5. 검증 결과

| 항목 | 결과 |
|------|------|
| `npm run build` | 성공 (3.90s, 에러 없음) |
| 새 파일 4개 | 정상 생성 |
| 기존 파일 3개 수정 | 최소 변경, 기존 코드 영향 없음 |
| Result.jsx 변경 | import 2줄 + 컴포넌트 삽입 1줄 |

---

## 6. 기술적 결정 사항

| 결정 | 이유 |
|------|------|
| Markdown 렌더링을 자체 regex로 구현 | marked 등 외부 라이브러리 추가 없이 번들 크기 절약 |
| DOMPurify로 HTML sanitize | 기존 설치된 패키지 활용, XSS 방지 |
| eval_id+provider UNIQUE 제약 | provider별 1개 보고서, upsert로 재생성 시 기존 보고서 교체 |
| Edge Function에서 AI 호출 | API 키를 클라이언트에 노출하지 않기 위해 서버사이드 처리 |
| 캐시 우선 전략 | 동일 검사에 대해 재요청 시 DB에서 즉시 반환, API 비용 절약 |
