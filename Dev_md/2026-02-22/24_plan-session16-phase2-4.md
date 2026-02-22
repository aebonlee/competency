# 세션 16 계획 백업 — Phase 2~4 실행

**날짜**: 2026-02-22
**세션**: 16
**작업 유형**: 추가 계획 Phase 2~4 실행

---

## Context
세션 15까지 Phase 1(긴급 수정)이 완료됨. 추가 계획 Phase 2~4의 미구현 항목을 순차적으로 개발.
현재 빌드: 152 modules, 622.87 KB JS (단일 번들), 45.20 KB CSS.

## 현재 상태 (Phase 1 점검 결과)
- Phase 1 (1-1 ~ 1-6): **모두 완료**
- 잔여: EvalManager.jsx `getElapsedTime()` stub 함수 + BoardView.jsx 조회수 미증가

---

## 수정/생성 파일 (8개)

| # | 파일 | 작업 | 설명 |
|---|------|------|------|
| 1 | `src/pages/admin/EvalManager.jsx` | 수정 | getElapsedTime() 구현 (created_at ↔ end_date 차이 계산) |
| 2 | `src/pages/admin/BoardView.jsx` | 수정 | 게시글 조회 시 views 카운트 +1 증가 |
| 3 | `src/components/ErrorBoundary.jsx` | **신규** | 전역 에러 바운더리 컴포넌트 |
| 4 | `src/App.jsx` | 수정 | React.lazy + Suspense 코드 스플리팅 + 404 + ErrorBoundary |
| 5 | `src/main.jsx` | 수정 | ErrorBoundary 래핑 |
| 6 | `index.html` | 수정 | SEO 메타 태그 + OG 태그 추가 |
| 7 | `public/sitemap.xml` | **신규** | 검색엔진용 사이트맵 |
| 8 | `supabase/migrations/20260222_phase2_schema.sql` | **신규** | Phase 2 DB 스키마 (참고용, Supabase에서 별도 실행) |

---

## 1. EvalManager.jsx — 소요시간 계산 구현

**현재**: `getElapsedTime()` 항상 '-' 반환
**변경**: `created_at` ~ `end_date` 시간 차이를 계산

```jsx
const getElapsedTime = (ev) => {
  if (!ev.created_at || !ev.end_date) return '-';
  const start = new Date(ev.created_at);
  const end = new Date(ev.end_date);
  const diffSec = Math.floor((end - start) / 1000);
  if (diffSec < 0) return '-';
  return formatElapsedTime(diffSec);
};
```

기존 `formatElapsedTime()` 함수 재활용.

---

## 2. BoardView.jsx — 조회수 증가

게시글 조회 성공 후 views +1 (fire-and-forget):

```jsx
supabase
  .from('board_posts')
  .update({ views: (data.views || 0) + 1 })
  .eq('id', id);
```

---

## 3. ErrorBoundary.jsx — 신규 컴포넌트

React class component 기반:
- `componentDidCatch`로 에러 캡처
- 한국어 에러 화면 + "홈으로 돌아가기" 버튼
- `base.css` 기존 스타일 재활용

---

## 4. App.jsx — 코드 스플리팅 + 404 페이지

### 4.1 React.lazy 코드 스플리팅
- Public + Auth + User: 직접 import 유지 (초기 로드 필요)
- Group 12개 + Admin 19개: React.lazy 동적 import
- `<Suspense fallback={<LoadingFallback />}>` 래핑

### 4.2 404 캐치올 라우트
- `<Route path="*" element={<NotFound />} />`
- NotFound: App.jsx 내 인라인 컴포넌트

---

## 5. main.jsx — ErrorBoundary 래핑

```jsx
<ErrorBoundary>
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
</ErrorBoundary>
```

---

## 6. index.html — SEO 메타 태그

- description, keywords, og:title, og:description, og:type, og:url, og:image, robots

---

## 7. sitemap.xml — 공개 라우트

6개 URL: `/`, `/competency`, `/competency/2015`, `/competency/ncs`, `/login`, `/register`

---

## 8. Phase 2 DB 마이그레이션 SQL

- `group_members` 테이블 + RLS
- `group_managers` 테이블 + RLS
- `group_invitations` 테이블 + RLS
- `board_posts.views` DEFAULT 0
- `groups` 확장 컬럼 (group_type, contact_*, logo_url, max_members)
- `group_subgroups` 테이블 + RLS
- 인덱스 5개

---

*작성: Claude Code — 세션 16 계획 백업*
