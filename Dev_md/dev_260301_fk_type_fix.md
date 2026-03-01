# 세션 27 개발일지 — group_id FK 타입 불일치 수정

**날짜**: 2026-03-01
**세션**: 27
**작업 유형**: 버그 수정 — Supabase 마이그레이션 실행 오류 해소

---

## 1. 문제

Supabase Dashboard에서 `20260301_consolidated_pending.sql` 실행 시 에러 발생:

```
ERROR: 42804: foreign key constraint "group_members_group_id_fkey" cannot be implemented
DETAIL: Key columns "group_id" and "id" are of incompatible types: uuid and integer.
```

---

## 2. 원인

`groups` 테이블의 PK가 `serial` (INTEGER) 타입으로 정의됨 (`20260220230614_competency_schema.sql:79-86`):

```sql
CREATE TABLE IF NOT EXISTS groups (
    id serial PRIMARY KEY,  -- INTEGER
    ...
);
```

그런데 Phase 2 마이그레이션에서 새 테이블 4개의 `group_id`를 `UUID`로 잘못 정의:

| 테이블 | 잘못된 정의 | 올바른 정의 |
|--------|-----------|-----------|
| group_members | `group_id UUID` | `group_id INTEGER` |
| group_managers | `group_id UUID` | `group_id INTEGER` |
| group_invitations | `group_id UUID` | `group_id INTEGER` |
| group_subgroups | `group_id UUID` | `group_id INTEGER` |

> 참고: `group_org` 테이블은 이미 `group_id INTEGER`로 올바르게 정의되어 있었음.

---

## 3. 수정 내용

### 3-1. 수정 파일 (2개)

| 파일 | 수정 | 변경 수 |
|------|------|---------|
| `supabase/migrations/20260301_consolidated_pending.sql` | `group_id UUID` → `INTEGER` | 4곳 |
| `supabase/migrations/20260222_phase2_schema.sql` | `group_id UUID` → `INTEGER` | 4곳 |

### 3-2. 수정 위치 (통합본 기준)

| 줄 | 테이블 | 변경 |
|----|--------|------|
| 25 | group_members | `UUID` → `INTEGER` |
| 70 | group_managers | `UUID` → `INTEGER` |
| 112 | group_invitations | `UUID` → `INTEGER` |
| 173 | group_subgroups | `UUID` → `INTEGER` |

---

## 4. 검증

- `grep "group_id UUID" supabase/migrations/` → 0건 (전부 수정 완료)
- Supabase Dashboard에서 재실행 → 성공 확인 필요
