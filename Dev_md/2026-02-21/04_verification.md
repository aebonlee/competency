# 검증 보고서 - 2026-02-21

**프로젝트**: MyCoreCompetency React 전환
**검증 유형**: 빌드 + DB 마이그레이션 + 배포 검증

---

## 1. 빌드 검증

### 1.1 빌드 결과
```bash
cd D:/competency/react-app && npx vite build
```
| 항목 | 결과 |
|------|------|
| 상태 | **성공** |
| Vite 버전 | 7.3.1 |
| 총 모듈 | 138개 |
| 빌드 시간 | 14.31초 |
| JS 번들 | 523.97 KB (gzip: 155.27 KB) |
| CSS 번들 | 25.56 KB (gzip: 5.36 KB) |
| HTML | 0.46 KB (gzip: 0.29 KB) |

### 1.2 경고
- 청크 > 500KB (Chart.js 포함) → 코드 스플리팅 권장

---

## 2. 파일 구조 검증

### 2.1 총 파일: 63개
| 디렉토리 | 수량 | 상태 |
|----------|------|------|
| src/pages/public/ | 4 | 완료 |
| src/pages/auth/ | 4 | 완료 |
| src/pages/user/ | 10 | 완료 |
| src/pages/group/ | 9 | 완료 |
| src/pages/admin/ | 10 | 완료 |
| src/components/ | 8 | 완료 |
| src/components/layout/ | 2 | 완료 |
| src/contexts/ | 2 | 완료 |
| src/utils/ | 3 | 완료 |
| src/data/ | 1 | 완료 |
| src/styles/ | 9 | 완료 |
| supabase/migrations/ | 1 | 완료 |

### 2.2 라우팅: 34개 라우트
| 유형 | 수량 | Guard |
|------|------|-------|
| Public | 4 | 없음 |
| Auth | 4 | 없음 |
| User | 10 | AuthGuard |
| Group | 9 | GroupGuard |
| Admin | 10 | AdminGuard |

---

## 3. Supabase DB 마이그레이션 검증

### 3.1 마이그레이션 적용
```
마이그레이션: 20260220230614_competency_schema.sql
상태: Finished supabase db push.
프로젝트: hcmgdztsgjvzcyxyayaj (South Asia - Mumbai)
```

### 3.2 테이블 검증 (실제 Supabase 확인)
| 테이블 | 크기 | Row 수 | 상태 |
|--------|------|--------|------|
| user_profiles (수정) | 64 KB | 4 | +11 컬럼 추가됨 |
| eval_list (신규) | 16 KB | 0 | 생성됨 |
| eval_questions (신규) | 32 KB | 0 | 생성됨 |
| questions (신규) | 16 KB | 0 | 생성됨 |
| results (신규) | 16 KB | 0 | 생성됨 |
| groups (신규) | 24 KB | 0 | 생성됨 |
| coupons (신규) | 40 KB | 0 | 생성됨 |
| purchases (신규) | 48 KB | 0 | 생성됨 |
| surveys (신규) | 24 KB | 0 | 생성됨 |
| notes (신규) | 40 KB | 0 | 생성됨 |

### 3.3 기존 dreamitbiz 테이블 (영향 없음)
| 테이블 | 상태 |
|--------|------|
| products | 정상 (22 rows) |
| orders | 정상 |
| order_items | 정상 |
| board_posts | 정상 (5 rows) |
| blog_posts | 정상 (6 rows) |
| gallery_items | 정상 (8 rows) |
| syllabi | 정상 (1 row) |
| hohai_* | 정상 |

### 3.4 RLS 정책
- 모든 신규 테이블에 RLS 활성화 확인
- `is_admin()` 함수 생성 확인
- user_profiles에 MCC 전용 정책 추가 (기존 정책과 충돌 없음)

### 3.5 인덱스: 17개
- user_profiles: usertype, grp
- eval_list: user_id
- eval_questions: eval_id, stdq_id, cmpq_id
- groups: owner_id
- coupons: created_by, used_by
- purchases: user_id, eval_id, payment_id, status
- surveys: eval_id
- notes: sender_id, receiver_id, (receiver_id, is_read) 복합

---

## 4. GitHub 리포지토리 검증

### 4.1 커밋 이력
```
5b45685 db: Supabase 마이그레이션 적용 (공유 DB 호환)
38cab26 ci: GitHub Pages 자동 배포 설정
aed8b29 Merge branch 'main'
6c8800b merge: resolve README.md conflict with remote
47e0b0f Create CNAME
3889a7a feat: MyCoreCompetency React SPA 초기 구현
c2fea6a Initial commit
```

### 4.2 GitHub Pages 배포
| 항목 | 상태 |
|------|------|
| 워크플로우 | `.github/workflows/deploy.yml` 생성됨 |
| 404.html | SPA 리다이렉트 설정됨 |
| CNAME | `competency.dreamitbiz.com` |
| 배포 트리거 | main 브랜치 push 시 자동 |
| **수동 설정 필요** | Settings > Pages > Source → "GitHub Actions" |

### 4.3 .gitignore 검증
- `.env`, `.env.local`, `.env.production` — 제외됨
- `node_modules/`, `dist/` — 제외됨
- `supabase/.temp/` — 제외됨

---

## 5. 보안 검증

### 5.1 인증
- Supabase Auth: Email, Google, Kakao OAuth
- JWT 토큰 기반 세션
- bcrypt 비밀번호 해싱

### 5.2 권한 분리
| Guard | 조건 | 보호 라우트 |
|-------|------|-----------|
| AuthGuard | 로그인 여부 | User 10개 |
| GroupGuard | usertype 1,3 또는 관리자 | Group 9개 |
| AdminGuard | usertype 2 또는 admin 이메일 | Admin 10개 |

### 5.3 RLS
- 전체 테이블 RLS 활성화
- 사용자별 데이터 격리
- 관리자 전체 접근 (is_admin())

### 5.4 민감 정보
- `.env` — git 추적 안 함
- Supabase 토큰 — 코드에 포함 안 함
- ANON KEY만 클라이언트 노출 (RLS로 보호)

---

## 6. 미완료 사항

### 필수 (배포 전)
- [ ] GitHub Pages Source 설정 변경
- [ ] `.env` Supabase URL/anon key 입력
- [ ] PortOne V2 스토어/채널 키 설정
- [ ] E2E 테스트 (가입→결제→검사→결과)

### 권장 (배포 후)
- [ ] 코드 스플리팅 (번들 최적화)
- [ ] Edge Function: calculate_results
- [ ] 이미지 자산 이전
- [ ] 에러 바운더리
- [ ] MySQL 데이터 마이그레이션
