# MyCoreCompetency React 전환 계획서

**작성일**: 2026-02-21
**프로젝트**: MyCoreCompetency (www.competency.or.kr)
**목표**: Tomcat + JSP + Java Bean → React SPA 전환

---

## 1. 프로젝트 배경

### 현행 시스템
- **서버**: Apache Tomcat 8.x
- **프레임워크**: JSP + Java Bean (MVC 패턴)
- **DB**: MySQL
- **결제**: KG이니시스 (구버전 API)
- **호스팅**: 단독 서버

### 전환 사유
1. JSP/Java Bean 기반 레거시 코드의 유지보수 어려움
2. www.dreamitbiz.com(D:/www) 프로젝트와 기술 스택 통일 필요
3. 모바일 반응형 UX 개선
4. Supabase 기반 서버리스 아키텍처로 운영 비용 절감
5. 현대적 프론트엔드 도구 활용 (React, Vite, Chart.js)

---

## 2. 기술 스택 결정

| 항목 | 선택 | 대안 검토 | 선택 사유 |
|------|------|----------|----------|
| 프론트엔드 | React 18 + Vite | Next.js | www 프로젝트와 동일 스택, SPA 충분 |
| 백엔드 | Supabase | Firebase, 자체 API | www 프로젝트와 통일, PostgreSQL |
| 인증 | Supabase Auth | Auth0 | 비용 효율, 통합 |
| 결제 | PortOne V2 | 토스페이먼츠 | 기존 KG이니시스 연동 유지 |
| 차트 | Chart.js | D3.js, Recharts | 경량, 기존 JSP에서도 사용 |
| 라우팅 | React Router v6 | TanStack Router | www 프로젝트와 동일 |

---

## 3. DB 스키마 설계

### 기존 MySQL → Supabase PostgreSQL 매핑

| 기존 테이블 | 새 테이블 | 변경사항 |
|-------------|----------|---------|
| member | user_profiles | auth.users 연동, UUID PK |
| eval_list | eval_list | 구조 유지, user_id → UUID FK |
| eval_q | eval_questions | 컬럼명 정규화 |
| questions | questions | 구조 유지 |
| result | results | point1~point8 유지 |
| groupinfo | groups | owner_id UUID 변경 |
| coupon | coupons | used_by 추가 |
| payment | purchases | PortOne V2 payment_id |
| survey | surveys | 구조 유지 |
| board | boards | board_type 추가 |
| note | notes | sender_id/receiver_id UUID |

### RLS (Row Level Security) 정책
- 모든 테이블에 RLS 적용
- `is_admin()` 헬퍼 함수로 관리자 권한 확인
- 사용자는 자신의 데이터만 읽기/수정 가능
- 관리자는 모든 데이터 접근 가능

---

## 4. 페이지 매핑 (JSP → React)

### Public 페이지
| JSP | React | 경로 |
|-----|-------|------|
| intro.jsp | Home.jsx | / |
| competency.jsp | Competency.jsx | /competency |
| competency-2015.jsp | Competency2015.jsx | /competency/2015 |
| competency-NCS.jsp | CompetencyNCS.jsx | /competency/ncs |

### Auth 페이지
| JSP | React | 경로 |
|-----|-------|------|
| login.jsp | Login.jsx | /login |
| signupForm.jsp | Register.jsx | /register |
| forgot.jsp | ForgotPassword.jsx | /forgot-password |
| invSignupForm.jsp | InviteRegister.jsx | /invite/:code |

### User 페이지
| JSP | React | 경로 |
|-----|-------|------|
| main.jsp | Main.jsx | /main |
| checkout.jsp | Checkout.jsx | /checkout |
| confirmation.jsp | Confirmation.jsx | /confirmation |
| evaluation.jsp | Evaluation.jsx | /evaluation/:evalId |
| result.jsp | Result.jsx | /result/:evalId |
| prevResult.jsp | PrevResult.jsx | /results |
| resultAvg.jsp | ResultAvg.jsx | /results/average |
| history.jsp | History.jsx | /history |
| modifyForm.jsp | Profile.jsx | /profile |
| deleteForm.jsp | DeleteAccount.jsx | /delete-account |

### Group 페이지 (9개)
| JSP | React | 경로 |
|-----|-------|------|
| groupMain.jsp | GroupMain.jsx | /group |
| groupUserList.jsp | GroupUserList.jsx | /group/users |
| groupUserResult.jsp | GroupUserResult.jsx | /group/users/:id/result |
| groupEvalList.jsp | GroupEvalList.jsx | /group/evals |
| groupInvitation.jsp | GroupInvitation.jsx | /group/invite |
| groupOrg.jsp | GroupOrg.jsx | /group/org |
| groupManager.jsp | GroupManager.jsx | /group/manager |
| groupCouponList.jsp | GroupCouponList.jsx | /group/coupons |
| groupModifyForm.jsp | GroupSettings.jsx | /group/settings |

### Admin 페이지 (10개)
| JSP | React | 경로 |
|-----|-------|------|
| dashboard.jsp | Dashboard.jsx | /admin |
| userList.jsp | UserList.jsx | /admin/users |
| userInfo.jsp | UserInfo.jsx | /admin/users/:id |
| questionList.jsp | QuestionList.jsx | /admin/questions |
| questionRegistForm.jsp | QuestionForm.jsx | /admin/questions/new |
| couponList.jsp | CouponList.jsx | /admin/coupons |
| statistics.jsp | Statistics.jsx | /admin/statistics |
| boardList.jsp | BoardList.jsx | /admin/board |
| surveyList.jsp | SurveyList.jsx | /admin/surveys |
| noteList.jsp | NoteList.jsx | /admin/notes |

---

## 5. 재사용 모듈 (D:/www 프로젝트)

| 원본 파일 | 수정 사항 |
|-----------|----------|
| utils/supabase.js | 주문 함수 → 검사결제용 변경 |
| utils/auth.js | 프로필 필드 확장 (성별, 나이, 직무 등) |
| utils/portone.js | 그대로 사용 |
| contexts/AuthContext.jsx | usertype 역할 분기 추가 |
| contexts/ToastContext.jsx | 그대로 사용 |
| components/AuthGuard.jsx | 그대로 사용 |
| components/AdminGuard.jsx | 그대로 사용 |
| styles/auth.css | MCC 브랜딩 적용 |

---

## 6. 구현 순서

1. 프로젝트 셋업 (Vite, 의존성, 환경변수)
2. 재사용 모듈 복사 및 수정
3. 레이아웃 (Navbar, Footer) 및 CSS
4. 인증 페이지 (Login, Register, ForgotPassword)
5. App.jsx 라우팅 설정 (34개 라우트)
6. Public 페이지 (Home, Competency)
7. User 페이지 (Main, Checkout, Evaluation, Result 등)
8. Group 페이지 (9개)
9. Admin 페이지 (10개)
10. Supabase SQL 마이그레이션
11. 빌드 검증 및 문서화

---

## 7. 데이터 마이그레이션 전략

1. MySQL → CSV 추출
2. Supabase에 테이블 생성 (001_initial_schema.sql)
3. CSV → Supabase import
4. 비밀번호 재설정 (SHA256 → Supabase bcrypt)
5. 기존 사용자에게 비밀번호 재설정 안내 이메일 발송
