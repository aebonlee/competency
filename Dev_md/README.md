# MyCoreCompetency React App - 개발 문서

## 프로젝트 개요
MyCoreCompetency(www.competency.or.kr) 4차 산업혁명 8대 핵심역량 검사 서비스를
기존 Tomcat + JSP + Java Bean 아키텍처에서 React SPA로 전환하는 프로젝트입니다.

## 기술 스택
| 구분 | 기술 |
|------|------|
| Frontend | React 18 + Vite |
| Backend | Supabase (Auth, DB, Edge Functions) |
| 결제 | PortOne V2 SDK (KG이니시스) |
| 차트 | Chart.js + react-chartjs-2 |
| 라우팅 | React Router v6 |

## 문서 구조
```
Dev_md/
├── README.md                    # 이 파일
├── CLAUDE.md                    # Claude AI 개발 지침
└── 2026-02-21/
    ├── 01_plan.md               # 전환 계획서
    ├── 02_dev-log.md            # 개발 일지
    ├── 03_evaluation.md         # 구현 평가서
    └── 04_verification.md       # 검증 보고서
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
```
