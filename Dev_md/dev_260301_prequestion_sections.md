# 세션 25 개발일지 — 검사 프리퀘스천 섹션 + 배경 디자인 (레거시 1:1 매칭)

**날짜**: 2026-03-01
**세션**: 25
**작업 유형**: UX 보완 — 검사 시작 전 안내 흐름 구현

---

## 1. 작업 개요

레거시 JSP 사이트(evaluation.jsp)는 검사 시작 전에 5개 프리퀘스천 섹션(인트로→가이드×2→예시문항1→예시문항2)을 fullPage.js로 표시.
React 버전에는 간단한 인트로+가이드만 있었고, 예시문항/배경 이미지/스피치 버블 디자인이 누락됨.
레거시 코드(evaluation.jsp 115-277행 + serveyform.css 320-835행)를 라인 단위로 분석하여 1:1 매칭 구현.

---

## 2. 레거시 분석 결과

### 2-1. 프리퀘스천 섹션 구조 (evaluation.jsp:115-277)

| 섹션 | 인덱스 | 내용 |
|------|--------|------|
| section1 | 0 | 인트로 — 타이틀 + "(56 문항)" + scroll-btn mouse 애니메이션 |
| section2 | 1,2 | 가이드×2 — speech-bubble(파란 그라디언트) + 안내문(회색 배경) |
| section3 | 3 | 예시문항1 — 1번/4번 옵션에 popover (좌/우 배치) |
| section4 | 4 | 예시문항2 — 2번/3번 옵션에 popover (우/좌 배치) |

### 2-2. 배경 이미지 (serveyform.css:320-328)

- `#servey-form { background: url('./img/Mesa.svg'); background-size: cover; background-attachment: fixed; }`
- 데스크톱만 적용 (`@media min-width: 1025px`)

### 2-3. 스피치 버블 (serveyform.css:758-776)

- `background: linear-gradient(122deg, rgba(16, 107, 181, 1) 0%, rgba(16, 107, 181, 0.9) 100%)`
- `color: #fff`, `filter: drop-shadow(...)`

### 2-4. 팝오버 (serveyform.css:809-835)

- Bootstrap popover 사용 (`trigger: 'manual'` → 항상 표시)
- 배경: `#106bb5`, 텍스트: `#fff`, 폰트: `12px`
- 예시1: 1번 옵션(좌) "위의 문장에 동의하는 경우...", 4번 옵션(우) "아래의 문장에 동의하는 경우..."
- 예시2: 2번 옵션(우) "양쪽 모두 동의하지만 위 문장에 더...", 3번 옵션(좌) "아래 문장에 더..."

### 2-5. 스크롤 마우스 애니메이션 (serveyform.css:661-719)

- `.mouse { width: 35px; height: 55px; border: 3px solid #444; border-radius: 23px; }`
- 내부 점: `8px × 8px`, `animation: ani-mouse 2.5s linear infinite`
- "Scroll Down" 텍스트: `color: #DC343B; font-weight: bold;`

---

## 3. 변경 파일 (3개)

### 3-1. `public/images/Mesa.svg` — 신규 (레거시에서 복사)

- `tomcat/webapps/ROOT/img/Mesa.svg` → `public/images/Mesa.svg`

### 3-2. `src/pages/user/Evaluation.jsx` — 다단계 플로우 구현

**주요 변경:**

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| 상태 관리 | `started` (boolean) | `step` ('intro'\|'guide'\|'example1'\|'example2'\|'test') |
| 인트로 | 비풀스크린, 가이드와 동일 페이지 | 풀스크린 독립 섹션 |
| 가이드 | 비풀스크린, 인트로 아래 스크롤 | 풀스크린 독립 섹션 + 스피치 버블 |
| 예시문항 | 없음 | 2개 풀스크린 섹션 + 팝오버 |
| 이어하기 | 기존 답변 있으면 바로 test | 동일 (step='test' 직접 이동) |

**ExampleRadio 컴포넌트 (인라인):**
- DB 저장 없음, 팝오버 표시 전용
- 예시1: value=0(4번 옵션) 기본 선택, 예시2: value=10(3번 옵션) 기본 선택
- CSS-only 팝오버 (Bootstrap 의존성 없이 구현)

### 3-3. `src/styles/assessment.css` — 레거시 디자인 추가

**추가된 CSS:**

| 클래스 | 용도 | 레거시 매칭 |
|--------|------|-------------|
| `.assessment-page @media(min-width:1025px)` | Mesa.svg 배경 | serveyform.css:320-328 |
| `.scroll-btn-legacy`, `.mouse-legacy` | 스크롤 마우스 | serveyform.css:661-719 |
| `@keyframes ani-mouse` | 마우스 내부 점 애니메이션 | serveyform.css:639-658 |
| `.speech-bubble-legacy` | 파란 그라디언트 문구 | serveyform.css:758-776 |
| `.test-text-legacy` | 안내문 회색 배경 | evaluation.jsp:137-148 |
| `.example-content`, `.example-label` | 예시문항 레이아웃 | evaluation.jsp:181-277 |
| `.example-popover`, `.example-popover-left/right` | CSS-only 팝오버 | serveyform.css:809-835 |

### 2-6. iPhone X 디바이스 프레임 (devices.css)

- `device-iphone-x`: `position: fixed`, 뷰포트 중앙 (`left: calc(50% - 214px)`, `top: calc(50% - 370px)`)
- 크기: 428×740px, 베젤 `#222`, `border-radius: 68px`
- 콘텐츠 영역: 375×688px (`border-radius: 40px`, `background: #fff`)
- 장식 요소: 노치(header), 카메라(sensors), 볼륨(btns), 전원(power), 스트라이프(stripe)
- 데스크톱 전용: `@media (max-width:1024px), (max-height:800px)` → `display: none`
- 순수 장식 — `pointer-events: none`, `aria-hidden="true"`

---

## 3. 변경 파일 (3개)

### 3-1. `public/images/Mesa.svg` — 신규 (레거시에서 복사)

- `tomcat/webapps/ROOT/img/Mesa.svg` → `public/images/Mesa.svg`

### 3-2. `src/pages/user/Evaluation.jsx` — 다단계 플로우 + 디바이스 프레임

**프리퀘스천 플로우:**

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| 상태 관리 | `started` (boolean) | `step` ('intro'\|'guide'\|'example1'\|'example2'\|'test') |
| 인트로 | 비풀스크린, 가이드와 동일 페이지 | 풀스크린 독립 섹션 |
| 가이드 | 비풀스크린, 인트로 아래 스크롤 | 풀스크린 독립 섹션 + 스피치 버블 |
| 예시문항 | 없음 | 2개 풀스크린 섹션 + 팝오버 |
| 이어하기 | 기존 답변 있으면 바로 test | 동일 (step='test' 직접 이동) |

**ExampleRadio 컴포넌트 (인라인):**
- DB 저장 없음, 팝오버 표시 전용
- 예시1: value=0(4번 옵션) 기본 선택, 예시2: value=10(3번 옵션) 기본 선택
- CSS-only 팝오버 (Bootstrap 의존성 없이 구현)

**iPhone X 디바이스 프레임:**
- `<div class="device device-iphone-x">` 추가 (assessment-page 내부, 모든 step에 공통 표시)
- `aria-hidden="true"` 접근성 처리

### 3-3. `src/styles/assessment.css` — 레거시 디자인 추가

**프리퀘스천 CSS:**

| 클래스 | 용도 | 레거시 매칭 |
|--------|------|-------------|
| `.assessment-page @media(min-width:1025px)` | Mesa.svg 배경 | serveyform.css:320-328 |
| `.scroll-btn-legacy`, `.mouse-legacy` | 스크롤 마우스 | serveyform.css:661-719 |
| `@keyframes ani-mouse` | 마우스 내부 점 애니메이션 | serveyform.css:639-658 |
| `.speech-bubble-legacy` | 파란 그라디언트 문구 | serveyform.css:758-776 |
| `.test-text-legacy` | 안내문 회색 배경 | evaluation.jsp:137-148 |
| `.example-content`, `.example-label` | 예시문항 레이아웃 | evaluation.jsp:181-277 |
| `.example-popover`, `.example-popover-left/right` | CSS-only 팝오버 | serveyform.css:809-835 |

**디바이스 프레임 CSS:**

| 클래스 | 용도 | 레거시 매칭 |
|--------|------|-------------|
| `.device`, `.device-iphone-x` | 폰 프레임 본체 | devices.css:1-37 |
| `.device-frame` | 베젤 (#222, border-radius: 68px) | devices.css:39-46 |
| `.device-content` | 흰색 스크린 영역 (375×688px) | devices.css:48-52 |
| `.device-stripe`, `.device-header` | 스트라이프 + 노치 | devices.css:54-103 |
| `.device-sensors`, `.device-btns`, `.device-power` | 카메라/버튼 장식 | devices.css:105-165 |

**z-index 레이어링 (데스크톱):**
```
Mesa.svg 배경     — .assessment-page (z-index: auto)
iPhone X 프레임   — .device (z-index: 1050)
콘텐츠 오버레이   — .assessment-fullpage (z-index: 1100, background: transparent)
프로그레스바      — .assessment-progress (z-index: 1200)
```

---

## 4. 검증

- `npm run lint` — 통과
- `npm run type-check` — 통과
- `npm test` — 18 tests 통과
- `npx vite build` — 빌드 성공, index.js 327.84 KB (CSS +2.64 KB 증가)
