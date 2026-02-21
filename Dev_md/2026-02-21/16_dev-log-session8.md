# 세션 8 개발일지 — OAuth 리다이렉션 근본 수정 + Main 페이지 풍선도움말

**날짜**: 2026-02-21
**배포**: https://competency.dreamitbiz.com

---

## 작업 요약

1. OAuth 로그인 리다이렉션 문제를 근본적으로 수정 (Supabase 클라이언트 eager 초기화 + VITE_SITE_URL 환경변수)
2. Main 페이지(`/main`)의 6개 기능 버튼/링크에 풍선도움말(tooltip) 추가

---

## 작업 1: OAuth 리다이렉션 근본 수정

### 문제

Google/Kakao OAuth 로그인 후 `competency.dreamitbiz.com`이 아닌 `www.dreamitbiz.com`으로 리다이렉트됨.

### 근본 원인

1. Supabase Dashboard의 Redirect URLs 화이트리스트에 `competency.dreamitbiz.com`이 없음
2. `auth.js`의 `redirectTo`가 `window.location.origin`(동적)을 사용하나, 화이트리스트에 없으면 Site URL로 fallback
3. Supabase 클라이언트가 lazy 초기화되어 OAuth 콜백 시 hash fragment(`#access_token=...`) 감지 지연 가능

### 변경 1-1: `src/utils/supabase.js` — Eager 초기화

```js
// Before (lazy)
let supabase = null;
const getSupabase = () => {
  if (!supabase && supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
};

// After (eager, 모듈 레벨 즉시 생성)
const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,   // OAuth 콜백 #access_token 자동 감지
        persistSession: true,       // 세션 localStorage 유지
        autoRefreshToken: true,     // 토큰 자동 갱신
        flowType: 'implicit'        // hash fragment 방식 (GitHub Pages 호환)
      }
    })
  : null;
const getSupabase = () => supabase;
```

### 변경 1-2: `src/utils/auth.js` — VITE_SITE_URL 기반 redirectTo

```js
// 상단에 상수 추가
const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

// Google/Kakao OAuth, resetPassword 모두 SITE_URL 사용
options: { redirectTo: SITE_URL }
```

### 변경 1-3: `.env` — VITE_SITE_URL 추가

```
VITE_SITE_URL=https://competency.dreamitbiz.com
```

### 사용자 수동 작업 필요: Supabase Dashboard

- **Authentication → URL Configuration → Redirect URLs**에 추가:
  - `https://competency.dreamitbiz.com`
  - `https://competency.dreamitbiz.com/**`

---

## 작업 2: Main 페이지 풍선도움말

### 변경 2-1: `src/pages/user/Main.jsx`

Login.jsx 패턴 (`useState` + `onMouseEnter`/`onMouseLeave` + 조건부 렌더링)을 그대로 적용:

```js
const TOOLTIPS = {
  continueTest: '이전에 중단된 검사를 이어서 진행합니다.',
  cardPayment: '카드 결제로 새로운 검사를 시작합니다. (25,000원/회)',
  coupon: '발급받은 쿠폰 코드를 입력하여 무료로 검사를 시작합니다.',
  results: '완료된 검사의 결과를 차트와 함께 확인합니다.',
  history: '지금까지 진행한 모든 검사 내역을 확인합니다.',
  average: '다른 사용자들의 평균 결과와 내 결과를 비교합니다.'
};
const [tooltip, setTooltip] = useState(null);
```

각 버튼/링크를 `.main-tooltip-wrapper` div로 감싸고 위쪽 방향 tooltip 표시:
1. **이어서 검사하기** 버튼 (`continueTest`)
2. **카드 결제** 카드 전체 (`cardPayment`)
3. **쿠폰 사용** 카드 전체 (`coupon`)
4. **검사결과 보기** 링크 (`results`)
5. **검사내역** 링크 (`history`)
6. **통계 비교** 링크 (`average`)

### 변경 2-2: `src/styles/checkout.css` — 풍선도움말 CSS

```css
.main-tooltip-wrapper { position: relative; display: inline-block; }
.main-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  /* auth-tooltip과 동일 스타일 */
}
.main-tooltip-arrow {
  bottom: -6px;  /* 아래쪽 화살표 */
}
```

- 위쪽 방향 (bottom 배치) — Login.jsx는 오른쪽 방향이었으나, Main 페이지는 위쪽이 자연스러움
- 모바일 반응형: `white-space: normal` + min/max-width 제한

---

## 변경 파일 요약

| 파일 | 변경 내용 |
|------|-----------|
| `src/utils/supabase.js` | lazy → eager 초기화 + auth 옵션 4개 |
| `src/utils/auth.js` | `window.location.origin` → `VITE_SITE_URL` 상수 |
| `.env` | `VITE_SITE_URL=https://competency.dreamitbiz.com` 추가 |
| `src/pages/user/Main.jsx` | 풍선도움말 6개 추가 (TOOLTIPS 객체 + useState + wrapper) |
| `src/styles/checkout.css` | `.main-tooltip-wrapper`, `.main-tooltip`, `.main-tooltip-arrow` CSS |

---

## 빌드 & 배포

- Vite 빌드: (빌드 후 업데이트 예정)
- GitHub Actions 배포: (배포 후 업데이트 예정)
