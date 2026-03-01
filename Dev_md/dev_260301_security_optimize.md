# 세션 21 개발일지 — 보안 점검 + 코드 최적화

**날짜**: 2026-03-01
**세션**: 21
**작업 유형**: 보안 강화 + 성능 최적화

---

## 1. 작업 개요

전체 코드베이스에 대한 **보안 점검** 및 **코드 최적화**를 수행.
보안 에이전트와 최적화 에이전트를 병렬로 실행하여 종합 진단 후, 발견된 이슈를 우선순위별로 수정.

---

## 2. 보안 점검 결과 및 수정

### 2-1. 관리자 이메일 하드코딩 제거 (CRITICAL)
- **파일**: `src/contexts/AuthContext.tsx`
- **문제**: `ADMIN_EMAILS` 배열에 관리자 이메일 3개가 클라이언트 코드에 하드코딩
- **위험**: 소스코드에서 관리자 계정 식별 가능, 이메일 위조 시 관리자 권한 획득 가능성
- **수정**: 이메일 기반 관리자 체크 제거, `usertype === 2`만으로 판단

### 2-2. SVG XSS 취약점 해소 (HIGH)
- **파일**: `src/pages/public/CompetencyNCS.jsx`, `src/pages/public/Competency2015.jsx`
- **문제**: `dangerouslySetInnerHTML`로 SVG를 렌더링 → XSS 공격 가능성
- **수정**:
  - CompetencyNCS: `dompurify` 패키지 도입, SVG를 `DOMPurify.sanitize()`로 살균 후 렌더링
  - Competency2015: 정적 SVG이므로 `<object>` 태그로 안전 렌더링 전환

### 2-3. CSP(Content Security Policy) 헤더 추가 (MEDIUM)
- **파일**: `index.html`
- **문제**: 보안 헤더 미설정 → 클릭재킹, 스크립트 인젝션 가능
- **수정**: `<meta http-equiv="Content-Security-Policy">` 추가
  - `script-src`: self + cdn.iamport.kr + googletagmanager
  - `style-src`: self + unsafe-inline + fonts.googleapis.com
  - `connect-src`: self + *.supabase.co + google-analytics
  - `frame-src`: self + *.iamport.kr

### 2-4. signup_domain 전달 추가
- **파일**: `src/utils/auth.ts`
- **수정**: `signUp()` 호출 시 Auth 메타데이터 + `user_profiles` insert에 `signup_domain: window.location.hostname` 추가

---

## 3. 코드 최적화 결과 및 수정

### 3-1. N+1 쿼리 제거 (CRITICAL)
- **파일**: `src/pages/group/GroupUserList.jsx`
- **문제**: 그룹 멤버별로 `eval_list` 개별 쿼리 → 100명 = 101쿼리
- **수정**: `.in('user_id', userIds)` 단일 쿼리로 변경 → 2쿼리로 감소 (95%+ 절감)

### 3-2. 무제한 조회 제한 (CRITICAL)
- **파일**: `src/pages/user/ResultAvg.jsx`
- **문제**: `results` 테이블 전체 조회 (limit 없음) → 메모리 폭발 위험
- **수정**: `.order('created_at', { ascending: false }).limit(10000)` 추가

### 3-3. 번들 분할 — manualChunks (HIGH)
- **파일**: `vite.config.js`
- **문제**: 모든 의존성이 단일 `index.js`(529KB)에 번들링
- **수정**: `manualChunks` 설정 추가
  - `vendor-react`: react, react-dom, react-router-dom (34KB)
  - `vendor-charts`: chart.js, react-chartjs-2 (196KB)
  - `vendor-supabase`: @supabase/supabase-js
- **결과**: index.js **529KB → 322KB** (39% 감소), 500KB 경고 해소

---

## 4. 검증 결과

| 항목 | 결과 |
|------|------|
| Vite 빌드 | ✅ 성공 (3.07s, 경고 0건) |
| TypeScript | ✅ 에러 없음 |
| ESLint | ✅ 에러 없음 |
| Vitest | ✅ 18/18 통과 |

---

## 5. 보안 점검 — 양호 항목

- `.env` gitignore 적용: ✅
- XSS (기타): ✅ dangerouslySetInnerHTML 미사용 (SVG 제외)
- SQL Injection: ✅ Supabase SDK 파라미터화 쿼리
- RLS (Row Level Security): ✅ 전 테이블 적용
- Auth Guard: ✅ AuthGuard/AdminGuard/GroupGuard 정상
- useEffect 클린업: ✅ 구독 해제, 타이머 정리 정상
- 메모리 누수: ✅ 없음

---

## 6. 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/contexts/AuthContext.tsx` | ADMIN_EMAILS 하드코딩 제거 |
| `src/pages/public/CompetencyNCS.jsx` | DOMPurify SVG 살균 |
| `src/pages/public/Competency2015.jsx` | `<object>` 태그 전환 |
| `src/pages/group/GroupUserList.jsx` | N+1 → 단일 .in() 쿼리 |
| `src/pages/user/ResultAvg.jsx` | .limit(10000) 추가 |
| `src/utils/auth.ts` | signup_domain 전달 |
| `index.html` | CSP 메타태그 추가 |
| `vite.config.js` | manualChunks 번들 분할 |
| `package.json` | dompurify 의존성 추가 |

---

## 7. 향후 개선 사항 (미수정, LOW 우선순위)

- 미사용 `_user` 변수 정리 (Dashboard, UserList, Statistics)
- 중복 페이지네이션 → `<Pagination />` 컴포넌트 추출
- 날짜 포맷 함수 → `utils/formatting.ts` 통합
- auth/user 페이지 lazy-load 적용
- console.warn/error 프로덕션 제거
- 이미지(PNG) 최적화
