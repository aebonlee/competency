# 세션 15 개발일지 — 심층 코드 분석 & Critical 버그 수정

**날짜**: 2026-02-22
**세션**: 15
**작업 유형**: 코드 품질 분석 + 버그 수정

---

## 1. 작업 개요

프로젝트 전체 소스코드에 대한 심층 분석(4개 병렬 에이전트)을 수행하고,
발견된 CRITICAL/HIGH 이슈 중 실제 버그 5건을 수정.

---

## 2. 심층 분석 프로세스

### 2.1 분석 방법
4개 병렬 탐색 에이전트를 동시 실행:
1. **소스코드 전수 조사** — 50개+ 파일의 테이블명, 컬럼명, 로직 검증
2. **개발 히스토리 조사** — Dev_md/ 문서 기반 이전 수정 내역 확인
3. **코드 품질 및 이슈 점검** — 보안, 성능, 미완성 기능 분석
4. **레거시 JSP 대조** — NCS 계산 등 알고리즘 정확성 검증

### 2.2 핵심 발견사항

#### 이중 소스 디렉토리 문제
```
D:\competency\
├── src/           ← 활성 (Vite 빌드 대상) — 최신 수정 반영
├── react-app/src/ ← 비활성 (구버전) — 많은 버그 잔존
├── package.json   ← 프로젝트 루트
└── vite.config.js ← src/ 디렉토리 사용
```

`react-app/src/`는 이전 세션의 구버전 복사본으로, 세션 12에서 수행한
Phase 1 DB 스키마 불일치 40건+ 수정이 반영되지 않은 상태.
실제 빌드/배포되는 코드는 `src/` 디렉토리.

#### 오탐(False Positive) 분석
- 보고된 13건 중 8건이 `react-app/` 구버전 기준 오탐
- `src/` 기준으로 재검증하여 실제 버그 5건 확정

---

## 3. 수정 내역

### 3.1 ResultAvg.jsx — 전면 재작성 (CRITICAL)

**문제**:
1. `client.rpc('get_average_scores')` — 존재하지 않는 RPC 함수 호출
2. `{stats ? '—' : '—'}` — 삼항 연산자 양쪽 모두 대시 표시 (데이터 표시 불가)

**수정**:
- RPC 호출 제거, 직접 Supabase 쿼리로 대체
- `results` → `eval_list` → `user_profiles` 조인하여 데이터 수집
- 전체 평균, AGE_LIST 기반 나이별 평균, POSITION_LIST 기반 직무별 평균 계산
- 결과를 8대 역량별 컬러 코드 그리드로 시각화

**변경 규모**: +184 -21 lines (전면 재작성)

```jsx
// 핵심 데이터 흐름
const { data: results } = await client
  .from('results')
  .select('point1, point2, point3, point4, point5, point6, point7, point8, eval_id');

const { data: evals } = await client
  .from('eval_list')
  .select('id, user_id')
  .in('id', evalIds);

const { data: profiles } = await client
  .from('user_profiles')
  .select('id, age, position')
  .in('id', userIds);
```

### 3.2 InviteRegister.jsx — 쿠폰 사용 처리 추가 (CRITICAL)

**문제**: 초대 코드로 회원가입 성공 후 쿠폰이 사용 처리되지 않음 → 동일 코드 무한 재사용 가능

**수정**: `signUp()` 성공 후 쿠폰 상태 업데이트 추가
```jsx
if (invitation && signUpResult?.user) {
  const client = getSupabase();
  if (client) {
    await client
      .from('coupons')
      .update({
        is_used: true,
        used_by: signUpResult.user.id,
        used_at: new Date().toISOString()
      })
      .eq('code', code);
  }
}
```

**변경 규모**: +18 lines

### 3.3 UserList.jsx — deleted_at 필터 추가 (HIGH)

**문제**: 소프트 삭제된 회원이 활성 회원 목록에 표시됨

**수정**: 쿼리에 `.is('deleted_at', null)` 필터 추가
```jsx
let query = supabase
  .from('user_profiles')
  .select('*', { count: 'exact' })
  .is('deleted_at', null);  // 추가
```

**변경 규모**: +1 line

### 3.4 GroupStatistics.jsx — 테이블명 수정 (HIGH)

**문제**: 2개 쿼리에서 `.from('profiles')` 사용 → `user_profiles` 테이블 조회 실패

**수정**: 2개소 모두 `.from('user_profiles')`로 변경
- Line 134: 서브그룹 멤버 프로필 조회
- Line 160: 연령대 분포 프로필 조회

**변경 규모**: 2 lines 변경

### 3.5 GroupSettings.jsx — cascade 삭제 추가 (HIGH)

**문제**: 그룹 삭제 시 `group_subgroups`, `coupons` 테이블의 FK 레코드 미삭제 → 제약조건 위반

**수정**: 그룹 삭제 전 관련 테이블 선삭제 추가
```jsx
// 서브그룹 삭제
await supabase
  .from('group_subgroups')
  .delete()
  .eq('group_id', groupId);

// 쿠폰 삭제
await supabase
  .from('coupons')
  .delete()
  .eq('group_id', groupId);
```

**변경 규모**: +10 lines

---

## 4. 미수정 항목 (정상 확인)

| 항목 | 파일 | 사유 |
|------|------|------|
| NCS[8] 계산 | Result.jsx | 레거시 JSP(adminResult.jsp:322)와 동일 — 의도된 알고리즘 |
| 결제 타이밍 | Checkout.jsx | 결제 성공 후에만 evaluation 생성 — 정상 흐름 |
| Dashboard 테이블명 | Dashboard.jsx | `src/`에서 이미 `user_profiles` 사용 |
| Statistics 컬럼명 | Statistics.jsx | `src/`에서 이미 `country` 사용 |
| DeletedUserList 필터 | DeletedUserList.jsx | `src/`에서 이미 `deleted_at` 필터 적용 |
| UserInfo 테이블명 | UserInfo.jsx | `src/`에서 이미 `user_profiles` 사용 |
| MailForm receiver_id | MailForm.jsx | `src/`에서 이미 `user_profiles` 사용 |
| GroupUserResult 테이블명 | GroupUserResult.jsx | `src/`에서 이미 `user_profiles` 사용 |

---

## 5. 빌드 결과

```
$ npm run build
vite v7.3.1 building for production...
✓ 152 modules transformed.
dist/index.html            0.91 kB │ gzip:   0.57 kB
dist/assets/index-BuR-GBCe.css   45.20 kB │ gzip:   8.89 kB
dist/assets/index-Bu9fVJJm.js   622.87 kB │ gzip: 175.98 kB
✓ built in 6.61s
```

---

## 6. 수정 파일 요약

| # | 파일 | 심각도 | 변경 내용 | 변경 규모 |
|---|------|--------|----------|----------|
| 1 | src/pages/user/ResultAvg.jsx | CRITICAL | 전면 재작성 (직접 쿼리) | +184 -21 |
| 2 | src/pages/auth/InviteRegister.jsx | CRITICAL | 쿠폰 사용 처리 추가 | +18 |
| 3 | src/pages/admin/UserList.jsx | HIGH | deleted_at 필터 추가 | +1 |
| 4 | src/pages/group/GroupStatistics.jsx | HIGH | 테이블명 profiles→user_profiles | 2줄 변경 |
| 5 | src/pages/group/GroupSettings.jsx | HIGH | cascade 삭제 추가 | +10 |
| **합계** | **5 files** | | | **+198 -21** |

---

*작성: Claude Code — 세션 15*
*프로젝트: D:\competency*
