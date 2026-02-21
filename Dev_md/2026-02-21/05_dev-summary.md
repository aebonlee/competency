# 개발 일지 — 2026-02-21 (세션 2)

**프로젝트**: MyCoreCompetency React 전환
**작업자**: Claude AI (Opus 4.6)
**리포지토리**: https://github.com/aebonlee/competency
**배포 도메인**: https://competency.dreamitbiz.com

---

## 작업 요약

JSP→React 전환 1차 목표를 완료하고, 인증/관리자 체계를 강화하고, 원본 JSP 페이지(NCS) 복원을 마쳤습니다.
총 49개 페이지, 53개 라우트로 확장되었으며, GitHub Pages 자동 배포 환경이 구성되었습니다.

---

## 금일 완료 작업 (14~16단계)

### 14단계: JSP→React 전환 완료 — 관리자/그룹 CRUD 페이지 추가

나머지 JSP 페이지를 모두 React로 전환했습니다.

**신규 관리자 페이지 9개:**

| 파일 | 라우트 | 기능 |
|------|--------|------|
| SvQuestionList.jsx | /admin/survey-questions | 만족도 질문 목록/삭제 |
| SvQuestionForm.jsx | /admin/survey-questions/new, /:id/edit | 만족도 질문 등록/수정 |
| BoardForm.jsx | /admin/board/new, /:id/edit | 게시판 글쓰기/수정 (이미지 업로드) |
| BoardView.jsx | /admin/board/:id | 게시판 상세보기 |
| NoteForm.jsx | /admin/notes/new, /:id/edit | 쪽지 작성/수정 |
| DeletedUserList.jsx | /admin/deleted-users | 탈퇴 회원 관리 |
| EvalManager.jsx | /admin/users/:userId/evals | 회원별 검사 이력 관리 |
| MailForm.jsx | /admin/mail | 이메일 발송 |
| Sources.jsx | /admin/sources | 출처 정보 |

**신규 그룹 페이지 2개:**

| 파일 | 라우트 | 기능 |
|------|--------|------|
| GroupUserInfo.jsx | /group/users/:userId/info | 그룹원 상세정보 |
| GroupUserEvalList.jsx | /group/users/:userId/evals | 그룹원 검사 이력 |

**기존 페이지 기능 강화:**
- BoardList.jsx: 글쓰기/수정/상세보기 링크 추가
- GroupUserList.jsx: 정보/검사내역 컬럼 추가

**커밋**: `09ebc0c` — 15개 파일, +2,069줄

---

### 15단계: 인증 강화 — OAuth + 관리자 설정

**관리자 이메일 설정:**
- `aebon@kakao.com`, `aebon@kyonggi.ac.kr` → 자동 관리자 권한
- AuthContext.jsx의 ADMIN_EMAILS 배열 (프론트엔드)
- is_admin() DB 함수에 이메일 체크 추가 (백엔드 RLS)

**OAuth 프로필 자동 생성:**
- Google/Kakao 첫 로그인 시 user_profiles 자동 INSERT
- OAuth 메타데이터(full_name)를 사용해 기본 프로필 생성

**인구통계학적 정보 수집 (CompleteProfile 페이지):**
- OAuth 사용자가 프로필 미완성 시 /complete-profile로 자동 리다이렉트
- 수집 항목: 이름, 성별, 나이대, 학력, 시/도, 직무, 직업/직책, 휴대전화
- 완성 후 /main으로 이동

**인증 플로우 요약:**
```
이메일 가입: Register → signUp() → user_profiles INSERT (인구통계 포함) → 이메일 인증 → 로그인
Google 가입: Login → signInWithGoogle() → 자동 프로필 생성 → CompleteProfile → 인구통계 입력
Kakao 가입: Login → signInWithKakao() → 자동 프로필 생성 → CompleteProfile → 인구통계 입력
```

**누락 DB 테이블 추가:**
- board_posts (게시판)
- survey_questions (만족도 조사 질문)
- RLS 정책 + 인덱스

**커밋**: `b319970` — 6개 파일, +320줄

---

### 16단계: CompetencyNCS 페이지 원본 복원

**이전**: 단순 카드 목록 + 뱃지만 표시
**이후**: JSP 원본 디자인 완전 복원

- SVG 인포그래픽 추출 (65,723자, 이미지 29개)
- NCS 10대 직업기초능력 정의 텍스트 (컬러 불릿)
- NCS 출처 링크 포함
- CSS 클래스 추가 (ncs-definitions, ncs-def-item, ncs-def-bullet)

**커밋**: `d3704de` — 5개 파일, +1,372줄

---

### 기타: CI/CD 환경 강화

- `.env` 파일에 Supabase 키 설정 (로컬 개발용)
- GitHub Actions 워크플로우에 환경변수 주입 설정 추가
- 수동 설정 가이드 작성 (`Dev_md/2026-02-21/03_setup-guide.md`)

**커밋**: `809f449`

---

## 금일 커밋 이력

| 해시 | 메시지 | 파일 | 변경 |
|------|--------|------|------|
| 244e1ce | refactor: 인라인 스타일 → CSS 클래스 전환 | 6 | +270/-87 |
| ea5e086 | feat: 핵심역량/교육부 페이지 JSP 원본 복원 | 79 | +2,855/-70 |
| 09ebc0c | feat: JSP→React 전환 완료 (11페이지 추가) | 15 | +2,069/-12 |
| b319970 | feat: OAuth + 관리자 설정 + 누락 테이블 | 6 | +320/-5 |
| 809f449 | ci: GitHub Actions 환경변수 주입 | 1 | +5 |
| d3704de | feat: NCS 페이지 원본 복원 + 설정 가이드 | 5 | +1,372/-15 |

---

## 현재 프로젝트 규모

| 항목 | 수량 |
|------|------|
| 총 페이지 컴포넌트 | 49개 |
| 총 라우트 | 53개 |
| 총 모듈 | 152개 |
| CSS 파일 | 10개 |
| JS 번들 (gzip) | 211 KB |
| CSS 번들 (gzip) | 7.4 KB |
| DB 테이블 | 12개 |
| 마이그레이션 파일 | 2개 |

---

## 수동 설정 필요 사항

> 상세 가이드: `Dev_md/2026-02-21/03_setup-guide.md`

### 1. GitHub Secrets 등록
- Repository Settings > Secrets > Actions에서 등록
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### 2. Supabase OAuth Provider 활성화
- Google: Google Cloud Console에서 OAuth 클라이언트 생성 → Supabase에 입력
- Kakao: Kakao Developers에서 앱 생성 → REST API 키 + Client Secret → Supabase에 입력
- Redirect URI: `https://hcmgdztsgjvzcyxyayaj.supabase.co/auth/v1/callback`

### 3. SQL 마이그레이션 실행
- Supabase SQL Editor에서 `20260221020000_add_board_survey_tables.sql` 실행
- board_posts, survey_questions 테이블 + is_admin() 업데이트

---

## 참조
- 수동 설정 가이드: `Dev_md/2026-02-21/03_setup-guide.md`
- 전체 개발일지: `Dev_md/2026-02-21/02_dev-log.md`
- 검증보고서: `Dev_md/2026-02-21/04_verification.md`
- Supabase: https://supabase.com/dashboard/project/hcmgdztsgjvzcyxyayaj
- GitHub: https://github.com/aebonlee/competency
- 배포: https://competency.dreamitbiz.com
