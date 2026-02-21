# 개발 일지 - 2026-02-21

**프로젝트**: MyCoreCompetency React 전환
**작업자**: Claude AI (Opus 4.6)
**리포지토리**: https://github.com/aebonlee/competency
**도메인**: competency.dreamitbiz.com

---

## 작업 요약

JSP + Java Bean 기반 competency.or.kr을 React SPA로 전환하는 전체 초기 구현을 완료했습니다.
D:/www (dreamitbiz.com) 프로젝트의 코드를 재사용하고, 기존 JSP 파일을 분석하여 37개 React 페이지를 구현했습니다.
Supabase DB 마이그레이션, GitHub 리포지토리 설정, GitHub Pages 자동 배포까지 완료했습니다.

---

## 1단계: 프로젝트 셋업

### 1.1 React 프로젝트 생성 (완료)
- Vite + React 18 프로젝트: `D:/competency/react-app/`
- 의존성 설치:
  - `react-router-dom@6` (라우팅)
  - `@supabase/supabase-js@2` (백엔드)
  - `@portone/browser-sdk` (결제)
  - `chart.js@4` + `react-chartjs-2@5` (차트)
- `.env` 환경변수 파일 생성 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_PORTONE_STORE_ID, VITE_PORTONE_CHANNEL_KEY)

### 1.2 디렉토리 구조
```
src/
├── main.jsx, App.jsx
├── contexts/     (AuthContext, ToastContext)
├── utils/        (supabase.js, auth.js, portone.js)
├── components/   (AuthGuard, AdminGuard, GroupGuard, Modal, ProgressBar, AssessmentRadio, CompetencyChart, CompetencyIcons)
├── components/layout/ (Navbar, Footer)
├── data/         (competencyInfo.js)
├── pages/public/ (Home, Competency, Competency2015, CompetencyNCS)
├── pages/auth/   (Login, Register, ForgotPassword, InviteRegister)
├── pages/user/   (Main, Checkout, Confirmation, Evaluation, Result, PrevResult, ResultAvg, History, Profile, DeleteAccount)
├── pages/group/  (GroupMain, GroupUserList, GroupUserResult, GroupEvalList, GroupInvitation, GroupOrg, GroupManager, GroupCouponList, GroupSettings)
├── pages/admin/  (Dashboard, UserList, UserInfo, QuestionList, QuestionForm, CouponList, Statistics, BoardList, SurveyList, NoteList)
└── styles/       (base, navbar, auth, assessment, result, checkout, group, admin, modal)
```

---

## 2단계: 재사용 모듈 복사 및 수정 (완료)

D:/www/react-source/src/ 에서 복사 후 MCC 용으로 수정:

| 파일 | 수정 내용 |
|------|----------|
| utils/supabase.js | 주문 CRUD → createPurchase, createEvaluation, saveAnswer, getResult 등 |
| utils/auth.js | signUp에 MCC 프로필 필드 추가 (성별, 나이, 학력, 직무, 직업, 시/도), deleteAccount 추가 |
| utils/portone.js | 그대로 복사 (한국어 에러 메시지) |
| contexts/AuthContext.jsx | usertype 기반 역할 분기 추가 (isAdmin, isGroup) |
| contexts/ToastContext.jsx | 그대로 복사 |
| components/AuthGuard.jsx | 그대로 복사 |
| components/AdminGuard.jsx | 그대로 복사 |

---

## 3단계: 레이아웃 및 CSS (완료)

### Navbar.jsx (nav.jsp 기반)
- MCC 로고 + 역량 코치 / 나의 역량 / 내 프로필 드롭다운
- usertype별 메뉴 분기 (개인→/main, 그룹→/group, 관리자→/admin)
- 모바일 햄버거 메뉴

### Footer.jsx
- MyCoreCompetency LLC 저작권 정보

### CSS 9개 파일
| 파일 | 내용 |
|------|------|
| base.css | CSS 변수, 리셋, 컨테이너, 버튼, 폼, 테이블, 스피너, 토스트, 배지, 반응형 |
| navbar.css | 고정 네비바 3종 (메인/그룹/관리자), 드롭다운, 모바일 |
| auth.css | 인증 카드 디자인, MCC 브랜딩 |
| assessment.css | 풀페이지 검사, 스크롤 인디케이터, 4크기 라디오 원, 진행률 바 |
| result.css | 차트 섹션, Top3 그리드, 점수 테이블, 인포그래픽 |
| checkout.css | 2단 결제 레이아웃, 결제수단, 쿠폰, 주문요약 |
| group.css | 그룹 통계 그리드, 유저 리스트, 초대 폼, 조직도 |
| admin.css | 대시보드 카드 (파랑/초록/주황/빨강), 관리자 도구바, 페이지네이션 |
| modal.css | 오버레이 + 슬라이드업 애니메이션 |

---

## 4단계: 컴포넌트 구현 (완료)

| 컴포넌트 | 설명 |
|----------|------|
| GroupGuard.jsx | 그룹 관리자 보호 (usertype 1, 3 또는 관리자) — 신규 |
| Modal.jsx | 역량 설명 모달 (modal.jsp 기반) |
| ProgressBar.jsx | 검사 진행률 바 (현재/전체 + 퍼센트) |
| AssessmentRadio.jsx | 4점 척도 라디오 (값: 30, 20, 10, 0) |
| CompetencyChart.jsx | PolarArea + Doughnut 차트 래퍼 (Chart.js) |
| CompetencyIcons.jsx | Top N 역량 카드 + 클릭 시 모달 |

---

## 5단계: 정적 데이터 (완료)

**competencyInfo.js** — modal.jsp에서 추출:
- COMPETENCY_DATA: 8대 역량 (이름, 색상, 요약, 상세 설명)
- COMPETENCY_2015_MAP: 2015 교육과정 핵심역량 매핑
- NCS_MAP: NCS 직업기초능력 매핑
- POSITION_LIST: 24개 직무 목록
- AGE_LIST: 나이대 코드
- EDUCATION_LIST: 학력 코드
- REGION_LIST: 18개 시/도

---

## 6단계: 페이지 구현 (37개 완료)

### Auth 페이지 (4개)
| 파일 | 설명 |
|------|------|
| Login.jsx | 2단계 로그인 (Google/Kakao/Email 선택 → 이메일 입력) |
| Register.jsx | 확장 회원가입 (이름, 이메일, 비밀번호, 성별, 나이, 학력, 직무, 직업, 시/도, 휴대전화) |
| ForgotPassword.jsx | 비밀번호 재설정 이메일 전송 |
| InviteRegister.jsx | 초대 쿠폰 코드 기반 회원가입 |

### Public 페이지 (4개)
| 파일 | 설명 |
|------|------|
| Home.jsx | 랜딩 페이지 (그라디언트 히어로 + 8역량 그리드 카드 + CTA) |
| Competency.jsx | 8대 핵심역량 소개 (클릭 가능 카드 → Modal) |
| Competency2015.jsx | 2015 교육과정 핵심역량 매핑 표시 |
| CompetencyNCS.jsx | NCS 직업기초능력 매핑 표시 |

### User 페이지 (10개)
| 파일 | 설명 |
|------|------|
| Main.jsx | 대시보드 (활성 검사 이어하기 + 카드결제 25,000원 + 쿠폰) |
| Checkout.jsx | 단일 상품 결제 (PortOne V2 카드결제) |
| Confirmation.jsx | 결제 완료 → 검사 시작 안내 |
| Evaluation.jsx | 56쌍 문항 풀페이지 검사 (인트로 → 가이드 → 문항 카드 + 실시간 저장 + 진행률 바) |
| Result.jsx | PolarArea 차트 + Top3 역량 아이콘 + 점수 테이블 + 인포그래픽 |
| PrevResult.jsx | 최근 결과 차트 + 이전 결과 링크 |
| ResultAvg.jsx | 통계 비교 (RPC: get_average_scores) |
| History.jsx | 검사 내역 리스트 (진행률 배지 + 결과보기/이어하기 버튼) |
| Profile.jsx | 모든 프로필 필드 수정 + 아바타 이니셜 |
| DeleteAccount.jsx | "회원탈퇴" 확인 입력 기반 계정 삭제 |

### Group 페이지 (9개)
| 파일 | 설명 |
|------|------|
| GroupMain.jsx | 그룹 대시보드 (4개 통계 카드 + 6개 퀵링크) |
| GroupUserList.jsx | 그룹원 목록 (검색, 상태 배지, 결과 링크) |
| GroupUserResult.jsx | 그룹원 검사 결과 (PolarArea 차트 + 등급 배지) |
| GroupEvalList.jsx | 검사 현황 리스트 |
| GroupInvitation.jsx | 이메일 초대 폼 + 초대 목록 (상태 배지) |
| GroupOrg.jsx | 재귀 OrgNode 기반 조직도 |
| GroupManager.jsx | 서브그룹 관리자 지정/해제 |
| GroupCouponList.jsx | 쿠폰 배포 (4개 통계 + 배포 폼 + 목록) |
| GroupSettings.jsx | 그룹 설정 수정 + 그룹 삭제 (Danger Zone) |

### Admin 페이지 (10개)
| 파일 | 설명 |
|------|------|
| Dashboard.jsx | 4개 통계 카드 (파랑/초록/주황/빨강) + 최근 가입자/검사 |
| UserList.jsx | 페이지네이션 회원 목록 (검색, usertype 배지) |
| UserInfo.jsx | 회원 상세/수정/삭제 + 검사 이력 |
| QuestionList.jsx | 문항 목록 (검색, 카테고리 필터) |
| QuestionForm.jsx | 문항 등록/수정 폼 |
| CouponList.jsx | 쿠폰 생성 (XXXX-XXXX-XXXX) + 통계 + 목록 |
| Statistics.jsx | 연령/직무/지역 분포 가로 바 차트 |
| BoardList.jsx | 게시판 관리 (목록 + 삭제) |
| SurveyList.jsx | 만족도 조사 (평균 별점 + 분포 차트 + 목록) |
| NoteList.jsx | 메시지/알림 관리 (필터 + 유형 배지 + 읽음 상태) |

---

## 7단계: 라우팅 (완료)

**App.jsx** — 34개 라우트:
- Public: 4개 (/, /competency, /competency/2015, /competency/ncs)
- Auth: 4개 (/login, /register, /forgot-password, /invite/:code)
- User (AuthGuard): 10개 (/main, /checkout, /confirmation, /evaluation/:evalId, /result/:evalId, /results, /results/average, /history, /profile, /delete-account)
- Group (GroupGuard): 9개 (/group, /group/users, /group/users/:id/result, /group/evals, /group/invite, /group/org, /group/manager, /group/coupons, /group/settings)
- Admin (AdminGuard): 10개 (/admin, /admin/users, /admin/users/:id, /admin/questions, /admin/questions/new, /admin/coupons, /admin/statistics, /admin/board, /admin/surveys, /admin/notes)

**main.jsx**: StrictMode → BrowserRouter → AuthProvider → ToastProvider → App

---

## 8단계: Supabase DB 마이그레이션 (완료)

### 초기 시도 (실패)
- `001_initial_schema.sql` (572줄) — `CREATE TABLE IF NOT EXISTS user_profiles` 사용
- 공유 Supabase 프로젝트에 이미 `user_profiles` 테이블 존재 (dreamitbiz.com)
- `IF NOT EXISTS`로 테이블 생성 건너뜀 → `COMMENT ON COLUMN usertype` 에러 (컬럼 부재)

### 수정 마이그레이션 (성공)
- `20260220230614_competency_schema.sql`로 교체
- **ALTER TABLE** 방식으로 기존 `user_profiles`에 11개 MCC 컬럼 추가:
  - gender, phone, job, position, country, age, edulevel, usertype, grp, subgrp, deleted_at
- **CREATE TABLE IF NOT EXISTS**로 9개 신규 테이블 생성:
  - eval_list, questions, eval_questions, results, groups, coupons, purchases, surveys, notes
- 17개 인덱스 + RLS 정책 + `is_admin()` 함수 + `update_updated_at()` 트리거
- 기존 RLS 정책과 충돌 방지를 위해 `DO $$ ... IF NOT EXISTS` 래핑

### 마이그레이션 적용 결과
```
Supabase 프로젝트: hcmgdztsgjvzcyxyayaj (South Asia - Mumbai)
신규 테이블: eval_list, eval_questions, questions, results, groups, coupons, purchases, surveys, notes
기존 테이블 수정: user_profiles (+11 columns)
```

---

## 9단계: GitHub 리포지토리 & 배포 (완료)

### Git 초기화 및 푸시
```
리포지토리: https://github.com/aebonlee/competency
브랜치: main
```

### 커밋 이력
| 커밋 해시 | 메시지 |
|-----------|--------|
| c2fea6a | Initial commit (GitHub에서 생성) |
| 47e0b0f | Create CNAME |
| 3889a7a | feat: MyCoreCompetency React SPA 초기 구현 (80 files, 13,689 lines) |
| 38cab26 | ci: GitHub Pages 자동 배포 설정 |
| 5b45685 | db: Supabase 마이그레이션 적용 (공유 DB 호환) |

### GitHub Pages 배포 설정
- `.github/workflows/deploy.yml` — GitHub Actions 워크플로우
  - main 브랜치 push 시 자동: npm ci → npm run build → deploy-pages
- `public/404.html` — SPA 라우팅 리다이렉트
- `index.html` — SPA 핸들러 스크립트 추가
- `public/CNAME` — 커스텀 도메인: competency.dreamitbiz.com
- **설정 필요**: GitHub Settings > Pages > Source를 "GitHub Actions"로 변경

---

## 10단계: 빌드 검증 (완료)

| 항목 | 결과 |
|------|------|
| 빌드 명령 | `npx vite build` |
| 상태 | 성공 |
| Vite 버전 | 7.3.1 |
| 총 모듈 | 138개 |
| 빌드 시간 | 14.31초 |
| JS 번들 | 523.97 KB (gzip: 155.27 KB) |
| CSS 번들 | 25.56 KB (gzip: 5.36 KB) |
| HTML | 0.46 KB (gzip: 0.29 KB) |
| 경고 | 청크 > 500KB (Chart.js 포함, 코드 스플리팅으로 추후 최적화) |

---

## 프로젝트 통계

| 항목 | 수량 |
|------|------|
| 총 소스 파일 | 63개 |
| 페이지 컴포넌트 | 37개 |
| 재사용 컴포넌트 | 8개 |
| CSS 파일 | 9개 |
| 유틸리티 모듈 | 3개 |
| 라우트 | 34개 |
| DB 테이블 | 9개 신규 + 1개 수정 |
| DB 인덱스 | 17개 |
| RLS 정책 | 전 테이블 적용 |
| Git 커밋 | 5개 |
| 총 코드 줄수 | ~13,700줄 |

---

## 해결한 문제들

### 1. 공유 Supabase 프로젝트 충돌
- **문제**: dreamitbiz.com과 같은 Supabase 프로젝트 사용, `user_profiles` 이미 존재
- **해결**: `CREATE TABLE IF NOT EXISTS` → `ALTER TABLE ADD COLUMN IF NOT EXISTS`로 변경

### 2. 마이그레이션 파일명 형식
- **문제**: `001_initial_schema.sql` → Supabase CLI에서 타임스탬프 형식 요구
- **해결**: `supabase migration new` 명령으로 올바른 형식 생성 후 내용 교체

### 3. GitHub 원격 브랜치 충돌
- **문제**: 원격에 README.md, CNAME이 이미 존재하여 push 거부
- **해결**: `--allow-unrelated-histories`로 병합 → README.md 충돌 해결 → 재 push

### 4. 기존 RLS 정책 충돌
- **문제**: `user_profiles`에 dreamitbiz 프로젝트의 RLS 정책이 이미 적용됨
- **해결**: `DO $$ IF NOT EXISTS` 래핑으로 기존 정책이 있으면 건너뛰기

---

## 11단계: 전체 페이지 디자인 통일 (2026-02-21 후속 작업)

교육부(Competency2015) 페이지와 NCS 페이지에 적용된 `page-wrapper` + `page-header` (파란 배너) 디자인 패턴을
전체 페이지에 일관되게 적용했습니다.

### 11.1 기준 디자인 패턴 (Competency, Competency2015, CompetencyNCS)
- `page-wrapper` + `page-header` (파란 배너) 구조
- SVG 아이콘/일러스트 활용
- 역량 컬러 뱃지 (`comp.color + '22'` 반투명 배경)
- `.card` 기반 레이아웃
- CSS 클래스 기반 스타일링 (인라인 스타일 최소화)

### 11.2 적용 내역

| 우선순위 | 대상 | 변경 내용 | 수정 파일 수 |
|----------|------|----------|-------------|
| 1 | Result 계열 4개 | `result-page`/`result-header` → `page-wrapper`+`page-header`+`result-page` | 4 JSX + 1 CSS |
| 2 | Group 페이지 9개 | `group-page`/`group-header` → `page-wrapper`+`page-header`+`group-page` | 9 JSX + 1 CSS |
| 3 | Admin 페이지 10개 | `admin-page`/`admin-header` → `page-wrapper`+`page-header`+`admin-page` | 10 JSX + 1 CSS |
| 4 | Home 역량 그리드 | 숫자(`comp.id`) → SVG 아이콘 (`idea.svg`, `plan.svg` 등) | 1 JSX + 1 CSS |
| 5 | Confirmation | 인라인 패딩 → `page-header` 파란 배너 추가 | 1 JSX + 1 CSS |
| 6 | 인라인 스타일 정리 | Main.jsx, CompetencyNCS.jsx 인라인 스타일 → CSS 클래스 전환 | 2 JSX + 1 CSS |

### 11.3 CSS 변경 요약

| CSS 파일 | 변경 내용 |
|----------|----------|
| result.css | `result-page` padding 조정, `stat-grid-4`/`stat-cell`/`stat-dot` 추가 |
| group.css | `group-page` padding 조정, `group-header` → `group-header-bar` |
| admin.css | `admin-page` padding 조정, `admin-header` → `admin-header-bar` |
| home.css | `.home-comp-icon img` 추가 (SVG 아이콘 흰색 필터) |
| base.css | `.confirmation-icon` 추가 |
| checkout.css | `.main-*` 클래스 추가 (Main 대시보드용), `.coupon-input` 추가, 반응형 그리드 |

### 11.4 총 수정 파일: 35개
- JSX 페이지: 29개 (Result 4 + Group 9 + Admin 10 + Home 1 + Confirmation 1 + Main 1 + CompetencyNCS 1 + Competency 1 + Competency2015 1)
- CSS 스타일: 6개 (result, group, admin, home, base, checkout)

### 11.5 빌드 검증
| 항목 | 결과 |
|------|------|
| 빌드 명령 | `npm run build` |
| 상태 | 성공 |
| 총 모듈 | 140개 |
| JS 번들 | 533.81 KB (gzip: 157.82 KB) |
| CSS 번들 | 33.67 KB (gzip: 6.94 KB) |

---

## 후속 작업 (TODO)

### 필수
- [ ] GitHub Settings > Pages > Source를 "GitHub Actions"로 변경
- [ ] `.env`에 Supabase URL/anon key 설정
- [ ] PortOne V2 스토어/채널 키 설정
- [ ] 실제 데이터로 E2E 테스트 (회원가입 → 결제 → 검사 → 결과)
- [ ] 기존 MySQL 데이터 마이그레이션

### 권장
- [ ] 코드 스플리팅 (React.lazy + Suspense)
- [ ] 에러 바운더리 추가
- [x] ~~이미지 자산 이전 (MCC 로고, 역량 아이콘)~~ → Home 그리드에 SVG 아이콘 적용 완료
- [ ] Edge Function: calculate_results (서버사이드 점수 계산)
- [ ] SEO 메타태그 (react-helmet)

### 선택
- [ ] PWA 설정
- [ ] 테스트 코드 (Jest + RTL)
- [ ] 성능 최적화 (이미지 lazy loading, 메모이제이션)

---

## 참조 자료
- 기존 JSP 소스: `D:/competency/tomcat/webapps/ROOT/`
- 재사용 원본: `D:/www/react-source/src/`
- 계획서: `C:/Users/ASUS/.claude/plans/playful-cooking-codd.md`
- Supabase 대시보드: https://supabase.com/dashboard/project/hcmgdztsgjvzcyxyayaj
- GitHub: https://github.com/aebonlee/competency
