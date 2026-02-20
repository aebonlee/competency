# MyCoreCompetency (competency.or.kr)

4차 산업혁명 8대 핵심역량 검사 서비스 - React SPA

## 기술 스택
- **Frontend**: React 18 + Vite
- **Backend**: Supabase (Auth, DB, Edge Functions)
- **결제**: PortOne V2 SDK (KG이니시스)
- **차트**: Chart.js + react-chartjs-2

## 실행 방법
```bash
npm install
npm run dev
```

## 환경변수 (.env)
```
VITE_SUPABASE_URL=<Supabase URL>
VITE_SUPABASE_ANON_KEY=<Supabase Anon Key>
VITE_PORTONE_STORE_ID=<PortOne Store ID>
VITE_PORTONE_CHANNEL_KEY=<PortOne Channel Key>
```

## 문서
개발 문서는 [Dev_md/](./Dev_md/) 폴더를 참고하세요.
