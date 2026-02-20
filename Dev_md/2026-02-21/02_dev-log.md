# 개발 일지 - 2026-02-21

**프로젝트**: MyCoreCompetency React 전환
**작업자**: Claude AI (Opus 4.6)

---

## 작업 요약

JSP + Java Bean 기반 competency.or.kr을 React SPA로 전환하는 초기 구현을 완료했습니다.
D:/www (dreamitbiz.com) 프로젝트의 코드를 재사용하고, 기존 JSP 파일을 분석하여 37개 React 페이지와 Supabase DB 스키마를 구현했습니다.

---

## 작업 내역

### 1. 프로젝트 셋업 (완료)
- Vite + React 18 프로젝트 생성 (`D:/competency/react-app/`)
- 의존성 설치:
  - `react-router-dom@6` (라우팅)
  - `@supabase/supabase-js@2` (백엔드)
  - `@portone/browser-sdk` (결제)
  - `chart.js@4` + `react-chartjs-2@5` (차트)
- `.env` 환경변수 파일 생성

### 2. 재사용 모듈 복사 및 수정 (완료)
- **D:/www 원본 분석**: supabase.js, auth.js, portone.js, AuthContext, ToastContext, AuthGuard, AdminGuard
- **수정 사항**:
  - `supabase.js`: 주문 CRUD → 검사결제용 함수 (createPurchase, createEvaluation, saveAnswer, getResult 등)
  - `auth.js`: signUp에 MCC 프로필 필드 추가 (성별, 나이, 학력, 직무, 직업, 시/도)
  - `AuthContext.jsx`: usertype 기반 역할 분기 (isAdmin, isGroup)

### 3. 레이아웃 및 CSS (완료)
- **Navbar.jsx**: nav.jsp 기반 MCC 브랜드 네비게이션
  - 역량 코치 / 나의 역량 / 내 프로필 드롭다운
  - usertype별 메뉴 분기
  - 모바일 햄버거 메뉴
- **Footer.jsx**: MyCoreCompetency LLC 저작권 정보
- **CSS 9개 파일**: base, navbar, auth, assessment, result, checkout, group, admin, modal

### 4. 컴포넌트 (완료)
- **AuthGuard.jsx**: 로그인 보호 (D:/www 복사)
- **AdminGuard.jsx**: 관리자 보호 (D:/www 복사)
- **GroupGuard.jsx**: 그룹 관리자 보호 (신규)
- **Modal.jsx**: 역량 설명 모달 (modal.jsp 기반)
- **ProgressBar.jsx**: 검사 진행률 바
- **AssessmentRadio.jsx**: 4점 척도 라디오 (evaluation.jsp 기반)
- **CompetencyChart.jsx**: PolarArea + Doughnut 차트 래퍼
- **CompetencyIcons.jsx**: 역량 카드 + 모달 (Top N 표시)

### 5. 정적 데이터 (완료)
- **competencyInfo.js**: modal.jsp에서 8대 역량 설명 추출
  - COMPETENCY_DATA: 이름, 색상, 요약, 상세 설명
  - COMPETENCY_2015_MAP: 2015 교육과정 매핑
  - NCS_MAP: NCS 직업기초능력 매핑
  - POSITION_LIST: 24개 직무 목록
  - AGE_LIST, EDUCATION_LIST, REGION_LIST: 프로필 옵션

### 6. 페이지 구현 (37개 완료)

#### Auth 페이지 (4개)
| 파일 | 설명 |
|------|------|
| Login.jsx | 2단계 로그인 (Google/Kakao/Email) |
| Register.jsx | 확장 회원가입 (이름, 성별, 나이, 학력, 직무, 직업, 시/도) |
| ForgotPassword.jsx | 비밀번호 재설정 |
| InviteRegister.jsx | 초대 코드 기반 회원가입 |

#### Public 페이지 (4개)
| 파일 | 설명 |
|------|------|
| Home.jsx | 랜딩 페이지 (히어로 + 8역량 그리드 + CTA) |
| Competency.jsx | 8대 핵심역량 소개 (카드 + 모달) |
| Competency2015.jsx | 2015 교육과정 매핑 |
| CompetencyNCS.jsx | NCS 직업기초능력 매핑 |

#### User 페이지 (10개)
| 파일 | 설명 |
|------|------|
| Main.jsx | 대시보드 (활성 검사 이어하기 + 새 검사) |
| Checkout.jsx | 결제 (25,000원 + 쿠폰 입력) |
| Confirmation.jsx | 결제 완료 |
| Evaluation.jsx | 56쌍 문항 풀페이지 검사 (실시간 저장) |
| Result.jsx | PolarArea 차트 + Top3 + 점수 테이블 |
| PrevResult.jsx | 최근 결과 + 이전 결과 링크 |
| ResultAvg.jsx | 통계 비교 |
| History.jsx | 검사 내역 리스트 |
| Profile.jsx | 프로필 수정 |
| DeleteAccount.jsx | 회원 탈퇴 |

#### Group 페이지 (9개)
| 파일 | 설명 |
|------|------|
| GroupMain.jsx | 그룹 대시보드 |
| GroupUserList.jsx | 그룹원 목록 |
| GroupUserResult.jsx | 그룹원 검사 결과 |
| GroupEvalList.jsx | 검사 현황 |
| GroupInvitation.jsx | 초대 발송 |
| GroupOrg.jsx | 조직도 |
| GroupManager.jsx | 관리자 설정 |
| GroupCouponList.jsx | 쿠폰 배포 |
| GroupSettings.jsx | 그룹 설정 |

#### Admin 페이지 (10개)
| 파일 | 설명 |
|------|------|
| Dashboard.jsx | 관리자 대시보드 (통계 카드) |
| UserList.jsx | 회원 관리 |
| UserInfo.jsx | 회원 상세 |
| QuestionList.jsx | 문항 관리 |
| QuestionForm.jsx | 문항 등록 |
| CouponList.jsx | 쿠폰 관리 |
| Statistics.jsx | 통계 |
| BoardList.jsx | 게시판 관리 |
| SurveyList.jsx | 만족도 조사 |
| NoteList.jsx | 메시지/알림 관리 |

### 7. 라우팅 (완료)
- **App.jsx**: 34개 라우트 설정
  - Public: 4개
  - Auth: 4개
  - User (AuthGuard): 10개
  - Group (GroupGuard): 9개
  - Admin (AdminGuard): 10개
- **main.jsx**: BrowserRouter → AuthProvider → ToastProvider → App

### 8. Supabase SQL 마이그레이션 (완료)
- **001_initial_schema.sql** (572줄)
  - 11개 테이블 생성
  - 18개 인덱스
  - 모든 테이블 RLS 적용
  - is_admin() 헬퍼 함수
  - handle_new_user() 트리거 (auth.users INSERT → user_profiles 자동 생성)
  - update_updated_at() 트리거

### 9. 빌드 검증 (완료)
- `npx vite build` 성공
- 138개 모듈 변환
- 번들 크기: JS 523.97 KB (gzip 155.27 KB), CSS 25.56 KB (gzip 5.36 KB)
- 경고: 청크 사이즈 > 500KB (코드 스플리팅으로 추후 최적화)

---

## 참조 자료
- 기존 JSP 소스: D:/competency/tomcat/webapps/ROOT/
- 재사용 원본: D:/www/react-source/src/
- 계획서: C:/Users/ASUS/.claude/plans/playful-cooking-codd.md
