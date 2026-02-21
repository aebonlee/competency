# 개발 일지 — 2026-02-21 (세션 4)

**프로젝트**: MyCoreCompetency React 전환
**작업자**: Claude AI (Opus 4.6)
**리포지토리**: https://github.com/aebonlee/competency

---

## 작업 요약

파비콘 교체, 회원가입 후 리다이렉트 경로 수정, 로그인 페이지 풍선도움말 추가를 완료했습니다.

---

## 완료 작업

### 1. 파비콘 변경

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 | `/vite.svg` (Vite 기본 로고) | `/favicon.ico` (competency.or.kr 원본) |
| 수정 파일 | `index.html:5` | `<link rel="icon" href="/favicon.ico">` |
| 추가 파일 | - | `public/favicon.ico` (1,150 bytes) |

**원본 출처**: `D:/competency/tomcat/webapps/ROOT/img/favicon.ico`

### 2. 회원가입 후 리다이렉트 수정

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파일 | `Register.jsx:22` | `Register.jsx` |
| 경로 | `navigate('/')` | `navigate('/main')` |

이미 로그인된 사용자가 회원가입 페이지에 접근 시 메인 페이지(`/main`)로 리다이렉트합니다.

### 3. 로그인 풍선도움말 추가

dreamitbiz.com의 Color Picker Tooltip 패턴을 참고하여 구현했습니다.

**구현 방식:**
- 각 로그인 버튼(Google, Kakao, 이메일)에 `onMouseEnter`/`onMouseLeave` 이벤트
- 호버 시 오른쪽에 풍선도움말 표시 (모바일: 아래쪽)
- CSS 화살표 + 페이드인 애니메이션

**도움말 내용:**
| 버튼 | 메시지 |
|------|--------|
| Google | 구글 계정으로 간편하게 로그인합니다. 별도 회원가입 없이 바로 이용 가능합니다. |
| Kakao | 카카오 계정으로 간편하게 로그인합니다. 별도 회원가입 없이 바로 이용 가능합니다. |
| 이메일 | 이메일과 비밀번호로 로그인합니다. 회원가입 시 등록한 이메일을 사용하세요. |

**수정 파일:**
- `src/pages/auth/Login.jsx` — tooltip 상태 + JSX 구조 변경
- `src/styles/auth.css` — `.auth-tooltip`, `.auth-tooltip-arrow`, 반응형 처리

### 4. React 안티패턴 수정

Login.jsx, Register.jsx에서 render 중 직접 `navigate()` 호출하던 패턴을 `useEffect`로 수정했습니다.

| 파일 | 변경 전 | 변경 후 |
|------|---------|---------|
| Login.jsx | render 본문에서 `navigate(from)` | `useEffect(() => { if (isLoggedIn) navigate(from) })` |
| Register.jsx | render 본문에서 `navigate('/main')` | `useEffect(() => { if (isLoggedIn) navigate('/main') })` |

---

## 커밋 이력

| 해시 | 메시지 | 파일 | 변경 |
|------|--------|------|------|
| `87f9279` | feat: 파비콘 변경, 회원가입 리다이렉트 수정, 로그인 풍선도움말 추가 | 5개 | +136줄, -33줄 |

---

## 빌드 검증

```
vite v7.3.1 building client environment for production...
✓ 152 modules transformed
✓ built in 23.75s

dist/index.html           0.89 kB │ gzip:   0.56 kB
dist/assets/index-*.css  38.10 kB │ gzip:   7.70 kB
dist/assets/index-*.js  582.30 kB │ gzip: 165.34 kB
```

## GitHub Actions 배포

- 커밋 `87f9279` → `origin/main` 푸시 완료
- GitHub Actions 자동 배포 트리거됨
