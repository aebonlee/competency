# 세션 24 개발일지 — 검사 페이지 1문항/1페이지 + 뒤로가기 방지 전환

**날짜**: 2026-03-01
**세션**: 24
**작업 유형**: UX 전면 개편

---

## 1. 작업 개요

레거시 JSP 사이트(competency.or.kr)는 fullPage.js를 사용하여 **1문항/1풀스크린** + **응답 후 자동 전환** + **뒤로가기 차단** 방식으로 검사를 진행함. 현재 React 버전은 56개 문항을 한 페이지에 스크롤로 표시하여 레거시와 UX가 상이했으므로, 레거시와 동일한 방식으로 전환.

---

## 2. 변경 파일 (3개)

### 2-1. `src/pages/user/Evaluation.jsx` — 핵심 로직 변경

**새 state:**
- `currentIndex` (0-based) — 현재 표시 중인 문항 인덱스
- `transitioning` — 전환 애니메이션 중 중복 클릭 방지 플래그

**이어하기(Resume) 지원:**
- 로드 시 기존 답변 스캔 → 첫 미응답 문항 인덱스로 `currentIndex` 설정
- 전부 응답 완료 시 → 제출 페이지(currentIndex === totalCount)로 이동

**화면 흐름:**
```
started=false  → 인트로 + 안내문 (기존 유지)
started=true, currentQuestion 존재  → 1문항 풀스크린 표시
started=true, currentQuestion null  → 제출/완료 페이지
```

**handleAnswer 변경:**
- 라디오 선택 → DB 저장 → 600ms 후 자동 다음 문항 (`currentIndex + 1`)
- `transitioning=true` 동안 추가 입력 차단

**뒤로가기 방지:**
- `useEffect` — `window.history.pushState` + `popstate` 이벤트 리스너
- 브라우저 뒤로가기 시 "검사 중에는 뒤로 갈 수 없습니다" 토스트 표시

**스크롤 잠금:**
- `started` 시 `document.body.style.overflow = 'hidden'`, 언마운트 시 복원

**키보드 단축키:**
- 숫자 1~4로 라디오 선택 가능 (1=매우 그렇다 30점, 4=매우 아니다 0점)

### 2-2. `src/styles/assessment.css` — 풀페이지 레이아웃 + 전환 애니메이션

**추가된 CSS 클래스:**
- `.assessment-fullpage` — position: fixed, 전체 뷰포트, flex 중앙정렬, z-index: 50
- `.question-card-fullpage` — max-width: 600px, slideInUp 애니메이션 적용
- `.assessment-complete` — 제출 페이지 스타일
- `@keyframes slideInUp` — 0.5s 슬라이드업 애니메이션 (opacity + translateY)
- `.assessment-options-disabled` — opacity: 0.6, pointer-events: none

**수정:**
- `.assessment-progress` z-index: 100 → 200 (풀페이지 위에 표시)

### 2-3. `src/components/AssessmentRadio.jsx` — disabled prop 추가

- `disabled` prop (기본값 `false`) 추가
- disabled 시 `assessment-options-disabled` 클래스 적용 + input disabled 속성
- 전환 중 라디오 비활성화 → 중복 선택 방지

---

## 3. 기존 코드 대비 변경점

| 항목 | 이전 | 이후 |
|------|------|------|
| 문항 표시 | 56개 한 페이지 스크롤 | 1문항/1풀스크린 |
| 다음 문항 이동 | 수동 스크롤 | 응답 후 600ms 자동 전환 |
| 뒤로가기 | 허용 | popstate 차단 + 토스트 경고 |
| 스크롤 | 허용 | body overflow: hidden |
| 키보드 | 미지원 | 1~4 숫자키 선택 |
| 이어하기 | 전체 표시 (기답변 체크) | 첫 미응답 문항으로 자동 이동 |
| ProgressBar | answeredCount 기준 | currentIndex + 1 기준 |
| 제출 | 하단 버튼 (allAnswered 시 활성) | 별도 완료 페이지 |

---

## 4. 검증

- `npx vite build` — 빌드 성공 확인
- 번들 크기 변화 없음 (index.js 323.85 KB)
