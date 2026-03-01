# 세션 22 개발일지 — 전체 사이트 점검 + 이슈 수정

**날짜**: 2026-03-01
**세션**: 22
**작업 유형**: 종합 점검 + 버그 수정 + SEO 보강

---

## 1. 작업 개요

세션 21(보안 강화 + 코드 최적화) 완료 후, 5개 영역에 대한 **전체 사이트 종합 점검**을 수행하고 발견된 이슈를 순차 수정.

**점검 영역**: 라이브 사이트 & SEO, 라우팅 & 링크, DB 스키마 & RLS, CI/CD & 배포, 의존성 & 보안

---

## 2. 점검 결과 요약

| 영역 | 발견 이슈 | 수정 완료 | 수동 필요 |
|------|----------|----------|----------|
| 라이브 사이트 & SEO | 8건 | 6건 | 2건 |
| 라우팅 & 링크 | 1건 | 1건 | - |
| DB 스키마 & RLS | 7건 | 7건 | - |
| CI/CD & 배포 | 1건 | 1건 | - |
| 의존성 & 보안 | 2건 | 2건 | - |

---

## 3. 수정 내역

### 3-1. robots.txt + .nojekyll 생성
- `public/robots.txt` — sitemap 참조 포함
- `public/.nojekyll` — GitHub Pages Jekyll 처리 방지

### 3-2. npm audit fix
- **minimatch** ReDoS 취약점 3건 해소
- **rollup** 경로 탐색 취약점 해소
- 결과: 0 vulnerabilities

### 3-3. GroupMain.jsx 컬럼명 수정
- **파일**: `src/pages/group/GroupMain.jsx`
- **문제**: `.select('id, used')` → 스키마는 `is_used`
- **수정**: `.select('id, is_used')` + `.filter(c => c.is_used)`

### 3-4. Dashboard 전체보기 링크 수정
- **파일**: `src/pages/admin/Dashboard.jsx`
- **문제**: "최근 결제" 전체 보기 링크가 `/admin/statistics`
- **수정**: `/admin/purchases`로 변경

### 3-5. DB 마이그레이션 SQL 정비
- **수정**: `20260222_phase2_schema.sql` — `board_posts.views` ALTER → ADD COLUMN IF NOT EXISTS
- **신규**: `20260301_schema_fixes.sql` 통합 마이그레이션
  - `group_org` 테이블 (조직도) + RLS 4정책 + 인덱스 2개
  - `user_profiles.signup_domain` 컬럼
  - `coupons.assigned_user` 컬럼
  - `check_user_status` RPC 함수 (사용자 상태 확인 + 방문 도메인 추적)

### 3-6. SEO 메타태그 보강
- **파일**: `index.html`
- **추가**:
  - `og:locale` → `ko_KR`
  - Twitter Card 메타태그 4개 (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
  - `<link rel="canonical">`

### 3-7. 페이지별 document.title 동적 변경
- **신규**: `src/utils/usePageTitle.js` 훅 생성
- **적용 페이지** (8개):
  - Home → 기본 타이틀
  - Competency → "4차산업혁명 8대 핵심역량"
  - Competency2015 → "2015교육과정 핵심역량"
  - CompetencyNCS → "NCS 직업기초능력"
  - Login → "로그인"
  - Register → "회원가입"
  - Main → "검사하기"
  - ResultAvg → "나이별 & 직무별 통계"

---

## 4. 검증 결과

| 항목 | 결과 |
|------|------|
| ESLint | ✅ 에러 없음 |
| TypeScript | ✅ 에러 없음 |
| Vitest | ✅ 18/18 통과 |
| Vite 빌드 | ✅ 성공 (3.75s, 경고 0건) |
| npm audit | ✅ 0 vulnerabilities |

---

## 5. 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `public/robots.txt` | 신규 생성 |
| `public/.nojekyll` | 신규 생성 |
| `package-lock.json` | npm audit fix |
| `index.html` | Twitter Card, canonical, og:locale 추가 |
| `src/utils/usePageTitle.js` | 신규 — 페이지별 title 훅 |
| `src/pages/public/Home.jsx` | usePageTitle 적용 |
| `src/pages/public/Competency.jsx` | usePageTitle 적용 |
| `src/pages/public/Competency2015.jsx` | usePageTitle 적용 |
| `src/pages/public/CompetencyNCS.jsx` | usePageTitle 적용 |
| `src/pages/auth/Login.jsx` | usePageTitle 적용 |
| `src/pages/auth/Register.jsx` | usePageTitle 적용 |
| `src/pages/user/Main.jsx` | usePageTitle 적용 |
| `src/pages/user/ResultAvg.jsx` | usePageTitle 적용 |
| `src/pages/group/GroupMain.jsx` | `used` → `is_used` 수정 |
| `src/pages/admin/Dashboard.jsx` | 결제 전체보기 링크 수정 |
| `supabase/migrations/20260222_phase2_schema.sql` | board_posts.views ADD COLUMN 수정 |
| `supabase/migrations/20260301_schema_fixes.sql` | 신규 — 누락 스키마 통합 |

---

## 6. 남은 수동 작업

| # | 작업 | 설명 |
|---|------|------|
| 1 | `og:image` 이미지 생성 | `public/images/meta_main.jpg` (1200x630px) 직접 생성 배치 |
| 2 | GA4 전환 | Google Analytics `G-XXXXXXXXX` 속성 생성 후 index.html 교체 |
| 3 | 마이그레이션 실행 | Supabase 대시보드에서 `20260301_schema_fixes.sql` 실행 |
