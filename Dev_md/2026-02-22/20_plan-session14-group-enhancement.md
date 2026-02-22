# 개발 계획 백업 — 세션 14: 기업/대학별 그룹 관리자 페이지 강화

**작성일**: 2026-02-22
**세션**: 14
**상태**: 구현 완료

---

## 1. Context (배경)

현재 그룹 시스템(11개 페이지)은 기본 기능만 제공.
- GroupSettings는 이름/기관명/설명 3개 필드만 있음
- GroupMain은 4개 통계 + 6개 아이콘 링크만 표시
- 레거시 JSP 시스템에 있던 기업/대학별 커스터마이징(로고, 서브그룹, 상담, 통계 등)이 미반영

**목표**: 각 기업/대학이 자체 관리자 페이지처럼 사용할 수 있도록 그룹 설정 및 대시보드를 강화

---

## 2. 수정/생성 대상 파일 (6개)

| # | 파일 | 작업 | 설명 |
|---|------|------|------|
| 1 | `src/styles/group.css` | 수정 | 서브그룹, 로고, 통계 등 새 CSS 추가 (~60줄) |
| 2 | `src/pages/group/GroupSettings.jsx` | 수정 | 전면 확장: 그룹유형, 연락처, 로고, 서브그룹 CRUD |
| 3 | `src/pages/group/GroupMain.jsx` | 수정 | 관리자 대시보드 스타일로 재설계 (KPI, 최근활동, 카테고리별 빠른이동) |
| 4 | `src/pages/group/GroupStatistics.jsx` | 신규 | 그룹 통계: 역량 평균, 서브그룹별 완료율, 인구통계 분포 |
| 5 | `src/pages/group/GroupUserList.jsx` | 수정 | 서브그룹 필터 드롭다운 추가 |
| 6 | `src/App.jsx` | 수정 | `/group/statistics` 라우트 추가 |

---

## 3. DB 스키마 변경 (Supabase SQL — 별도 실행)

### groups 테이블 컬럼 추가
```sql
ALTER TABLE groups ADD COLUMN IF NOT EXISTS group_type text DEFAULT 'other';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS contact_phone text DEFAULT '';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS contact_email text DEFAULT '';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS website text DEFAULT '';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS logo_url text DEFAULT '';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS description text DEFAULT '';
```

### group_subgroups 테이블 신규 생성
```sql
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

> 프론트엔드 코드는 새 컬럼/테이블이 없어도 optional chaining + 기본값으로 graceful 처리

---

## 4. GroupSettings.jsx 확장 상세

### 변경 전: 3필드 (이름, 기관명, 설명) + 삭제
### 변경 후: 5개 섹션 카드

**섹션 A: 기본 정보** (기존 확장)
- group_name (text, required), org_name (text), description (textarea)
- `group_type` (select: 기업/대학/기관/기타)
- `max_members` (number, default 100)

**섹션 B: 연락처 정보** (신규 카드)
- contact_phone (tel), contact_email (email), website (url)

**섹션 C: 브랜딩** (신규 카드)
- logo_url (URL 텍스트 입력)
- 로고 미리보기 (`<img>` + onError 숨김)

**섹션 D: 서브그룹 관리** (신규 카드 — 핵심)
- 서브그룹 목록: 이름 | 수정/삭제 버튼
- 추가 폼: 이름 입력 + 추가 버튼
- 인라인 수정 모드
- `group_subgroups` 테이블 CRUD

**섹션 E: 위험 영역** — 기존 유지

---

## 5. GroupMain.jsx 재설계 상세

### 변경 전: 4 통계 + 6 아이콘 링크
### 변경 후: 관리자 대시보드 형태

**그룹 정보 헤더** — 로고 + 이름 + 유형 뱃지 + 기관명

**KPI 카드 (5개)** — admin.css `dashboard-card` 재활용
| 카드 | 메인 값 | 서브 텍스트 | 색상 |
|------|---------|------------|------|
| 총 멤버 | memberCount | max 대비 N% | blue |
| 검사 완료 | completedCount | 완료율 N% | green |
| 검사 진행중 | inProgressCount | 총 N건 | orange |
| 쿠폰 현황 | totalCoupons | 사용률 N% | red |
| 서브그룹 | subgroupCount | - | blue |

**최근 활동 (2열)**
- 최근 가입 멤버 5건 (이름 → 상세 링크)
- 최근 검사 5건 (진행률 뱃지)

**빠른 이동 (3그룹)**
- 멤버: 멤버 목록, 초대 관리, 조직도
- 검사/통계: 검사 현황, 통계
- 관리: 서브관리자, 쿠폰 관리, 그룹 설정

---

## 6. GroupStatistics.jsx (신규) 상세

**섹션 1: 요약 KPI (4카드)** — 총 멤버, 총 검사, 완료, 완료율

**섹션 2: 8대 역량 평균 점수**
- `CompetencyPolarChart` 재활용 (src/components/CompetencyChart.jsx)
- 역량별 평균 점수 + 등급 테이블
- 쿼리: `results.point1~point8` 평균

**섹션 3: 서브그룹별 완료율**
- CSS 바 차트 (admin Statistics.jsx의 renderBar 패턴)

**섹션 4: 멤버 인구통계 분포**
- 연령대별 분포 바 차트
- `AGE_LIST` from `competencyInfo.js` 재활용

---

## 7. GroupUserList.jsx 서브그룹 필터

- `group_subgroups` 조회 → 필터 드롭다운
- 프로필 쿼리에 `subgrp` 필드 포함
- 테이블에 서브그룹 열 추가
- 검색 + 서브그룹 필터 동시 적용

---

## 8. CSS 추가 (group.css 끝에)

| 클래스 | 용도 |
|--------|------|
| `.group-stats-5` | 5열 통계 그리드 + 반응형 |
| `.group-info-header` / `img` / `-text` | 그룹 정보 헤더 (로고 + 이름) |
| `.group-type-badge` | 그룹 유형 뱃지 |
| `.group-logo-preview` / `img` | 로고 미리보기 |
| `.subgroup-list` | 서브그룹 목록 컨테이너 |
| `.subgroup-item` / `-name` / `-count` / `-actions` | 서브그룹 항목 |
| `.subgroup-add-form` / `input` | 서브그룹 추가 폼 |

---

## 9. App.jsx 라우트 추가

```jsx
import GroupStatistics from './pages/group/GroupStatistics';
<Route path="/group/statistics" element={<GroupGuard><GroupStatistics /></GroupGuard>} />
```

---

## 10. 구현 순서 (실제 수행 순서)

1. `group.css` — 새 CSS 클래스 추가
2. `GroupSettings.jsx` — 전면 확장
3. `GroupMain.jsx` — 대시보드 재설계
4. `GroupStatistics.jsx` — 신규 생성
5. `App.jsx` — 라우트 추가
6. `GroupUserList.jsx` — 서브그룹 필터
7. 빌드 테스트 (`npm run build`)

---

## 11. 구현 결과

| # | 파일 | 변경 규모 | 상태 |
|---|------|----------|------|
| 1 | `src/styles/group.css` | +130줄 | 완료 |
| 2 | `src/pages/group/GroupSettings.jsx` | 259행 → 340행 (+339 -131) | 완료 |
| 3 | `src/pages/group/GroupMain.jsx` | 219행 → 262행 (+341 -125) | 완료 |
| 4 | `src/pages/group/GroupStatistics.jsx` | 신규 225행 | 완료 |
| 5 | `src/App.jsx` | +2행 | 완료 |
| 6 | `src/pages/group/GroupUserList.jsx` | 231행 → 231행 (+54 -0) | 완료 |
| **합계** | **6개 파일** | **+1064 -125** | **완료** |

- 빌드: vite v7.3.1, 152 modules, 10.21s (성공)
- 커밋: `a0cef0a` — main 브랜치
- 푸시: `b1bd2bb..a0cef0a main -> main` (성공)
- 배포: GitHub Actions 자동 배포 트리거

---

*작성: 2026-02-22*
*GitHub: https://github.com/aebonlee/competency*
