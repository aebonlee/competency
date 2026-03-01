# 세션 23 개발일지 — 검사 문항 디자인 레거시 매칭

**날짜**: 2026-03-01
**세션**: 23
**작업 유형**: UI 디자인 수정

---

## 1. 작업 개요

기존 JSP 사이트(competency.or.kr)의 검사 문항 디자인과 현재 React 버전의 디자인이 상이하여, 레거시 디자인에 맞춰 일치시키는 작업 수행.

**참조 레거시 파일**:
- `tomcat/webapps/ROOT/app.css` (lines 4110-4207) — 라디오 버튼 기본 스타일
- `tomcat/webapps/ROOT/serveyform.css` (lines 361-409) — 문항 텍스트 테두리 + 체크 색상

---

## 2. 변경 내역

### 2-1. 라디오 버튼 디자인 전면 교체

**이전 (React)**:
- `appearance: none` 으로 input 직접 스타일링
- 모든 위치 동일한 파란색 (`--primary-blue`)
- 체크 시 흰색 원형 dot 표시
- 라벨 텍스트 숨김 (`sr-only`)

**이후 (레거시 매칭)**:
- input 숨김 + `label:before` 의사요소로 원형 버튼 생성
- 위치별 고유 색상 (항상 표시):
  - 1번: `#024959` (dark teal, 40px)
  - 2번: `#027373` (medium teal, 30px)
  - 3번: `#F2B705` (yellow, 30px)
  - 4번: `#F29F05` (orange, 40px)
- 체크 시 `✓` 체크마크 + `scale(1.1)` 효과
- `box-shadow: 0 2px 4px 0 rgba(82,82,82,.5)` 그림자
- 라벨 텍스트 표시: "매우 그렇다", "그렇다", "아니다", "매우 아니다"

### 2-2. 문항 텍스트 테두리 추가

- **상단 문항**: `border-left: 7px solid #024959` (teal) + box-shadow
- **하단 문항**: `border-right: 7px solid #F29F05` (orange) + box-shadow
- `font-weight: 500` → `700` (bold)

### 2-3. 반응형 대응

- 모바일(768px 이하): 원 크기 축소 (34px/26px), gap 10px, 글씨 10px

---

## 3. 검증 결과

| 항목 | 결과 |
|------|------|
| Vite 빌드 | ✅ 성공 (2.90s, 경고 0건) |

---

## 4. 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/AssessmentRadio.jsx` | sr-only 제거, 라벨 텍스트 직접 표시 |
| `src/styles/assessment.css` | 라디오 버튼 레거시 디자인 매칭 + 문항 테두리 추가 |
