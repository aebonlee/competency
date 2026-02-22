# Competency 프로젝트 종합 점검 보고서

**점검일:** 2026-02-21
**점검 대상:** GitHub 리포지토리 (aebonlee/competency) + 로컬 폴더 (D:/competency)
**프로젝트:** MyCoreCompetency - 4차 산업혁명 8대 핵심역량 진단 서비스

---

## 목차

1. [프로젝트 구조 개요](#1-프로젝트-구조-개요)
2. [GitHub vs 로컬 동기화 현황](#2-github-vs-로컬-동기화-현황)
3. [React 프론트엔드 점검 결과](#3-react-프론트엔드-점검-결과)
4. [Java/JSP 백엔드 점검 결과](#4-javajsp-백엔드-점검-결과)
5. [설정 및 배포 파일 점검 결과](#5-설정-및-배포-파일-점검-결과)
6. [종합 요약 및 권장사항](#6-종합-요약-및-권장사항)

---

## 1. 프로젝트 구조 개요

### 1.1 GitHub 리포지토리 (aebonlee/competency)

| 항목 | 내용 |
|------|------|
| URL | https://github.com/aebonlee/competency |
| 기본 브랜치 | main |
| 주요 언어 | JavaScript |
| 배포 대상 | GitHub Pages (competency.dreamitbiz.com) |
| 기술 스택 | React 19 + Vite 7 + Supabase + PortOne V2 |
| 최종 푸시 | 2026-02-21 |

### 1.2 로컬 폴더 (D:/competency)

| 폴더 | 설명 | 기술 스택 |
|------|------|-----------|
| `react-app/` | 모던 React SPA 프론트엔드 | React 19 + Vite + Supabase |
| `tomcat/` | 레거시 JSP/Java 백엔드 | Tomcat 8.0.50 + MySQL + JSP |

> **참고:** 로컬에는 `.git` 디렉토리가 없어 Git 버전 관리가 되지 않고 있음

### 1.3 프로젝트 규모

| 구분 | 파일 수 |
|------|---------|
| React JSX/JS 소스 | ~80개 |
| CSS 스타일시트 (React) | 11개 |
| Java 소스 | 172개 |
| JSP 페이지 | 150+개 |
| CSS 스타일시트 (JSP) | 30+개 |

---

## 2. GitHub vs 로컬 동기화 현황

### 2.1 구조적 차이

| 항목 | GitHub | 로컬 |
|------|--------|------|
| React 앱 위치 | 루트 (`/`) | `react-app/` 하위 |
| Tomcat/JSP 앱 | **없음** | `tomcat/` 하위 |
| Supabase 마이그레이션 | `supabase/migrations/` | **없음** |
| 개발 문서 | `Dev_md/` | **없음** |
| 스크립트 | `scripts/extract-svg.js` | **없음** |
| CI/CD 파이프라인 | `.github/workflows/deploy.yml` | **없음** |

### 2.2 소스코드 차이 (React 유틸리티 파일)

| 파일 | 로컬 크기 | GitHub 크기 | 상태 |
|------|-----------|-------------|------|
| `supabase.js` | 5,892 bytes | 6,135 bytes | **로컬이 구버전** |
| `auth.js` | 3,928 bytes | 4,073 bytes | **로컬이 구버전** |
| `portone.js` | 1,531 bytes | 1,585 bytes | **로컬이 구버전** |

> **결론:** 로컬 react-app은 GitHub보다 오래된 스냅샷이며, Supabase 마이그레이션 및 CI/CD가 로컬에 없음

---

## 3. React 프론트엔드 점검 결과

### 3.1 버그 (BUG) - 즉시 수정 필요

#### BUG-01: UserInfo.jsx useParams 불일치
- **파일:** `src/pages/admin/UserInfo.jsx:10`
- **내용:** Route 파라미터는 `:id`이나 컴포넌트에서 `userId`로 destructuring → `userId`가 항상 `undefined`
- **영향:** 관리자 사용자 정보 페이지 완전 미작동

#### BUG-02: 라우트 경로 불일치 (/group/invite vs /group/invitation)
- **파일:** `App.jsx:104` (route: `/group/invite`) vs `GroupMain.jsx:173` (link: `/group/invitation`)
- **영향:** 그룹 초대 관리 페이지 링크 클릭 시 빈 페이지

#### BUG-03: 미정의 라우트 /admin/questions/:id/edit
- **파일:** `QuestionList.jsx:165` → 링크 생성하나 App.jsx에 해당 라우트 없음
- **영향:** 문항 수정 버튼 클릭 시 빈 페이지

#### BUG-04: 미정의 라우트 /admin/results/:id
- **파일:** `EvalManager.jsx:164` → 링크 생성하나 App.jsx에 해당 라우트 없음
- **영향:** 결과 보기 버튼 클릭 시 빈 페이지

#### BUG-05: BoardForm 수정 모드 미구현
- **파일:** `src/pages/admin/BoardForm.jsx`
- **내용:** `useParams()`를 사용하지 않아 기존 글 데이터를 불러오지 않음. 항상 새 글 insert 수행
- **영향:** 게시글 수정 시 기존 글이 수정되지 않고 새 글이 생성됨

#### BUG-06: MailForm 이메일 미발송
- **파일:** `src/pages/admin/MailForm.jsx:44-52`
- **내용:** `notes` 테이블에 레코드만 삽입하고 실제 이메일 발송 로직 없음. `receiver_id`도 누락
- **영향:** 관리자 메일 발송 기능 완전 미작동

#### BUG-07: 결과 필드명 불일치 (score_N vs point_N)
- **파일:** `GroupUserResult.jsx:91-100` (`result.score_1`) vs `Result.jsx:49-52` (`result.point1`)
- **영향:** 둘 중 하나가 항상 0/undefined 표시

#### BUG-08: 테이블명 불일치 (profiles vs user_profiles)
- **파일:** 그룹 페이지들은 `profiles` 테이블 사용, `auth.js`/`AuthContext.jsx`는 `user_profiles` 사용
- **영향:** DB 스키마에 따라 한쪽 쿼리가 실패

### 3.2 미완성 기능 (INCOMPLETE)

#### INC-01: ResultAvg.jsx 완전 플레이스홀더
- **파일:** `src/pages/user/ResultAvg.jsx:47`
- **내용:** `stats ? '—' : '—'` → 양쪽 분기 모두 대시 표시. RPC 호출로 데이터를 가져오지만 실제 표시하지 않음
- **상태:** 스텁 페이지

#### INC-02: Evaluation.jsx 결과 계산 폴백 미구현
- **파일:** `src/pages/user/Evaluation.jsx:60-65`
- **내용:** Edge Function 실패 시 `console.warn`만 출력하고 실제 클라이언트 측 계산 없음
- **영향:** Edge Function 미작동 시 결과 없음

#### INC-03: 404 페이지 없음
- **파일:** `App.jsx`
- **내용:** `<Route path="*">` 캐치올 라우트 미정의
- **영향:** 존재하지 않는 URL 접근 시 빈 페이지

### 3.3 보안 이슈 (SECURITY)

#### SEC-01: 클라이언트 측 관리자 이메일 하드코딩
- **파일:** `src/contexts/AuthContext.jsx:81`
- **내용:** `const ADMIN_EMAILS = ['aebon@kakao.com', 'aebon@kyonggi.ac.kr']`
- **위험:** 브라우저 소스에서 관리자 이메일 노출

#### SEC-02: XSS 위험 (dangerouslySetInnerHTML)
- **파일:** `Competency2015.jsx:39`, `CompetencyNCS.jsx:164`
- **내용:** 서버에서 가져온 SVG를 `dangerouslySetInnerHTML`로 삽입

#### SEC-03: 가격 하드코딩
- **파일:** `src/pages/user/Checkout.jsx:31`
- **내용:** `const AMOUNT = 25000` → 서버 검증 없이 클라이언트에서 가격 결정

### 3.4 코드 품질 이슈 (QUALITY)

| 구분 | 건수 | 설명 |
|------|------|------|
| console.error/warn 잔재 | 55건 | 프로덕션 코드에 콘솔 로깅 잔존 (35개 파일) |
| 미처리 Promise Rejection | 5건 | Main.jsx, History.jsx, Evaluation.jsx, Result.jsx, PrevResult.jsx |
| 미사용 변수/임포트 | 10건+ | QuestionList, SvQuestionList, SurveyList, BoardList 등 `const { user } = useAuth()` 미사용 |
| Render 중 navigate 호출 | 2건 | Login.jsx:18-21, Register.jsx:22-24 (React 안티패턴) |
| 저작권 연도 오래됨 | 2건 | Navbar.jsx:112, Footer.jsx:7 → "2020" 고정 |
| Sources.jsx 버전 오류 | 1건 | "React 18" 표기 → 실제는 React 19 |

---

## 4. Java/JSP 백엔드 점검 결과

### 4.1 치명적 보안 취약점 (CRITICAL)

#### CRIT-01: SQL 인젝션 (문자열 연결)
- **파일:** `Register/LogonDBBean.java:820,888,957,1027,1297,1501,1642` 외 다수
- **내용:** `PreparedStatement`를 사용하면서도 사용자 입력을 직접 문자열 연결
```java
// 취약한 코드 예시
pstmt = conn.prepareStatement("select * from user where name like '%" + name + "%'");
```
- **범위:** 5+개 DBBean 파일, 30+개 메서드 (4개 기관 복사본 포함)
- **영향:** 데이터베이스 전체 탈취 가능

#### CRIT-02: 하드코딩된 DB 자격증명
- **범위:** 80개 Java 파일, 690회 출현
```java
Connection conn = DriverManager.getConnection(dbURL, "competency", "competency@");
```
- **노출 정보:** MySQL `localhost:3306/competency`, 사용자명: `competency`, 비밀번호: `competency@`

#### CRIT-03: 하드코딩된 Gmail SMTP 자격증명
- **파일:** `sendMailPro.jsp:56-76`
- **노출 정보:** Gmail `kocomedu@gmail.com`, 비밀번호: `Kocom2020!`

#### CRIT-04: 평문 비밀번호 저장 및 비교
- **범위:** 전체 60+개 위치
```java
if (dbpasswd.equals(password))  // SHA256Util.java 존재하나 미사용
```
- **영향:** DB 유출 시 모든 사용자 비밀번호 즉시 노출

#### CRIT-05: XSS 취약점 (저장형 + 반사형)
- **범위:** 76개 JSP 파일, 278+개 미이스케이프 출력
```jsp
<%=board.getContent() %>  <!-- 사용자 작성 콘텐츠를 raw HTML로 출력 -->
<%=request.getParameter("eval_id")%>  <!-- URL 파라미터 직접 출력 -->
```

#### CRIT-06: 비밀번호 HTML 소스 노출
- **파일:** `modifyForm.jsp:163-164`
```html
<input type="password" value="<%=c.getPasswd()%>">  <!-- 평문 비밀번호가 HTML에 노출 -->
```

### 4.2 고위험 보안 이슈 (HIGH)

| 코드 | 이슈 | 파일/범위 |
|------|------|-----------|
| HIGH-01 | HTTPS 미설정 (HTTP only) | `server.xml` - 포트 8115 HTTP만 사용 |
| HIGH-02 | CSRF 보호 없음 | 전체 애플리케이션 (필터, 토큰 없음) |
| HIGH-03 | 세션 고정 취약점 | `loginPro.jsp:28` - 로그인 후 세션 미갱신 |
| HIGH-04 | Referer 기반 접근제어 | `loginPro.jsp:7`, `signupPro.jsp:14` 등 (쉽게 우회) |
| HIGH-05 | 에러 페이지 미설정 | `web.xml` - 스택 트레이스 사용자 노출 |
| HIGH-06 | 서버 경로 노출 | `findabofolder.jsp` - 파일시스템 절대 경로 출력 |
| HIGH-07 | 디버그 페이지 잔존 | `extract.jsp` - 테스트 코드, SQL 쿼리 노출 |
| HIGH-08 | Tomcat 8.0.50 EOL | 2018년 지원 종료, 알려진 CVE 다수 |

### 4.3 중간 위험 이슈 (MEDIUM)

| 코드 | 이슈 | 설명 |
|------|------|------|
| MED-01 | 커넥션 풀링 없음 | 695개 raw `DriverManager.getConnection()` 호출 |
| MED-02 | 빈 catch 블록 | 500+건 (SQLException 무시) |
| MED-03 | PreparedStatement 누수 | 재할당 시 이전 Statement 미종료 |
| MED-04 | ConnectionContext 미사용 | 싱글톤 커넥션 클래스 존재하나 전혀 사용 안함 |
| MED-05 | DB SSL 비활성화 | `useSSL=false` 모든 연결 문자열 |
| MED-06 | SHA256Util Random 사용 | `java.util.Random` → `SecureRandom` 사용 필요 |

### 4.4 낮은 위험 / 코드 품질 이슈 (LOW)

| 코드 | 이슈 | 건수 |
|------|------|------|
| LOW-01 | 폐기된 JDBC 드라이버 (`com.mysql.jdbc.Driver`) | 695건 |
| LOW-02 | TODO Auto-generated 미완성 스텁 | 25건 (서블릿 파일) |
| LOW-03 | 서버 입력 검증 없음 | 전체 (길이, 형식, sanitization 없음) |
| LOW-04 | 대규모 코드 중복 | 4개 기관별 거의 동일한 파일 복사 (khu, kdi, gunpoe, mjc) |
| LOW-05 | MySQL 드라이버 5.1.35 심각히 오래됨 | 알려진 취약점 존재 |
| LOW-06 | ojdbc14.jar JDK 1.4용 Oracle 드라이버 | 현재 ojdbc8+ 권장 |
| LOW-07 | FullPage.js 라이센스 키 노출 | `evaluation.jsp:371` |
| LOW-08 | `catalina.out` 잘못된 위치 | `WEB-INF/classes/EvalQuestion/catalina.out` |

---

## 5. 설정 및 배포 파일 점검 결과

### 5.1 GitHub Actions (deploy.yml)

| 항목 | 상태 | 비고 |
|------|------|------|
| Secrets 관리 | **양호** | 환경변수를 GitHub Secrets로 주입 |
| npm ci 사용 | **양호** | 결정적 빌드 보장 |
| Node.js 20 LTS | **양호** | Vite 7 호환 |
| 린트/테스트 단계 | **미흡** | 빌드 전 검증 없이 바로 배포 |
| actions 버전 | **양호** | v4 최신 버전 사용 |

### 5.2 .env 파일 관리

| 항목 | 상태 | 설명 |
|------|------|------|
| `.env` GitHub 커밋 여부 | **경고** | 플레이스홀더이지만 `.env` 파일이 커밋됨 (`.env.example`로 변경 권장) |
| `.gitignore` | **양호** | `.env`, `.env.local`, `.env.production` 포함 |
| 로컬 `.env` 실제 키 | **주의** | Supabase URL/key 포함 (anon key는 공개 가능하나 관리 필요) |
| PortOne 키 | **미설정** | 로컬 `.env`에 `VITE_PORTONE_STORE_ID=`, `VITE_PORTONE_CHANNEL_KEY=` 비어있음 |

### 5.3 package.json

| 항목 | 상태 | 설명 |
|------|------|------|
| 테스트 프레임워크 | **없음** | vitest, jest 등 미설치 → 테스트 0건 |
| TypeScript 타입 정의 | **불필요** | `@types/react`, `@types/react-dom` 설치되었으나 TS 미사용 |
| 의존성 버전 | **양호** | 최신 버전 사용 (React 19, Vite 7) |

### 5.4 vite.config.js

| 항목 | 상태 | 설명 |
|------|------|------|
| base 경로 | **취약** | 커스텀 도메인 제거 시 GitHub Pages 경로 깨짐 |
| 플러그인 | **양호** | react 플러그인 정상 설정 |

### 5.5 Supabase 마이그레이션

| 파일 | 내용 | 이슈 |
|------|------|------|
| `20260220230614_competency_schema.sql` | 핵심 테이블 생성, RLS 적용 | 양호 |
| `20260221020000_add_board_survey_tables.sql` | 게시판/설문 테이블 추가 | `is_admin()` 함수에 관리자 이메일 하드코딩 |

---

## 6. 종합 요약 및 권장사항

### 6.1 이슈 통계

| 심각도 | React | Java/JSP | 설정/배포 | 합계 |
|--------|-------|----------|-----------|------|
| CRITICAL | 0 | 6 | 1 | **7** |
| BUG | 8 | 0 | 0 | **8** |
| HIGH | 0 | 8 | 0 | **8** |
| INCOMPLETE | 3 | 0 | 2 | **5** |
| SECURITY | 3 | 0 | 2 | **5** |
| MEDIUM | 0 | 6 | 1 | **7** |
| QUALITY | 6+ | 8 | 1 | **15+** |
| **합계** | **20+** | **28+** | **7** | **55+** |

### 6.2 즉시 조치 필요 (Priority 1)

1. **React BUG-01~08 수정** - UserInfo params 불일치, 라우트 누락, 테이블명 불일치 등 8건의 버그 수정
2. **React INC-01~03 완성** - ResultAvg 구현, 404 페이지 추가, Edge Function 폴백
3. **로컬 코드 GitHub 동기화** - `react-app/` 폴더를 GitHub 최신 버전과 동기화
4. **`.env` 파일 GitHub에서 제거** - `git rm --cached .env` 후 `.env.example`로 교체

### 6.3 중기 조치 권장 (Priority 2)

5. **Java/JSP 레거시 시스템 폐기 검토** - React+Supabase로 마이그레이션이 진행 중이므로, 레거시 시스템의 추가 개발보다는 마이그레이션 완료에 집중
6. **CI/CD에 lint/test 단계 추가** - deploy.yml에 `npm run lint` 추가
7. **테스트 프레임워크 도입** - Vitest + @testing-library/react 설치
8. **console.log/error 정리** - 프로덕션 빌드에서 제거 또는 로깅 서비스 교체
9. **관리자 권한 로직 서버 측 전환** - 클라이언트 `ADMIN_EMAILS` 제거, Supabase RLS만으로 제어

### 6.4 레거시 시스템 보안 (운영 중인 경우)

> **경고:** Tomcat/JSP 레거시 시스템은 심각한 보안 취약점이 다수 존재합니다. 현재 운영 중이라면 아래 조치를 즉시 수행하십시오.

10. **DB 자격증명 외부화** - 하드코딩 제거, JNDI DataSource 또는 환경변수 사용
11. **비밀번호 해싱 적용** - SHA256Util 활성화 또는 bcrypt 도입
12. **SQL 인젝션 수정** - 모든 쿼리에서 문자열 연결 제거, 파라미터 바인딩 사용
13. **XSS 방어** - JSTL `<c:out>` 태그 또는 `fn:escapeXml()` 사용
14. **HTTPS 활성화** - SSL/TLS 인증서 설치
15. **Tomcat 업그레이드** - 8.0.50 → 최소 9.0 이상
16. **Gmail 자격증명 변경** - `sendMailPro.jsp`에 노출된 Gmail 비밀번호 즉시 변경
17. **디버그 페이지 제거** - `findabofolder.jsp`, `extract.jsp` 삭제

---

## 부록: 전체 파일 구조

### A. GitHub 리포지토리 구조

```
aebonlee/competency (main branch)
├── .env                          ← 플레이스홀더 (제거 필요)
├── .github/workflows/deploy.yml
├── .gitignore
├── CNAME                         → competency.dreamitbiz.com
├── Dev_md/
│   ├── CLAUDE.md
│   ├── README.md
│   └── 2026-02-21/               ← 개발 로그
├── README.md
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
├── public/
│   ├── 404.html
│   ├── CNAME
│   └── images/                   ← 아이콘, 로고, 이미지
├── scripts/
│   └── extract-svg.js
├── src/
│   ├── App.jsx                   ← 메인 라우터
│   ├── main.jsx                  ← 엔트리 포인트
│   ├── index.css
│   ├── components/               ← 공통 컴포넌트 (11개)
│   ├── contexts/                 ← AuthContext, ToastContext
│   ├── data/                     ← competencyInfo.js
│   ├── pages/
│   │   ├── admin/                ← 관리자 페이지 (19개)
│   │   ├── auth/                 ← 인증 페이지 (5개)
│   │   ├── group/                ← 그룹 페이지 (11개)
│   │   ├── public/               ← 공개 페이지 (4개)
│   │   └── user/                 ← 사용자 페이지 (10개)
│   ├── styles/                   ← CSS 파일 (11개)
│   └── utils/                    ← supabase.js, auth.js, portone.js
└── supabase/
    └── migrations/               ← DB 스키마 (2개)
```

### B. 로컬 폴더 구조

```
D:/competency/
├── react-app/                    ← React SPA (GitHub 구버전)
│   ├── package.json
│   ├── vite.config.js
│   ├── src/                      ← GitHub과 동일 구조
│   └── dist/                     ← 빌드 결과물
└── tomcat/                       ← Tomcat 8.0.50 (레거시)
    ├── bin/, conf/, lib/, logs/
    └── webapps/ROOT/
        ├── *.jsp                 ← JSP 페이지 (30+)
        ├── *.css                 ← 스타일시트 (30+)
        ├── admin/                ← 기관별 관리자 페이지
        │   ├── khu/, kdi/, mjc/, gunpoe/
        ├── khu/, kdi/, mjc/, gunpoe/  ← 기관별 사용자 페이지
        └── WEB-INF/
            ├── web.xml
            ├── lib/
            └── src/              ← Java 소스 (172개)
                ├── Admin/, Board/, Coupon/ ...  ← 공통 모듈
                ├── khu/, kdi/, mjc/, gunpoe/    ← 기관별 복제
                ├── servlet/      ← 서블릿/리스너
                └── jsp/util/     ← 유틸리티
```

---

*이 보고서는 Claude Code에 의해 자동 생성되었습니다.*
*Generated by Claude Code on 2026-02-21*
