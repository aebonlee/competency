# 세션 15 개발 계획 — 심층 코드 분석 & 버그 수정

**작성일**: 2026-02-22
**세션**: 15 (Deep Code Analysis & Critical Bug Fixes)

---

## 1. 배경

세션 14까지 그룹 관리자 페이지 강화가 완료된 후, 전체 프로젝트 소스코드에 대한 심층 분석을 수행.
4개 병렬 탐색 에이전트를 사용하여 50개+ 소스 파일을 전수 조사.

### 분석 범위
- `src/pages/` 하위 모든 페이지 (41개 JSX)
- `src/utils/` 유틸리티 (3개 JS)
- `src/contexts/` 컨텍스트 (2개 JSX)
- `src/components/` 컴포넌트 (10개 JSX)
- `src/data/` 데이터 (1개 JS)

---

## 2. 분석 결과 요약

### 2.1 CRITICAL (5건 보고 → 2건 실제 수정 필요)

| # | 파일 | 이슈 | 실제 상태 |
|---|------|------|----------|
| C1 | ResultAvg.jsx | `get_average_scores` RPC 미동작 + 삼항 양쪽 '—' 표시 | **실제 버그** → 전면 재작성 |
| C2 | Result.jsx | NCS[8] 5개요소÷3 계산 | 레거시 JSP와 동일 → **정상** |
| C3 | GroupStatistics.jsx | `profiles` → `user_profiles` 테이블명 | **실제 버그** → 수정 |
| C4 | InviteRegister.jsx | 쿠폰 미사용 처리 (무한 재사용 가능) | **실제 버그** → 수정 |
| C5 | Checkout.jsx | 결제 전 evaluation 생성 | 코드 검토 결과 → **정상** |

### 2.2 HIGH (8건 보고 → 2건 실제 수정 필요)

| # | 파일 | 이슈 | 실제 상태 |
|---|------|------|----------|
| H1 | Dashboard.jsx | `profiles` 테이블명 | `src/`에서 이미 수정됨 → **정상** |
| H2 | UserList.jsx | `deleted_at` 필터 누락 | **실제 버그** → 수정 |
| H3 | Statistics.jsx | `country` 컬럼명 | `src/`에서 이미 수정됨 → **정상** |
| H4 | DeletedUserList.jsx | `deleted_at` 필터 | `src/`에서 이미 수정됨 → **정상** |
| H5 | UserInfo.jsx | 테이블명 | `src/`에서 이미 수정됨 → **정상** |
| H6 | GroupSettings.jsx | 삭제 시 cascade 누락 | **실제 버그** → 수정 |
| H7 | GroupStatistics.jsx | 서브그룹 매칭 로직 | C3과 동일 |
| H8 | MailForm.jsx | receiver_id 누락 | `src/`에서 이미 수정됨 → **정상** |

### 2.3 핵심 발견: 이중 소스 디렉토리 문제

프로젝트에 두 개의 소스 디렉토리가 존재:
- `D:\competency\src\` — **활성** (Vite 빌드 대상, 최신 수정 반영)
- `D:\competency\react-app\src\` — **비활성** (구버전 스냅샷, 많은 버그 잔존)

`react-app/` 파일을 기준으로 오탐(false positive)이 다수 발생.
실제 빌드 대상인 `src/` 기준으로 재검증한 결과, 13건 → 5건으로 축소.

---

## 3. 수정 계획

### 3.1 ResultAvg.jsx — 전면 재작성
- 기존: 미존재 RPC 함수 호출 + 삼항 버그
- 변경: 직접 Supabase 쿼리로 전체/나이별/직무별 평균 계산
- 쿼리: `results` → `eval_list` → `user_profiles` 조인

### 3.2 InviteRegister.jsx — 쿠폰 사용 처리 추가
- 기존: 회원가입 성공 후 쿠폰 상태 미변경
- 변경: `coupons.update({ is_used: true, used_by, used_at })` 추가

### 3.3 UserList.jsx — deleted_at 필터 추가
- 기존: 활성+탈퇴 회원 모두 조회
- 변경: `.is('deleted_at', null)` 필터 추가

### 3.4 GroupStatistics.jsx — 테이블명 수정
- 기존: `.from('profiles')` 2개소
- 변경: `.from('user_profiles')` 로 수정

### 3.5 GroupSettings.jsx — cascade 삭제 추가
- 기존: 그룹 삭제 시 `group_subgroups`, `coupons` 미삭제
- 변경: FK 제약조건 위반 방지를 위한 cascade 삭제 추가

---

## 4. 검증

- `npm run build` 성공 확인 (152 modules, 622.87 KB)
- 수정 파일 5개: ResultAvg.jsx, InviteRegister.jsx, UserList.jsx, GroupStatistics.jsx, GroupSettings.jsx

---

*이 문서는 Claude Code 세션 15의 개발 계획을 기록합니다.*
