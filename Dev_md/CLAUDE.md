# Claude AI 개발 지침 (CLAUDE.md)

## 프로젝트 컨텍스트
- **프로젝트명**: MyCoreCompetency React 전환
- **작업 디렉토리**: D:/competency/react-app/
- **자매 프로젝트**: D:/www/react-source/src/ (dreamitbiz.com - 코드 재사용 원본)
- **기존 시스템**: D:/competency/tomcat/webapps/ROOT/ (JSP + Java Bean)

## 아키텍처 원칙
1. **Supabase 기반**: 모든 백엔드 로직은 Supabase (Auth, DB, Edge Functions) 사용
2. **재사용 우선**: D:/www 프로젝트의 utils/contexts/components를 최대한 재사용
3. **기존 디자인 유지**: competency.or.kr의 시각적 디자인 유지 (색상, 레이아웃)
4. **한국어 중심**: 모든 UI 텍스트는 한국어

## 주요 색상 코드
```
--primary-blue: #106bb5    (주조색)
--accent-red: #DC343B      (포인트)
--c1: #ED1B23  비판적/분석적 사고
--c2: #F15A28  창의력
--c3: #D7DF22  복합적 의사소통
--c4: #EC008C  협업능력
--c5: #662C91  디지털 리터러시
--c6: #59c7c4  감성지능
--c7: #38B549  복합문제 해결능력
--c8: #00AEEF  마음의 습관
```

## DB 스키마 (Supabase)
핵심 테이블: user_profiles, eval_list, eval_questions, questions, results, groups, coupons, purchases, surveys, boards, notes
- 마이그레이션: `supabase/migrations/001_initial_schema.sql`
- RLS: 모든 테이블에 Row Level Security 적용

## 파일 구조 규칙
- `src/pages/` - 페이지 컴포넌트 (public, auth, user, group, admin 하위)
- `src/components/` - 재사용 컴포넌트
- `src/contexts/` - React Context (AuthContext, ToastContext)
- `src/utils/` - 유틸리티 (supabase.js, auth.js, portone.js)
- `src/data/` - 정적 데이터 (competencyInfo.js)
- `src/styles/` - CSS 파일 (base, navbar, auth, assessment, result, checkout, group, admin, modal)

## 검사 시스템
- 56쌍 문항, 4점 척도 (30, 20, 10, 0)
- 8대 역량별 점수 산출 → results 테이블 point1~point8
- Edge Function `calculate_results`로 서버사이드 계산

## 결제 시스템
- PortOne V2 SDK (KG이니시스 경유)
- 단일 상품: 핵심역량 검사 25,000원
- 쿠폰 시스템: 유효 쿠폰 입력 시 무료 검사

## 인증 체계
- Supabase Auth: Email, Google, Kakao OAuth
- user_profiles.usertype으로 역할 분기 (0=개인, 1=그룹, 2=관리자, 3=서브그룹)
- AuthGuard: 로그인 필수 라우트 보호
- GroupGuard: 그룹 관리자 라우트 보호 (usertype 1, 3)
- AdminGuard: 시스템 관리자 라우트 보호 (usertype 2)

## 주의사항
- `.env` 파일은 커밋하지 않음
- Supabase 환경변수 설정 후 사용
- 기존 MySQL 데이터 마이그레이션 시 비밀번호 재설정 필요 (SHA256 → bcrypt)
- 개발 모드에서는 localStorage 폴백으로 동작
