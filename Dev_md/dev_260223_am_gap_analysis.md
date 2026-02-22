# JSP → React 전환 GAP 분석

**날짜**: 2026-02-23
**분석 기준**: 레거시 JSP 113페이지 vs React 49페이지

---

## 전환 완료 (38개 기능)

| 기능 영역 | JSP | React | 상태 |
|-----------|-----|-------|:----:|
| 로그인/로그아웃 | login/loginPro/logout | Login.jsx + AuthContext | ✅ |
| 회원가입 | signupForm/signupPro | Register.jsx | ✅ |
| OAuth 인증 | *(없음)* | Login.jsx (Google/Kakao) | ✅ 신규 |
| 프로필 수정 | modifyForm/modifyPro | Profile.jsx | ✅ |
| 계정 삭제 | deleteForm/deletePro | DeleteAccount.jsx | ✅ |
| 비밀번호 재설정 | forgot.jsp/findIdPw.jsp | ForgotPassword.jsx | ✅ |
| 56쌍 역량 평가 | evaluation/updateEval | Evaluation.jsx + supabase.ts | ✅ |
| 결과 계산 | result.jsp (point 알고리즘) | calculateResults() | ✅ |
| 결과 차트 | result.jsp + Chart.js | Result.jsx + CompetencyChart | ✅ |
| 이전 결과 | prevResult.jsp | PrevResult.jsx | ✅ |
| 통계 비교 | resultAvg.jsp | ResultAvg.jsx | ✅ |
| 평가 이력 | history/evalList | History.jsx | ✅ |
| 결제 | checkout/checkoutpro | Checkout.jsx + portone.ts | ✅ |
| 쿠폰 생성/관리 | createCoupon/couponList | CouponList.jsx (admin) | ✅ |
| 쿠폰 사용 | useCoupon.jsp | Main.jsx + supabase.ts | ✅ |
| 문항 목록/추가/삭제 | questionList/Regist/Delete | QuestionList/Form.jsx | ✅ |
| 그룹 대시보드 | groupMain.jsp | GroupMain.jsx | ✅ |
| 그룹원 목록/정보 | groupUserList/Info | GroupUserList/Info.jsx | ✅ |
| 그룹원 결과 | groupUserResult.jsp | GroupUserResult.jsx | ✅ |
| 그룹원 평가이력 | groupUserEvalList.jsp | GroupUserEvalList.jsx | ✅ |
| 그룹 평가 목록 | groupEvalList.jsp | GroupEvalList.jsx | ✅ |
| 그룹 초대 | groupInvitation/invSignup | GroupInvitation + InviteRegister | ✅ |
| 그룹 조직도 | groupOrg.jsp | GroupOrg.jsx | ✅ |
| 그룹 매니저 | groupManager.jsp | GroupManager.jsx | ✅ |
| 그룹 쿠폰 | groupCouponList.jsp | GroupCouponList.jsx | ✅ |
| 관리자 대시보드 | adminMain.jsp | Dashboard.jsx | ✅ |
| 사용자 목록 | userList.jsp | UserList.jsx | ✅ |
| 사용자 상세 | userInfo.jsp | UserInfo.jsx | ✅ |
| 삭제된 사용자 | deletedUserList/deleteduser | DeletedUserList.jsx | ✅ |
| 게시판 CRUD | boardRegistForm/Viewer | BoardList/Form/View.jsx | ✅ |
| 메모 CRUD | noteRegistForm~Delete | NoteList/Form.jsx | ✅ |
| 설문 문항 관리 | svQuestion* (6pages) | SvQuestionList/Form.jsx | ✅ |
| 설문 목록 | surveyList.jsp | SurveyList.jsx | ✅ |
| 역량 정보 (4차산업) | competency.jsp | Competency.jsx | ✅ |
| 역량 정보 (2015) | competency-2015.jsp | Competency2015.jsx | ✅ |
| 역량 정보 (NCS) | competency-NCS.jsp | CompetencyNCS.jsx | ✅ |
| 출처/참고 | sources.jsp | Sources.jsx | ✅ |
| 결제 확인 | confirmation.jsp | Confirmation.jsx | ✅ |

---

## 미전환 — Critical (4건)

| # | JSP 원본 | 기능 | 영향 |
|:-:|----------|------|------|
| GAP-01 | `surveyForm.jsp` | 사용자 설문 응답 페이지 | 평가 후 설문을 사용자가 제출할 수 없음 |
| GAP-02 | `extract.jsp` | 데이터 추출/내보내기 (Excel/CSV) | 관리자가 결과/사용자를 파일로 다운로드 불가 |
| GAP-03 | `sendMailPro.jsp` + `sendInvPro.jsp` | 이메일 발송 (JavaMail + HTML 템플릿) | 메일/초대 이메일 미발송 |
| GAP-04 | `checkoutFree.jsp` | 무료 검사 접근 경로 | 쿠폰 없이 무료 검사 불가 (쿠폰으로 대체 가능) |

## 미전환 — High (6건)

| # | JSP 원본 | 기능 | 영향 |
|:-:|----------|------|------|
| GAP-05 | `giveAuth.jsp` | 관리자 권한 부여/해제 | admin 역할 부여/해제 불가 |
| GAP-06 | `modifyFormByAdm.jsp` + `deleteProByAdm.jsp` | 관리자의 사용자 프로필 편집/삭제 | 관리자가 사용자 정보 직접 수정 불가 |
| GAP-07 | `sendCoupon.jsp` | 쿠폰 배포 (사용자/그룹 지정) | 쿠폰 자동 배포 기능 없음 |
| GAP-08 | `dashboard.jsp` + `statistics.jsp` | Google Data Studio 임베드 | 외부 분석 연동 없음 (자체 차트 대체) |
| GAP-09 | `Starter.java` (5개 서블릿) | 일일 통계 자동 집계 (23:59 스케줄) | 배치 작업 없음, 히스토리 추적 불가 |
| GAP-10 | `competency-NCS2.jsp` | NCS 추가 비교 페이지 | 두 번째 NCS 페이지 미전환 |

## 미전환 — Medium (6건)

| # | JSP 원본 | 기능 | 영향 |
|:-:|----------|------|------|
| GAP-11 | `groupDeleteForm.jsp` | 그룹 삭제 확인 페이지 | 확인 단계 없이 삭제 (간소화) |
| GAP-12 | `intro.jsp` | 서비스 소개 페이지 | Home hero 섹션으로 통합 |
| GAP-13 | `findabofolder.jsp` | About 페이지 | 독립 페이지 없음 |
| GAP-14 | result.jsp의 `html2canvas` | 결과 스크린샷/공유 | 이미지 캡처 기능 없음 |
| GAP-15 | `boardRegistForm.jsp` (multipart) | 게시판 파일 첨부 | URL 입력만 가능, 실제 업로드 없음 |
| GAP-16 | `confirmId.jsp` | ID 중복 확인 (AJAX) | Supabase Auth 자동 처리 (불필요) |

## 의도적 변경/생략 (3건)

| # | JSP 원본 | 변경 사항 |
|:-:|----------|-----------|
| GAP-17 | 멀티테넌트 4개 기관 | 단일 테넌트로 전환, RLS로 분리 |
| GAP-18 | PayPal SDK | PortOne V2 (KG이니시스)로 변경 |
| GAP-19 | SHA256Util.java | Supabase Auth (bcrypt)로 위임 |

---

## 요약

```
전환 완료:          38/57 기능 (67%)
실질 전환율:        38/54 기능 (70%, 의도적 생략 제외)
미전환 Critical:     4건
미전환 High:         6건
미전환 Medium:       6건
```

## 구현 우선순위

### P0 — 즉시

- [ ] GAP-01: 사용자 설문 응답 페이지
- [ ] GAP-03: 이메일 발송 (Supabase Edge Function + Resend)
- [ ] GAP-02: 데이터 내보내기 (CSV 다운로드)

### P1 — 핵심

- [ ] GAP-05/06: 관리자 권한 부여 + 사용자 편집/삭제
- [ ] GAP-07: 쿠폰 배포 (사용자/그룹 지정)
- [ ] GAP-09: 일일 통계 집계 (pg_cron 또는 Edge Function)
- [ ] GAP-14: 결과 이미지 캡처/공유

### P2 — 개선

- [ ] GAP-10: NCS2 페이지
- [ ] GAP-15: 게시판 파일 업로드 (Supabase Storage)
- [ ] GAP-12/13: 소개/About 페이지
