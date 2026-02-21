# 세션 5 개발일지 — 공개 역량 페이지 3종 원본 일치 수정

**날짜**: 2026-02-21
**커밋**: `78a9f91`
**배포**: https://competency.dreamitbiz.com

---

## 작업 요약

사용자 요청으로 공개 역량 페이지 3종(`/competency`, `/competency/2015`, `/competency/ncs`)의 디자인과 인터랙션을 원본 JSP와 일치하도록 수정하였다.

---

## 변경 내역

### 1. `/competency` — 나무 배경 원 위치 재조정

**파일**: `src/styles/competency.css`

**문제**: 8대 핵심역량 원(circle)이 시계 방향 정원 배치로 되어 있어 원본 JSP의 나무 가지 산포 배치와 달랐음.

**수정 내용**:
- `.comp-top-content` aspect-ratio: `1/1` → `25/14` (원본 비율)
- `.comp-top-content` max-width: `460px` → `500px`
- `.tree-bg` opacity: `0.12` → `0.15`, height: `80%` → `95%`
- `.comp-circle` 크기: `80px` → `70px`, 아이콘: `45px` → `36px`
- 8개 원 위치를 원본 JSP 절대좌표(px) → CSS 퍼센트(%)로 변환:

| 역량 | 변경 전 | 변경 후 |
|------|---------|---------|
| 비판적사고 | left:0% top:35% | left:0% top:57% |
| 창의력 | left:18% top:2% | left:6% top:21% |
| 의사소통 | left:45% top:0% | left:26% top:36% |
| 협업능력 | left:72% top:2% | left:42% top:0% |
| 디지털 | left:90% top:35% | left:62% top:4% |
| 감성지능 | left:90% top:65% | left:78% top:11% |
| 문제해결 | left:72% top:88% | left:86% top:36% |
| 마음습관 | left:45% top:90% | left:86% top:75% |

### 2. `/competency/2015` — 매핑 배지 색상 가독성 개선

**파일**: `src/pages/public/Competency2015.jsx`

**문제**: 매핑 배지가 투명한 배경 + 역량 색상 텍스트로 되어 있어 가독성이 떨어졌음.

**수정 내용**:
```jsx
// Before (투명 배경)
background: comp.color + '22', color: comp.color

// After (진한 배경 + 흰색 텍스트)
background: comp.color, color: '#fff'
```

### 3. `/competency/ncs` — SVG 클릭 인터랙션 원본 일치

**파일**: `src/pages/public/CompetencyNCS.jsx`

**문제**: 원 클릭 시 연결된 NCS 텍스트만 역량 색상으로 변경되는 단순 로직이었으나, 원본 JSP는 4가지 요소를 동시에 제어함.

**수정 내용**:

#### CIRCLE_NCS_MAP 구조 확장
각 원에 `label`, `inner`, `wedges` 속성 추가:
```jsx
{ color, label: 'st3X', inner: 'st4X', fills: [...], wedges: [...] }
```

#### 새 상수 추가
```jsx
const ALL_LABELS = ['st31',...,'st39'];       // 역량명 텍스트
const ALL_INNER_CIRCLES = ['st41',...,'st48']; // 내부 원
const ALL_NCS_WEDGES = ['st20',...,'st29'];    // NCS 쐐기 영역
```

#### handleCircleClick — 4단계 색상 변화
| 단계 | 요소 | 기본 | 활성 |
|------|------|------|------|
| 1 | 역량 라벨 (st31-39) | #434343 | #FFFFFF (클릭된 것만) |
| 2 | 내부 원 (st41-48) | #FFFFFF | 역량 색상 (클릭된 것만) |
| 3 | NCS 쐐기 (st20-29) | #FFFFFF | 역량 색상 (연결된 것만) |
| 4 | NCS 텍스트 (textfill20-29) | #444444 | #FFFFFF (연결된 것만) |

#### resetColors — 전체 복원
- NCS 텍스트 → #FFFFFF
- 역량 라벨 → #434343
- 내부 원 → #FFFFFF
- NCS 쐐기 → 인라인 스타일 제거 (SVG 원래 색 복원)

#### NCS 매핑 배지 색상 개선
2015 페이지와 동일하게 진한 배경 + 흰색 텍스트로 변경.

---

## 변경 파일 요약

| 파일 | 변경 | 줄수 |
|------|------|------|
| `src/styles/competency.css` | 원 위치/크기/배경 재조정 | +21 -30 |
| `src/pages/public/Competency2015.jsx` | 배지 색상 변경 | +1 -1 |
| `src/pages/public/CompetencyNCS.jsx` | 클릭 로직 4단계 구현 + 배지 색상 | +67 -23 |
| **합계** | 3 files changed | +89 -54 |

---

## 빌드 & 배포

- Vite 빌드: 152 modules, 5.29s
- JS 583KB / CSS 38KB (gzip: 165KB / 8KB)
- GitHub Actions 배포: 성공 (Run #20)
