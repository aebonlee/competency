# 세션 6 개발일지 — OAuth 로그인 리다이렉션 수정

**날짜**: 2026-02-21
**커밋**: `f7bd3b7`
**배포**: https://competency.dreamitbiz.com

---

## 작업 요약

OAuth(Google/Kakao) 로그인 후 리다이렉션이 정상 동작하지 않는 문제를 수정하였다.

---

## 문제 분석

### 원인 1: OAuth redirectTo가 404.html 리다이렉트 체인을 거침

OAuth 로그인 함수(`signInWithGoogle`, `signInWithKakao`)의 `redirectTo`가 `window.location.origin + window.location.pathname`으로 설정되어 있었다. `/login` 페이지에서 호출 시 `https://competency.dreamitbiz.com/login`으로 콜백되는데, GitHub Pages에서 `/login`은 실제 파일이 아니므로:

```
OAuth 콜백 → /login?code=xxx
  → GitHub Pages 404.html 서빙
  → /?/login&code=xxx 로 리다이렉트
  → index.html 스크립트가 /login?code=xxx 로 URL 복원
```

이 과정에서 인증 토큰(`code` 파라미터)이 유실될 수 있었다.

### 원인 2: 홈 페이지에 로그인 사용자 리다이렉트 없음

OAuth 콜백을 루트 URL(`/`)로 변경하더라도, Home 컴포넌트에 로그인 사용자를 `/main`으로 리다이렉트하는 로직이 없어서 OAuth 인증 후 홈 페이지에 머무르는 문제가 있었다.

---

## 변경 내역

### 1. `src/utils/auth.js` — OAuth redirectTo 수정

```js
// Before: 404.html 리다이렉트 체인을 거침
redirectTo: window.location.origin + window.location.pathname  // → /login

// After: index.html이 직접 서빙되므로 토큰 보존
redirectTo: window.location.origin  // → / (루트)
```

루트 URL(`/`)은 `index.html`이 직접 서빙되므로 404.html 리다이렉트 체인을 거치지 않아 인증 토큰이 안전하게 보존된다.

### 2. `src/pages/public/Home.jsx` — 로그인 사용자 자동 리다이렉트

```jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  const { isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isLoggedIn) {
      navigate('/main', { replace: true });
    }
  }, [isLoggedIn, loading, navigate]);
  // ...
};
```

`loading` 상태를 함께 체크하여 Supabase 세션 초기화가 완료된 후에만 리다이렉트한다.

---

## 수정 후 OAuth 로그인 흐름

```
사용자 → /login → Google/Kakao 클릭
  → OAuth 제공자 인증 화면
  → 인증 승인
  → Supabase → https://competency.dreamitbiz.com/?code=xxx
  → index.html 직접 서빙 (404.html 우회)
  → Supabase 클라이언트가 code 파라미터 감지 → 세션 생성
  → AuthContext: isLoggedIn = true
  → Home.jsx useEffect → /main 리다이렉트
```

---

## 변경 파일 요약

| 파일 | 변경 내용 | 줄수 |
|------|-----------|------|
| `src/utils/auth.js` | OAuth redirectTo를 루트 URL로 변경 | +2 -2 |
| `src/pages/public/Home.jsx` | 로그인 사용자 /main 리다이렉트 추가 | +11 -3 |
| **합계** | 2 files changed | +13 -5 |

---

## 빌드 & 배포

- Vite 빌드: 152 modules, 4.86s
- JS 584KB / CSS 38KB (gzip: 165KB / 8KB)
- GitHub Actions 배포: 성공 (Run #22)

---

## 참고: Supabase Dashboard 설정

OAuth 리다이렉션이 정상 작동하려면 Supabase Dashboard에서 다음 설정이 필요하다:

- **Authentication → URL Configuration → Site URL**: `https://competency.dreamitbiz.com`
- **Authentication → URL Configuration → Redirect URLs**: `https://competency.dreamitbiz.com` 등록 확인
