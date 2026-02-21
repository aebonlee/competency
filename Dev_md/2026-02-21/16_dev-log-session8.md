# 세션 8 개발일지 — OAuth 리다이렉션 근본 수정 + Main 풍선도움말 + DB 스키마 수정

**날짜**: 2026-02-21
**커밋**: `1197a07` (코드), `253e686` (문서), + 추가 커밋 (레이아웃 수정 + DB 스키마)
**배포**: https://competency.dreamitbiz.com

---

## 작업 요약

1. OAuth 로그인 리다이렉션 문제 근본 수정 (Supabase eager 초기화 + VITE_SITE_URL 환경변수)
2. Main 페이지(`/main`) 6개 기능 버튼/링크에 풍선도움말(tooltip) 추가
3. 재검토: 결제카드 그리드 레이아웃 수정 (tooltip-wrapper 높이 균등화)
4. DB 스키마 수정: `user_profiles` 테이블 `name`, `email`, `updated_at` 컬럼 누락 해결

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
const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

// Google/Kakao OAuth, resetPassword 모두 SITE_URL 사용
options: { redirectTo: SITE_URL }
```

### 변경 1-3: `.env` — VITE_SITE_URL 추가

```
VITE_SITE_URL=https://competency.dreamitbiz.com
```

### 사용자 수동 작업 (완료됨)

- Supabase Dashboard → Authentication → URL Configuration → Redirect URLs에 추가:
  - `https://competency.dreamitbiz.com`
  - `https://competency.dreamitbiz.com/**`

---

## 작업 2: Main 페이지 풍선도움말

### 변경 2-1: `src/pages/user/Main.jsx`

Login.jsx 패턴을 그대로 적용:

```js
const TOOLTIPS = {
  continueTest: '이전에 중단된 검사를 이어서 진행합니다.',
  cardPayment: '카드 결제로 새로운 검사를 시작합니다. (25,000원/회)',
  coupon: '발급받은 쿠폰 코드를 입력하여 무료로 검사를 시작합니다.',
  results: '완료된 검사의 결과를 차트와 함께 확인합니다.',
  history: '지금까지 진행한 모든 검사 내역을 확인합니다.',
  average: '다른 사용자들의 평균 결과와 내 결과를 비교합니다.'
};
```

6개 버튼/링크에 `.main-tooltip-wrapper` 적용:
1. **이어서 검사하기** 버튼 (`continueTest`)
2. **카드 결제** 카드 전체 (`cardPayment`)
3. **쿠폰 사용** 카드 전체 (`coupon`)
4. **검사결과 보기** 링크 (`results`)
5. **검사내역** 링크 (`history`)
6. **통계 비교** 링크 (`average`)

### 변경 2-2: `src/styles/checkout.css` — 풍선도움말 CSS

- 위쪽 방향 tooltip (bottom 배치, 아래쪽 화살표)
- auth-tooltip과 동일 시각 스타일 (box-shadow, border, animation)
- 모바일 반응형: `white-space: normal` + min/max-width 제한

---

## 작업 3: 재검토 — 결제카드 그리드 레이아웃 수정

### 문제

`.main-tooltip-wrapper`가 `.main-payment-grid`의 직접 자식이 되면서, 내부 `.card`가 동일 높이로 늘어나지 않는 문제.

### 수정

```css
.main-payment-grid .main-tooltip-wrapper {
  display: flex;
  flex-direction: column;
}
.main-payment-grid .main-tooltip-wrapper > .card {
  flex: 1;
}
```

---

## 작업 4: DB 스키마 — user_profiles 누락 컬럼 추가

### 문제

`Could not find the 'name' column of 'user_profiles' in the schema cache` — 프로필 완성 시 오류 발생.

### 원인

마이그레이션 `20260220230614_competency_schema.sql`이 `ALTER TABLE user_profiles ADD COLUMN`으로 MCC 전용 컬럼만 추가하고, 기본 컬럼(`name`, `email`, `updated_at`)은 기존 테이블에 이미 있다고 가정했으나 실제로는 누락.

### 수정

`supabase/migrations/20260221190000_add_missing_profile_columns.sql` 생성:

```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name       text DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email      text DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
```

### 사용자 수동 작업 필요

Supabase Dashboard → SQL Editor에서 위 SQL 실행 필요.

---

## 변경 파일 요약

| 파일 | 변경 내용 |
|------|-----------|
| `src/utils/supabase.js` | lazy → eager 초기화 + auth 옵션 4개 |
| `src/utils/auth.js` | `window.location.origin` → `VITE_SITE_URL` 상수 |
| `.env` | `VITE_SITE_URL=https://competency.dreamitbiz.com` 추가 |
| `src/pages/user/Main.jsx` | 풍선도움말 6개 (TOOLTIPS + useState + wrapper) |
| `src/styles/checkout.css` | tooltip CSS + 결제카드 grid 높이 균등화 |
| `supabase/migrations/20260221190000_add_missing_profile_columns.sql` | name, email, updated_at 컬럼 추가 |

---

## 빌드 & 배포

- Vite 빌드: 152 modules, 9.45s
- JS 586KB / CSS 39KB (gzip: 166KB / 8KB)
- GitHub Pages 배포: 커밋 & 푸시 후 GitHub Actions 자동 실행
