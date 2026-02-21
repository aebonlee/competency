# 코드 점검 보고서 — 2026-02-21

**작업**: GitHub 리포지토리 + 로컬 폴더 종합 점검
**작업자**: Claude AI (Opus 4.6)
**점검 대상**: https://github.com/aebonlee/competency + D:/competency/

---

## 점검 범위

| 대상 | 점검 항목 |
|------|-----------|
| React 소스코드 | 76개 JSX/JS 파일 전수 조사 |
| Java/JSP 백엔드 | 172개 Java + 150개 JSP 파일 샘플링 |
| 설정/배포 파일 | package.json, vite.config, deploy.yml, server.xml, web.xml 등 |
| GitHub ↔ 로컬 동기화 | 구조 및 파일 내용 비교 |

---

## 발견 이슈 요약

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

> 상세 내용: `D:/competency/INSPECTION_REPORT_20260221.md` 참조

---

## React 주요 버그 8건

| # | 파일 | 이슈 |
|---|------|------|
| BUG-01 | `admin/UserInfo.jsx:10` | useParams `:id` vs `userId` 불일치 → 항상 undefined |
| BUG-02 | `App.jsx:104` vs `GroupMain.jsx:173` | 라우트 `/group/invite` vs 링크 `/group/invitation` 불일치 |
| BUG-03 | `admin/QuestionList.jsx:165` | `/admin/questions/:id/edit` 라우트 미정의 |
| BUG-04 | `admin/EvalManager.jsx:164` | `/admin/results/:id` 라우트 미정의 |
| BUG-05 | `admin/BoardForm.jsx` | 수정 모드 미구현 (항상 insert) |
| BUG-06 | `admin/MailForm.jsx:44-52` | 이메일 발송 로직 없음, receiver_id 누락 |
| BUG-07 | `group/GroupUserResult.jsx` vs `user/Result.jsx` | `score_N` vs `point_N` 필드명 불일치 |
| BUG-08 | 그룹 페이지 vs auth.js | `profiles` vs `user_profiles` 테이블명 불일치 |

## React 미완성 3건

| # | 파일 | 이슈 |
|---|------|------|
| INC-01 | `user/ResultAvg.jsx:47` | 데이터 조회하나 항상 '—' 표시 (양쪽 분기 동일) |
| INC-02 | `user/Evaluation.jsx:60-65` | Edge Function 실패 시 폴백 미구현 |
| INC-03 | `App.jsx` | 404 catch-all 라우트 없음 |

---

## GitHub ↔ 로컬 동기화 현황

### 구조 차이

| 항목 | GitHub | 로컬 |
|------|--------|------|
| React 앱 위치 | 루트 `/` | `react-app/` 하위 |
| Tomcat/JSP | 없음 | `tomcat/` 하위 |
| Supabase 마이그레이션 | 있음 | 없음 |
| Dev_md 개발문서 | 있음 | 있음 (동기) |
| CI/CD | 있음 | 없음 |

### 코드 차이 (로컬이 구버전)

| 파일 | 로컬 | GitHub | 차이 |
|------|------|--------|------|
| `utils/supabase.js` | 5,892B | 6,135B | -243B |
| `utils/auth.js` | 3,928B | 4,073B | -145B |
| `utils/portone.js` | 1,531B | 1,585B | -54B |

---

## 조치 우선순위

### Priority 1 — 즉시 수정
1. React BUG-01~08 수정
2. React INC-01~03 완성
3. 로컬 코드 GitHub 최신 동기화

### Priority 2 — 중기
4. CI/CD에 lint 단계 추가
5. 테스트 프레임워크 도입 (Vitest)
6. console.log/error 정리 (55건)
7. 관리자 권한 서버 측 전환

### Priority 3 — 레거시 (운영 중인 경우)
8. DB 자격증명 외부화 (690건 하드코딩)
9. SQL 인젝션 수정 (30+개 메서드)
10. XSS 방어 (278+개 미이스케이프 출력)
11. 비밀번호 해싱 적용
12. Tomcat 업그레이드 (8.0.50 → 9.0+)
