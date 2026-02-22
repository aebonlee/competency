# MyCoreCompetency React App - 개발 문서

## 프로젝트 개요
MyCoreCompetency(www.competency.or.kr) 4차 산업혁명 8대 핵심역량 검사 서비스를
기존 Tomcat + JSP + Java Bean 아키텍처에서 React SPA로 전환하는 프로젝트입니다.

## 기술 스택
| 구분 | 기술 |
|------|------|
| Frontend | React 19 + Vite 7 |
| Backend | Supabase (Auth, DB, Edge Functions) |
| 결제 | PortOne V2 SDK (KG이니시스) |
| 차트 | Chart.js + react-chartjs-2 |
| 라우팅 | React Router v6 |

## 문서 구조
```
Dev_md/
├── README.md                    # 이 파일
├── CLAUDE.md                    # Claude AI 개발 지침
├── 2026-02-22/                  # 날짜별 폴더
│   ├── 개발일지.md              # 마이그레이션 전체 개발일지 (세션12~15)
│   ├── 배포기록.md              # 커밋/푸시/배포 이력 (전체 45개 커밋)
│   ├── 점검보고서.md            # 프로젝트 종합 점검 보고서
│   ├── 종합평가_및_추가계획.md   # 완성도 평가 + Phase별 추가 계획
│   ├── 20_plan-session14-group-enhancement.md  # 세션14 그룹 강화 계획 백업
│   ├── 21_dev-log-session14.md  # 세션14 상세 개발일지
│   ├── 22_plan-session15-deep-analysis.md  # 세션15 심층 분석 계획 백업
│   ├── 23_dev-log-session15.md  # 세션15 심층 분석 & 버그 수정 개발일지
│   ├── 24_plan-session16-phase2-4.md  # 세션16 Phase 2~4 계획 백업
│   └── 25_dev-log-session16.md  # 세션16 코드 스플리팅, ErrorBoundary, SEO 개발일지
└── 2026-02-21/                  # 날짜별 폴더 → 내용별 파일
    ├── 01_plan.md               # 전환 계획서
    ├── 02_dev-log.md            # 개발 일지 (1~13단계)
    ├── 03_evaluation.md         # 구현 평가서
    ├── 03_setup-guide.md        # 배포 설정 가이드
    ├── 04_verification.md       # 검증 보고서
    ├── 05_dev-summary.md        # 개발 요약 (14~16단계)
    ├── 06_code-inspection.md    # 코드 점검 보고서
    ├── 07_sync-status.md        # GitHub↔로컬 동기화 현황
    ├── 08_legacy-security-audit.md  # 레거시 보안 감사
    ├── 09_progress-summary.md   # 전체 진행 내역 요약
    ├── 10_dev-log-session3.md   # 세션3: 종합 점검 및 커밋/배포
    ├── 11_dev-log-session4.md   # 세션4: 파비콘, 리다이렉트, 풍선도움말
    ├── 12_dev-log-session5.md   # 세션5: 공개 역량 페이지 3종 원본 일치 수정
    ├── 13_dev-log-session6.md   # 세션6: OAuth 로그인 리다이렉션 수정
    ├── 14_dev-log-session7.md   # 세션7: NCS 클릭 인터랙션 원본 완전 재현
    ├── 15_plan-session8.md      # 세션8: 구현 계획 (OAuth 수정 + Main 풍선도움말)
    ├── 16_dev-log-session8.md   # 세션8: OAuth 리다이렉션 근본 수정 + Main 풍선도움말
    ├── 17_dev-log-session9.md   # 세션9: 검사 문항 생성 로직 (eval_questions 56쌍)
    ├── 18_dev-log-session10.md  # 세션10: 전체 사이트 점검 + 결과 계산 구현
    └── 19_dev-log-session11.md  # 세션11: 결과 페이지 레거시 디자인 완전 재현
```

## 핵심 기능
1. **8대 핵심역량 검사**: 56쌍 문항 4점 척도 평가
2. **검사 결과 시각화**: PolarArea, Doughnut 차트 (8대 역량, 2015 교육과정, NCS 매핑)
3. **결제 시스템**: PortOne V2 카드결제 (25,000원/회) + 쿠폰
4. **그룹 관리**: 그룹 초대, 조직도, 그룹원 검사 현황
5. **관리자 대시보드**: 회원/문항/쿠폰/게시판/설문/알림 관리

## 사용자 유형
| usertype | 역할 | 접근 경로 |
|----------|------|-----------|
| 0 | 개인회원 | /main |
| 1 | 그룹관리자 | /group |
| 2 | 시스템관리자 | /admin |
| 3 | 서브그룹관리자 | /group |

## 빌드 & 실행
```bash
cd react-app
npm install
npm run dev        # 개발 서버 (http://localhost:5173)
npm run build      # 프로덕션 빌드
```

## 환경변수 (.env)
```
VITE_SUPABASE_URL=<Supabase 프로젝트 URL>
VITE_SUPABASE_ANON_KEY=<Supabase 익명 키>
VITE_PORTONE_STORE_ID=<PortOne 스토어 ID>
VITE_PORTONE_CHANNEL_KEY=<PortOne 채널 키>
VITE_SITE_URL=https://competency.dreamitbiz.com
```
