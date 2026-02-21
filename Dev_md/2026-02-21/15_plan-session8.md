# 구현 계획: OAuth 리다이렉션 수정 + Main 페이지 풍선도움말

**세션**: 8
**날짜**: 2026-02-21

---

## Context

OAuth 로그인(Google/Kakao) 후 `competency.dreamitbiz.com`이 아닌 `www.dreamitbiz.com`으로 리다이렉트되는 문제가 있다.

**근본 원인**: Supabase Dashboard의 Redirect URLs 화이트리스트에 `competency.dreamitbiz.com`이 없어서, Supabase가 `redirectTo` URL을 거부하고 Site URL(`www.dreamitbiz.com`)로 fallback하는 것.

**코드 원인**: `auth.js`의 `redirectTo`가 `window.location.origin`(동적)을 사용하지만, 이 URL이 Supabase 화이트리스트에 없으면 무시됨. 또한 Supabase 클라이언트가 lazy 초기화되어 OAuth 콜백 시 hash fragment 감지가 지연될 수 있음.

---

## 작업 1: OAuth 리다이렉션 수정

### 1-1. `src/utils/supabase.js` — Eager 초기화 + auth 옵션 명시

- `detectSessionInUrl: true` — OAuth 콜백 시 URL의 `#access_token=...` 자동 감지
- `flowType: 'implicit'` — hash fragment 방식 (GitHub Pages에 적합)
- 모듈 레벨 실행으로 import 시점에 즉시 클라이언트 생성 → 콜백 파라미터 놓치지 않음

### 1-2. `src/utils/auth.js` — redirectTo를 환경변수 기반으로 변경

- `VITE_SITE_URL` 환경변수 또는 `window.location.origin` 폴백
- `.env`에 `VITE_SITE_URL=https://competency.dreamitbiz.com` 추가

### 1-3. `.env` — VITE_SITE_URL 추가

### 1-4. Supabase Dashboard 설정 (수동, 사용자에게 안내)

- **Authentication → URL Configuration → Redirect URLs**에 다음 추가:
  - `https://competency.dreamitbiz.com`
  - `https://competency.dreamitbiz.com/**` (와일드카드)

---

## 작업 2: Main 페이지 풍선도움말 (6개 기능 전체)

### 2-1. `src/pages/user/Main.jsx` — 풍선도움말 추가

Login.jsx 패턴을 따름 (`useState` + `onMouseEnter`/`onMouseLeave` + 조건부 렌더링):

6개 툴팁: 이어서 검사하기, 카드 결제, 쿠폰 사용, 검사결과 보기, 검사내역, 통계 비교

### 2-2. `src/styles/checkout.css` — 풍선도움말 CSS (위쪽 방향)

`.main-tooltip-wrapper`, `.main-tooltip`, `.main-tooltip-arrow` 클래스 추가

---

## 변경 파일 요약

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/utils/supabase.js` | 수정: eager 초기화 + auth 옵션 |
| 2 | `src/utils/auth.js` | 수정: VITE_SITE_URL 기반 redirectTo |
| 3 | `.env` | 수정: VITE_SITE_URL 추가 |
| 4 | `src/pages/user/Main.jsx` | 수정: 풍선도움말 6개 추가 |
| 5 | `src/styles/checkout.css` | 수정: 풍선도움말 CSS 추가 |
