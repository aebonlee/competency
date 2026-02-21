# GitHub ↔ 로컬 동기화 상태 — 2026-02-21

**작업**: 리포지토리와 로컬 폴더 구조/내용 비교 분석
**GitHub**: https://github.com/aebonlee/competency (main)
**로컬**: D:/competency/

---

## 1. 아키텍처 분리 현황

로컬 `D:/competency/`에는 **2개의 완전히 다른 애플리케이션**이 공존합니다:

| 구분 | React SPA (신규) | JSP/Java Bean (레거시) |
|------|-------------------|------------------------|
| 위치 | `react-app/` | `tomcat/` |
| 프레임워크 | React 19 + Vite 7 | Tomcat 8.0.50 + JSP |
| 백엔드 | Supabase (PostgreSQL) | MySQL 직접 연결 |
| 배포 | GitHub Pages | competency.or.kr 서버 |
| 도메인 | competency.dreamitbiz.com | competency.or.kr |
| 상태 | **개발 진행 중** | **레거시 (전환 대상)** |

---

## 2. GitHub에만 있는 파일

| 경로 | 용도 |
|------|------|
| `.github/workflows/deploy.yml` | GitHub Pages 자동 배포 |
| `.gitignore` | Git 추적 제외 목록 |
| `supabase/migrations/20260220230614_competency_schema.sql` | 핵심 DB 스키마 |
| `supabase/migrations/20260221020000_add_board_survey_tables.sql` | 게시판/설문 테이블 |
| `scripts/extract-svg.js` | SVG 추출 유틸리티 |
| `CNAME` | 커스텀 도메인 설정 |
| `.env` | 환경변수 플레이스홀더 (제거 필요) |

---

## 3. 로컬에만 있는 파일

| 경로 | 용도 |
|------|------|
| `tomcat/` 전체 | Tomcat 서버 + JSP/Java 레거시 앱 |
| `react-app/.env` | 실제 Supabase 키 포함 |
| `react-app/node_modules/` | npm 의존성 |
| `react-app/dist/` | 빌드 결과물 |

---

## 4. 동기화 필요 항목

### 4.1 로컬 → GitHub 업데이트 필요
- 현재 로컬 변경사항 없음 (로컬이 구버전)

### 4.2 GitHub → 로컬 업데이트 필요
- `utils/supabase.js` — 243바이트 차이
- `utils/auth.js` — 145바이트 차이
- `utils/portone.js` — 54바이트 차이

### 4.3 권장 조치
```bash
cd D:/competency/react-app
git init
git remote add origin https://github.com/aebonlee/competency.git
git fetch origin
git checkout main
```

---

## 5. GitHub 리포지토리 설정 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| GitHub Pages | 활성화 | competency.dreamitbiz.com |
| GitHub Actions | 정상 | push to main → 자동 배포 |
| GitHub Secrets | 설정됨 | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_PORTONE_STORE_ID, VITE_PORTONE_CHANNEL_KEY |
| Branch Protection | 미설정 | main 브랜치 보호 규칙 없음 |
| `.env` 커밋 | 경고 | 플레이스홀더이나 `.env` 파일이 추적됨 → `.env.example`로 변경 권장 |
