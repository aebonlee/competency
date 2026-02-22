# 개발일지 — 세션 14: 기업/대학별 그룹 관리자 페이지 강화

**날짜**: 2026-02-22
**세션**: 14
**커밋**: `a0cef0a`

---

## 1. 작업 목표

기존 그룹 시스템(11개 페이지)의 기본 기능을 기업/대학 자체 관리자 페이지 수준으로 강화.
레거시 JSP 시스템에 있던 기업별 커스터마이징(로고, 서브그룹, 통계 등)을 React로 구현.

---

## 2. 수행 작업 상세

### 2.1 group.css — CSS 클래스 추가 (+130줄)

| 추가 클래스 | 용도 |
|------------|------|
| `.group-stats-5` | 5열 통계 그리드 (반응형: 768px→2열, 480px→1열) |
| `.group-info-header` | 그룹 로고+이름+유형 뱃지 헤더 |
| `.group-type-badge` | 기업/대학/기관 유형 라벨 |
| `.group-logo-preview` | 로고 URL 미리보기 영역 (dashed border) |
| `.subgroup-list` / `.subgroup-item` | 서브그룹 관리 목록 |
| `.subgroup-item-name` / `-actions` | 서브그룹 이름+버튼 |
| `.subgroup-add-form` | 서브그룹 추가 입력 폼 |

### 2.2 GroupSettings.jsx — 5개 섹션으로 전면 확장

**변경 전**: 기본 정보 3필드(이름, 기관명, 설명) + 위험 영역(삭제)
**변경 후**: 5개 섹션 카드

| 섹션 | 내용 | 필드 |
|------|------|------|
| A. 기본 정보 | 기존 확장 | group_name*, org_name, description, group_type(select), max_members(number) |
| B. 연락처 정보 | 신규 | contact_phone(tel), contact_email(email), website(url) |
| C. 브랜딩 | 신규 | logo_url(url) + 이미지 미리보기(onError 처리) |
| D. 서브그룹 관리 | 신규 핵심 | CRUD: 목록 표시 + 인라인 수정 + 추가 + 삭제(confirm) |
| E. 위험 영역 | 기존 유지 | 그룹 삭제 (그룹명 입력 확인) |

**주요 구현 사항**:
- `group_subgroups` 테이블 CRUD (insert/update/delete + select)
- 인라인 수정 모드 (editingSubgroupId state)
- 로고 미리보기 + onError fallback (logoError state)
- 모든 새 필드는 optional chaining + 기본값으로 DB 컬럼 없어도 graceful 처리

### 2.3 GroupMain.jsx — 관리자 대시보드 재설계

**변경 전**: 4개 통계 카드 + 6개 아이콘 Quick Link
**변경 후**: 관리자 대시보드 형태

| 섹션 | 구성 |
|------|------|
| 그룹 정보 헤더 | 로고 이미지 + 그룹명 + 유형 뱃지(기업/대학 등) + 기관명 |
| KPI 카드 (5개) | 총 멤버(blue), 검사 완료(green), 진행중(orange), 쿠폰(red), 서브그룹(blue) |
| 최근 활동 (2열) | 최근 가입 멤버 5건 + 최근 검사 5건 |
| 빠른 이동 (3그룹) | 멤버(3링크), 검사/통계(2링크), 관리(3링크) |

**데이터 패칭**:
- groups (기본 정보 + 새 필드)
- group_members (멤버 수 + 최근 5건)
- eval_list (검사 통계 + 최근 5건)
- coupons (총 쿠폰 + 사용률)
- group_subgroups (서브그룹 수)
- profiles (최근 검사 사용자명 조회)

**admin.css 클래스 재활용**:
- `dashboard-card` (blue/green/orange/red)
- `dashboard-section-title`
- `dashboard-card-header` / `dashboard-view-all`
- `dashboard-quick-actions` / `quick-action-group`
- `dashboard-empty`

### 2.4 GroupStatistics.jsx — 신규 생성 (225행)

| 섹션 | 구성 |
|------|------|
| KPI (4카드) | 총 멤버, 총 검사, 완료, 완료율 |
| 8대 역량 평균 (2열) | CompetencyPolarChart 차트 + 역량별 평균/등급 테이블 |
| 서브그룹별 완료율 | CSS 바 차트 (renderBar 패턴) |
| 연령대 분포 | CSS 바 차트 (AGE_LIST 활용) |

**재활용 컴포넌트/데이터**:
- `CompetencyPolarChart` from `CompetencyChart.jsx`
- `COMPETENCY_LABELS`, `COMPETENCY_COLORS`, `AGE_LIST` from `competencyInfo.js`
- `renderBar` 패턴 from `admin/Statistics.jsx`

**등급 기준**:
| 점수 범위 | 등급 | 뱃지 색상 |
|-----------|------|-----------|
| 90+ | A | green |
| 80~89 | B | green |
| 70~79 | C | yellow |
| 60~69 | D | gray |
| 0~59 | F | gray |

### 2.5 GroupUserList.jsx — 서브그룹 필터 추가

- 서브그룹 목록 조회 (group_subgroups 테이블)
- 필터 드롭다운 (검색 입력 옆에 배치)
- 프로필 조회에 `subgrp` 필드 포함
- 테이블에 서브그룹 열 조건부 표시 (서브그룹이 있을 때만)
- 검색(이름/이메일/전화) + 서브그룹 필터 동시 적용

### 2.6 App.jsx — 라우트 추가

```jsx
import GroupStatistics from './pages/group/GroupStatistics';
<Route path="/group/statistics" element={<GroupGuard><GroupStatistics /></GroupGuard>} />
```

---

## 3. 변경 규모 요약

| 파일 | 추가 | 삭제 | 순변경 |
|------|------|------|--------|
| src/styles/group.css | +130 | -0 | +130 |
| src/pages/group/GroupSettings.jsx | +339 | -131 | +208 |
| src/pages/group/GroupMain.jsx | +341 | -125 | +216 |
| src/pages/group/GroupStatistics.jsx | +225 | -0 | +225 (신규) |
| src/pages/group/GroupUserList.jsx | +54 | -0 | +54 |
| src/App.jsx | +2 | -0 | +2 |
| **합계** | **+1,064** | **-125** | **+835** |

---

## 4. 빌드 & 배포

| 항목 | 내용 |
|------|------|
| 빌드 도구 | vite v7.3.1 |
| 모듈 수 | 152 modules (+1 from 세션13의 151) |
| 빌드 시간 | 10.21s |
| 번들 크기 | JS: 618.94 kB (gzip: 175.12 kB), CSS: 45.20 kB (gzip: 8.89 kB) |
| 빌드 결과 | 성공 |
| 커밋 해시 | `a0cef0a` |
| 커밋 메시지 | feat: 그룹 관리자 페이지 강화 — 설정 5섹션, 대시보드 재설계, 통계 신규, 서브그룹 필터 |
| 푸시 | `b1bd2bb..a0cef0a main -> main` (성공) |
| 배포 | GitHub Actions 자동 배포 (main push 트리거) |

---

## 5. 별도 실행 필요 사항

### Supabase DB 스키마 변경
프론트엔드는 새 컬럼/테이블 없이도 graceful하게 동작하지만,
전체 기능을 사용하려면 아래 SQL을 Supabase SQL Editor에서 실행해야 함:

```sql
-- groups 테이블 컬럼 추가
ALTER TABLE groups ADD COLUMN IF NOT EXISTS group_type text DEFAULT 'other';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS contact_phone text DEFAULT '';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS contact_email text DEFAULT '';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS website text DEFAULT '';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS logo_url text DEFAULT '';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS max_members int DEFAULT 100;

-- group_subgroups 테이블 생성
CREATE TABLE IF NOT EXISTS group_subgroups (
    id serial PRIMARY KEY,
    group_id int NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text DEFAULT '',
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_group_subgroups_group_id ON group_subgroups(group_id);
ALTER TABLE group_subgroups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subgroups_owner" ON group_subgroups FOR ALL
  USING (group_id IN (SELECT id FROM groups WHERE owner_id = auth.uid()));
```

---

*작성: 2026-02-22*
*GitHub: https://github.com/aebonlee/competency*
