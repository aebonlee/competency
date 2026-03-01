# 세션 24 개발일지 — 검사 페이지 1문항/1풀스크린 전환 (레거시 1:1 매칭)

**날짜**: 2026-03-01
**세션**: 24
**작업 유형**: UX 전면 개편

---

## 1. 작업 개요

레거시 JSP 사이트(competency.or.kr)는 fullPage.js를 사용하여 **1문항/1풀스크린** + **뒤로가기 차단** 방식.
현재 React 버전은 56개 문항을 한 페이지에 스크롤로 표시하는 방식이었음.
레거시 코드(evaluation.jsp + app.css + serveyform.css + fullpage.css)를 라인 단위로 분석하여 1:1 매칭 구현.

---

## 2. 레거시 분석 결과

### 2-1. 레거시 HTML 구조 (evaluation.jsp:294-320)

```html
<tr class="section real">
  <td class="assessment-text">위쪽 문장</td>
  <td>
    <div class="assessment-scale">
      <div class="assessment-options">
        <div class="assessment-option"> <!-- × 4 (세로 배치) -->
          <input type="radio" class="option-input radio" name="point[id]" value="30">
          <label for="point[id]_30"></label>  <!-- 비어있는 라벨 -->
        </div>
        <div class="assessment-bar">
          <div class="assessment-rating"><span>4</span></div>
        </div>
      </div>
    </div>
  </td>
  <td class="assessment-text">아래쪽 문장</td>
</tr>
```

### 2-2. 레거시 핵심 CSS (app.css)

- `assessment-options` — flex-direction: column (세로 배치)
- `assessment-option` — flex-basis: 50px, margin-top: 10px
- `label:before` — position: absolute, left: 50%, margin-left: -1.55em
- 원형 크기: 1번/4번 3.2em, 2번/3번 2.5em (margin-left: -1.25em)
- `assessment-bar` — position: absolute, width: 4px, height: calc(100% - 3.5em)

### 2-3. 레거시 fullpage.js 설정 (evaluation.jsp:367-404)

- `autoScrolling: true` — 한 번에 한 섹션
- `onLeave` — 미응답 시 다운 스크롤 차단, 응답 후 업 스크롤 차단
- `afterLoad` — 진행 현황 텍스트 업데이트 (X/56)
- `.fp-section { visibility: hidden; opacity: 0; }` + `.active { visible; opacity: 1; }`

### 2-4. 레거시 레이아웃

- `question-wrapper` max-width: **367px**
- progress-bar 위치: `top: calc(50% - 280px)` (뷰포트 상단)
- 모바일(768px 이하): `td { display: block }` → 세로 스태킹

---

## 3. 변경 파일 (3개)

### 3-1. `src/styles/assessment.css` — 전면 재작성

**레거시 매칭 핵심 변경:**

| CSS 속성 | 수정 전 | 수정 후 (레거시 매칭) |
|----------|---------|---------------------|
| `.assessment-fullpage` z-index | 50 | **1100** (navbar 1000 위) |
| `.assessment-progress` z-index | 200 | **1200** (fullpage 위) |
| `.question-card-fullpage` max-width | 600px | **367px** (레거시 동일) |
| `.assessment-scale` | display: flex | **position: relative** |
| `.assessment-options` | gap: 16px | **margin: 0 0.2em** |
| `.assessment-option` | — | **flex-basis: 50px, margin-top: 10px** |
| `label` padding | padding-top: 48px | **padding: 3.5em 0 0 0** |
| `label:before` positioning | transform: translateX(-50%) | **margin-left: -1.55em** |
| `label:before` size | px 단위 | **em 단위 (3.2em/2.5em)** |
| `.assessment-bar` | top/bottom: 24px | **top: 20px, height: calc(100% - 3.5em)** |
| checked transform | translateX(-50%) scale(1.1) | **scale(1.1)** |

### 3-2. `src/components/AssessmentRadio.jsx`

- `assessment-bar` 내부에 `assessment-rating` div 추가 (레거시 동일 구조)

### 3-3. `src/pages/user/Evaluation.jsx`

- `transitioning` state → `transitioningRef` (useRef) 변경 — stale closure 방지
- `handleAnswer` useCallback 의존성 배열 수정 (빈 배열 → ref 사용으로 안전)
- keyboard effect에 `handleAnswer` 의존성 추가

---

## 4. 검증

- `npx vite build` — 빌드 성공 (3회)
- 번들 크기: index.js 324.04 KB (변화 없음)
