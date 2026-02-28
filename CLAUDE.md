# Claude AI 개발 지침 (CLAUDE.md)

> 마지막 업데이트: 2026-02-23 (세션 19 완료 시점)
> 백업: `Dev_md/CLAUDE.md.bak`

---

## 프로젝트 개요

- **프로젝트명**: MyCoreCompetency — 4차 산업혁명 8대 핵심역량 검사
- **아키텍처**: React 19 SPA + Supabase (PostgreSQL + Auth) + Vite 7
- **배포**: GitHub Pages (GitHub Actions CI/CD) → https://competency.dreamitbiz.com
- **레거시**: `tomcat/` (JSP+Java), `react-app/` (구버전) — 둘 다 비활성, 참조용
- **저장소**: https://github.com/aebonlee/competency (브랜치: main)

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프론트엔드 | React 19 + Vite 7 (SPA) |
| 백엔드 | Supabase (서버리스 PostgreSQL + Auth + Edge Functions) |
| 인증 | Supabase Auth (Email, Google, Kakao OAuth) |
| 결제 | PortOne V1 SDK (KG이니시스) |
| 차트 | Chart.js 4 + react-chartjs-2 5 |
| 테스트 | Vitest 4 + Testing Library |
| 타입 | TypeScript 5 (점진적 전환 중, allowJs: true) |
| 스타일 | CSS 변수 기반 디자인 시스템 (11개 CSS 파일) |

---

## 디렉토리 구조

```
src/
├── pages/           # 52개 페이지 (전체 .jsx)
│   ├── admin/       # 관리자 (21개): Dashboard, UserList, PurchaseList 등
│   ├── auth/        # 인증 (5개): Login, Register, ForgotPassword 등
│   ├── group/       # 그룹 (12개): GroupMain, GroupSettings 등
│   ├── public/      # 공개 (4개): Home, Competency 등
│   └── user/        # 사용자 (10개): Main, Evaluation, Result 등
├── components/      # 재사용 컴포넌트 (10개 .jsx)
├── contexts/        # AuthContext.tsx, ToastContext.tsx
├── utils/           # auth.ts, supabase.ts, portone.ts, export.ts
├── types/           # index.ts (20개 interface)
├── data/            # competencyInfo.js
├── styles/          # 11개 CSS 파일
└── test/            # setup.ts + 4개 테스트 파일 (13 tests)
```

---

## DB 스키마 (Supabase)

핵심 테이블: `user_profiles`, `eval_list`, `eval_questions`, `questions`, `results`, `groups`, `group_members`, `group_subgroups`, `coupons`, `purchases`, `surveys`, `board_posts`, `notes`

- 마이그레이션: `supabase/migrations/` (8개 SQL 파일)
- RLS: 모든 테이블에 Row Level Security 적용

---

## 인증 체계

- `user_profiles.usertype`: 0=개인, 1=그룹, 2=관리자, 3=서브관리자
- `AuthGuard`: 로그인 필수 라우트 보호
- `GroupGuard`: 그룹 관리자 라우트 보호 (usertype 1, 3)
- `AdminGuard`: 시스템 관리자 라우트 보호 (usertype 2)

---

## 결제 시스템

- PortOne V1 SDK (KG이니시스)
- 단일 상품: 핵심역량 검사 25,000원
- 쿠폰: 유효 쿠폰 입력 시 무료 검사
- DB: `purchases` 테이블 (id, user_id, amount, status, payment_id, created_at)
- status: `paid`, `pending`, `failed`, `refunded`

---

## 주요 색상 코드

```
--primary-blue: #106bb5    (주조색)
--accent-red: #DC343B      (포인트)
--c1~c8: 8대 역량별 고유 색상
```

---

## 주의사항

- `.env` 파일은 절대 커밋하지 않음
- 개발일지: `Dev_md/` 디렉토리 (날짜별 세션 로그)
- `react-app/`, `tomcat/` 디렉토리는 untracked 레거시 — 수정 금지
- 한국어 중심 UI (모든 텍스트 한국어)
- 커밋 메시지도 한국어로 작성

---

## TODO List (세션 19 기준)

### 우선순위 HIGH

- [ ] **Supabase 마이그레이션 SQL 실행** — `supabase/migrations/` 내 미실행 SQL 파일들을 Supabase 대시보드에서 실행
  - `20260222_phase2_schema.sql` (Phase 2 스키마)
  - `20260222_rls_policy_fixes.sql` (RLS 정책 수정 7건)
  - `20260223_add_paid_at.sql`
- [ ] **Supabase RPC 함수 생성** — `get_average_scores()` (ResultAvg.jsx에서 전체 사용자 평균 점수 조회용)
- [ ] **결제 시스템 실서비스 검증** — PortOne V1 실결제 테스트 + verifyPayment Edge Function 동작 확인

### 우선순위 MEDIUM

- [ ] **JSX → TSX 전환** — 52개 페이지 + 10개 컴포넌트 (현재 utils/contexts만 TS 완료)
- [ ] **Vitest 테스트 확대** — 현재 4파일 13테스트 → 라우팅, 인증 흐름, 주요 페이지 통합 테스트
- [ ] **관리자 페이지 기능 보강**
  - [ ] PurchaseList: 환불 처리 기능 (status → refunded 변경)
  - [ ] Dashboard "전체 보기" 링크를 `/admin/purchases`로 변경
- [ ] **그룹 DB 스키마 적용** — groups 테이블 확장 컬럼 + group_subgroups 테이블 생성 SQL 실행

### 우선순위 LOW

- [ ] **PWA 지원** — Service Worker + manifest.json
- [ ] **Tomcat 레거시 폐기** — `tomcat/`, `react-app/` 디렉토리 정리 또는 별도 보관
- [ ] **번들 최적화** — index.js 529KB 경고 해소 (manualChunks 설정)
- [ ] **이미지/에셋 최적화** — OG 이미지, favicon 등 최적화

### 완료된 항목 (세션 1~19)

- [x] JSP → React 전면 마이그레이션 (96 JSP → 52 JSX)
- [x] Supabase Auth + OAuth (Google, Kakao)
- [x] PortOne V1 결제 연동 + 쿠폰 시스템
- [x] 관리자 대시보드 전면 재설계 (20개 쿼리, 7개 섹션)
- [x] 결제 내역 관리 페이지 신규 생성 (PurchaseList.jsx — 세션 19)
- [x] 그룹 관리자 페이지 강화 (설정 5섹션, 대시보드, 통계)
- [x] React.lazy 코드 스플리팅 (31개 청크)
- [x] ErrorBoundary + 404 페이지
- [x] SEO 메타 태그 + OG + sitemap
- [x] Google Analytics (UA-162917381-1)
- [x] 접근성(a11y) 개선 5건
- [x] TypeScript 점진적 전환 (utils 4파일 + contexts 2파일 + types)
- [x] Vitest 테스트 13개
- [x] RLS 정책 점검 7건 + 인덱스 7개
- [x] 결제 검증 흐름 (verifyPayment)
- [x] CSV 내보내기 (UserList, CouponList, PurchaseList)
- [x] 사용자 설문 응답 (Survey.jsx)
- [x] 결과 이미지 캡처 (html2canvas)
- [x] 쿠폰 배포 (개인/그룹 일괄)
- [x] GitHub Actions CI/CD (lint + type-check + test + build + deploy)
