# 세션 27 개발일지 — 마이그레이션 SQL 전면 수정 (FK 타입 + 실행 순서 + 멱등성)

**날짜**: 2026-03-01
**세션**: 27
**작업 유형**: 버그 수정 — Supabase 마이그레이션 SQL 오류 3건 해소

---

## 1. 문제

Supabase Dashboard에서 `20260301_consolidated_pending.sql` 실행 시 에러:

```
ERROR: 42804: foreign key constraint "group_members_group_id_fkey" cannot be implemented
DETAIL: Key columns "group_id" and "id" are of incompatible types: uuid and integer.
```

분석 결과 3가지 문제가 발견됨:

| # | 문제 | 심각도 |
|---|------|--------|
| 1 | `group_id UUID` vs `groups.id INTEGER` FK 타입 불일치 | **CRITICAL** — 실행 즉시 에러 |
| 2 | `group_members` 정책이 아직 미생성 `group_managers`를 참조 (forward reference) | **HIGH** — 정책 생성 실패 |
| 3 | 기존 정책명 오류: `mcc_eval_select_own` → 실제 `eval_list_select` 등 | **HIGH** — DROP 미작동 → CREATE 중복 에러 |

---

## 2. 수정 내용

### 2-1. FK 타입 수정 (4곳)

| 테이블 | 수정 전 | 수정 후 |
|--------|--------|--------|
| group_members | `group_id UUID` | `group_id INTEGER` |
| group_managers | `group_id UUID` | `group_id INTEGER` |
| group_invitations | `group_id UUID` | `group_id INTEGER` |
| group_subgroups | `group_id UUID` | `group_id INTEGER` |

### 2-2. 실행 순서 재구성 (forward reference 해소)

**수정 전** (문제):
```
CREATE TABLE group_members + 정책(group_managers 참조) → ❌ group_managers 미존재
CREATE TABLE group_managers + 정책
```

**수정 후** (8단계 순서):
```
STEP 1: 테이블 5개 CREATE (정책 없이 구조만)
STEP 2: ALTER TABLE (기존 테이블 컬럼 추가)
STEP 3: RLS 활성화
STEP 4: 헬퍼 함수 (is_admin)
STEP 5: 신규 테이블 정책 (테이블 전부 존재 → 참조 안전)
STEP 6: 기존 테이블 정책 교체
STEP 7: 인덱스
STEP 8: RPC 함수 (check_user_status)
```

### 2-3. 멱등성 보장 (재실행 안전)

모든 `CREATE POLICY` 앞에 `DROP POLICY IF EXISTS` 추가.
기존 정책명을 실제 이름으로 수정:

| DROP 대상 (수정 전) | DROP 대상 (수정 후) | 비고 |
|---------------------|---------------------|------|
| `mcc_eval_select_own` | `eval_list_select` | 초기 스키마 정책명 |
| `mcc_results_select_own` | `results_select` | 초기 스키마 정책명 |
| `mcc_coupons_select` | `coupons_select` | 초기 스키마 정책명 |

---

## 3. 변경 파일 (3개)

| 파일 | 변경 | 설명 |
|------|------|------|
| `20260301_consolidated_pending.sql` | 전면 재작성 | 8단계 순서 + 멱등성 |
| `20260222_phase2_schema.sql` | `UUID` → `INTEGER` | FK 타입 4곳 수정 |
| `20260222_rls_policy_fixes.sql` | DROP 정책명 수정 + 멱등성 추가 | 6곳 수정 |

---

## 4. 검증

- `grep "group_id UUID" supabase/migrations/` → 0건
- 통합본 순서: 테이블 → 컬럼 → RLS → 함수 → 정책 → 인덱스 → RPC (forward reference 없음)
- 모든 CREATE POLICY 앞에 DROP IF EXISTS (재실행 안전)
