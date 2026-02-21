# 세션 10 개발일지 — 전체 사이트 점검 및 치명적 버그 3건 수정

**날짜**: 2026-02-21
**배포**: https://competency.dreamitbiz.com

---

## 점검 배경

`/evaluation/1` 페이지에서 문항이 표시되지 않는 문제 보고. 전체 사이트 점검 수행.

---

## 점검 결과 — 발견된 문제 (3건 치명적 + 1건 주의)

### 치명적 1: `calculate-result` Edge Function 미구현

- **위치**: `Evaluation.jsx:60` — `client.functions.invoke('calculate-result', ...)`
- **증상**: 검사 완료 후 결과(`point1~point8`)가 계산되지 않음 → 결과 페이지 빈 화면
- **원인**: Edge Function이 존재하지 않고, `.catch()`로 에러가 무시됨
- **영향도**: 검사 완료 → 결과 없음 (핵심 기능 완전 불능)

### 치명적 2: `VITE_SITE_URL` 환경변수 deploy.yml 누락

- **위치**: `.github/workflows/deploy.yml`
- **증상**: GitHub Actions 빌드 시 `VITE_SITE_URL`이 빈 값 → OAuth 리다이렉션이 `window.location.origin`으로 폴백
- **영향도**: 프로덕션에서 OAuth 로그인 후 리다이렉션 오류 가능

### 치명적 3: Supabase DB에 문항 데이터 미삽입

- **증상**: `questions` 테이블에 `section`/`q_no` 컬럼 없고, 112개 문항 데이터도 없음
- **영향도**: `createEvaluation()` 호출 시 에러 발생 → 검사 시작 불가
- **해결**: 사용자가 Supabase SQL Editor에서 마이그레이션 + 시드 SQL 직접 실행 필요

### 주의: `get_average_scores` RPC 함수 미정의

- **위치**: `ResultAvg.jsx:16` — `client.rpc('get_average_scores')`
- **영향도**: 통계 비교 페이지 작동 안함 (에러 핸들링됨, silent fail)

---

## 수정 내역

### 수정 1: 결과 계산 — Edge Function → 클라이언트 사이드 (supabase.js)

레거시 `updateEval.jsp` 결과 계산 알고리즘을 클라이언트 사이드 JavaScript로 이식.

**함수**: `calculateResults(evalId)`

```javascript
// 알고리즘 (레거시 updateEval.jsp 73~122행 이식)
const points = [0, 0, 0, 0, 0, 0, 0, 0]; // 8개 영역
for (const eq of evalQuestions) {
  points[std_section - 1] += std_point;       // 기준문항 영역에 점수 추가
  points[cmp_section - 1] += (30 - std_point); // 비교문항 영역에 보완 점수 추가
}
// results 테이블에 upsert (eval_id 기준)
```

**변경사항**:
- `supabase.js`: `calculateResults()` 함수 추가 (+30줄)
- `supabase.js`: `getEvalQuestions()` 쿼리에 `section` 필드 추가
- `Evaluation.jsx`: Edge Function 호출 → `calculateResults()` 호출로 교체

### 수정 2: deploy.yml에 VITE_SITE_URL 추가

```yaml
env:
  VITE_SITE_URL: ${{ secrets.VITE_SITE_URL }}
```

**사용자 수동 작업**: GitHub repo → Settings → Secrets → `VITE_SITE_URL` = `https://competency.dreamitbiz.com` 추가 필요

### 수정 3: 빈 문항 에러 핸들링 (Evaluation.jsx)

`questions.length === 0`일 때 안내 메시지 표시:
- "문항을 불러올 수 없습니다"
- "검사 문항이 아직 생성되지 않았습니다. 관리자에게 문의해 주세요."
- "메인으로 돌아가기" 버튼

---

## 변경 파일 요약

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `src/utils/supabase.js` | `calculateResults()` 추가 + `getEvalQuestions` section 추가 |
| 2 | `src/pages/user/Evaluation.jsx` | Edge Function → calculateResults + 빈 문항 에러 핸들링 |
| 3 | `.github/workflows/deploy.yml` | `VITE_SITE_URL` 환경변수 추가 |

---

## 사용자 수동 작업 (필수)

| # | 작업 | 위치 |
|---|------|------|
| 1 | `20260221210000_add_question_section_qno.sql` 실행 | Supabase SQL Editor |
| 2 | `seed_questions.sql` 실행 (112개 문항 INSERT) | Supabase SQL Editor |
| 3 | GitHub Secret `VITE_SITE_URL` 추가 (`https://competency.dreamitbiz.com`) | GitHub repo Settings → Secrets |

---

## 전체 사이트 점검 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| SPA 라우팅 (404.html) | OK | GitHub Pages SPA redirect 정상 |
| 모든 라우트 정의 (53개) | OK | App.jsx에 누락 없음 |
| 컴포넌트 import | OK | 깨진 import 없음 |
| supabase.js 함수 export | OK | 모든 import 매칭됨 |
| TODO/FIXME 잔여 | OK | 없음 |
| 쿠폰 → 검사 생성 흐름 | OK (DB 필요) | createEvaluation 로직 정상 |
| 결제 → 검사 생성 흐름 | OK (DB 필요) | Checkout → Confirmation → Evaluation 정상 |
| 결과 계산 | **수정됨** | Edge Function → 클라이언트 사이드 |
| deploy.yml 환경변수 | **수정됨** | VITE_SITE_URL 추가 |
| 빈 문항 에러 | **수정됨** | 안내 메시지 표시 |
| `get_average_scores` RPC | 미구현 | 통계 비교 페이지 — 추후 구현 필요 |

---

## 빌드 & 배포

- Vite 빌드: 152 modules, 17.45s
- JS 587KB / CSS 39KB (gzip: 166KB / 8KB)
- GitHub Pages: 커밋 & 푸시 → GitHub Actions 자동 배포
