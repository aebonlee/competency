# MyCoreCompetency 수동 설정 가이드

## 1. GitHub Secrets 등록 (배포 사이트에서 Supabase 연동)

현재 로컬 `.env`에는 Supabase 키가 설정되어 있지만, GitHub Actions로 빌드할 때는 GitHub Secrets에서 환경변수를 가져옵니다.

### 설정 방법

1. **GitHub 리포지토리로 이동**
   - https://github.com/aebonlee/competency

2. **Settings > Secrets and variables > Actions** 클릭

3. **"New repository secret"** 버튼 클릭 후 아래 4개 등록:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://hcmgdztsgjvzcyxyayaj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_vYCKlU2lbPkXpUDj1sILow_DskJCRVS` |
| `VITE_PORTONE_STORE_ID` | (PortOne 스토어 ID - 나중에 설정) |
| `VITE_PORTONE_CHANNEL_KEY` | (PortOne 채널 키 - 나중에 설정) |

4. **재배포 트리거**: Secrets 등록 후 아무 커밋을 push하면 자동으로 새로운 빌드가 실행됩니다.
   또는 GitHub Actions 탭에서 "Re-run all jobs"를 클릭해도 됩니다.

---

## 2. Supabase OAuth Provider 활성화 (Google/Kakao 로그인)

### 2.1 Supabase 대시보드 접속

1. https://supabase.com/dashboard/project/hcmgdztsgjvzcyxyayaj
2. 좌측 메뉴에서 **Authentication** > **Providers** 클릭

### 2.2 Google OAuth 설정

1. **Google** 토글을 **ON**으로 변경
2. Google Cloud Console에서 OAuth 클라이언트 생성:
   - https://console.cloud.google.com/apis/credentials
   - "OAuth 2.0 클라이언트 ID" 만들기
   - **애플리케이션 유형**: 웹 애플리케이션
   - **승인된 리디렉션 URI**: `https://hcmgdztsgjvzcyxyayaj.supabase.co/auth/v1/callback`
   - **승인된 JavaScript 원본**: `https://competency.dreamitbiz.com`
3. 생성된 **Client ID**와 **Client Secret**을 Supabase Provider 설정에 입력
4. **Save** 클릭

### 2.3 Kakao OAuth 설정

1. **Kakao** 토글을 **ON**으로 변경
2. Kakao Developers에서 앱 생성:
   - https://developers.kakao.com/console/app
   - 새 애플리케이션 만들기
   - **플랫폼** > **Web** 추가: `https://competency.dreamitbiz.com`
   - **카카오 로그인** > **활성화 설정**: ON
   - **카카오 로그인** > **Redirect URI**: `https://hcmgdztsgjvzcyxyayaj.supabase.co/auth/v1/callback`
   - **동의항목**: 이메일 (필수) 체크
3. **앱 키** 메뉴에서 **REST API 키**를 복사
4. **보안** 메뉴에서 **Client Secret** 생성 (코드 발급)
5. Supabase Provider 설정에 입력:
   - **Client ID**: REST API 키
   - **Client Secret**: Client Secret 코드
6. **Save** 클릭

### 2.4 이메일 로그인 설정 (기본 활성화됨)

- Supabase Authentication > Providers > **Email** 이 이미 ON 상태인지 확인
- **Confirm email**: 필요에 따라 ON/OFF (ON이면 이메일 인증 필수)
- 개발 중에는 OFF로 하면 즉시 가입 가능

### 2.5 Redirect URL 설정

1. Authentication > **URL Configuration** 클릭
2. **Site URL**: `https://competency.dreamitbiz.com`
3. **Redirect URLs** (추가):
   - `https://competency.dreamitbiz.com/**`
   - `http://localhost:5173/**` (로컬 개발용)

---

## 3. SQL 마이그레이션 실행 (DB 테이블 추가)

### 방법 A: Supabase SQL Editor (권장)

1. https://supabase.com/dashboard/project/hcmgdztsgjvzcyxyayaj
2. 좌측 메뉴에서 **SQL Editor** 클릭
3. **New query** 클릭
4. 아래 파일 내용을 붙여넣기 후 **Run** 클릭:
   - `supabase/migrations/20260221020000_add_board_survey_tables.sql`

### 방법 B: Supabase CLI

```bash
cd D:/competency/react-app
npx supabase db push
```

### 마이그레이션 내용 요약

| 항목 | 내용 |
|------|------|
| `board_posts` 테이블 | 게시판 (title, content, image_url, author_id) |
| `survey_questions` 테이블 | 만족도 조사 질문 (content, target_type, start/end_date) |
| `is_admin()` 함수 업데이트 | email IN ('aebon@kakao.com', 'aebon@kyonggi.ac.kr') 조건 추가 |
| `mcc_users_insert_own` 정책 | OAuth 사용자 첫 로그인 시 프로필 자동 생성용 |
| `mcc_users_update_own` 정책 | 본인 프로필 수정 허용 |

---

## 4. 관리자 계정 설정

### 4.1 자동 관리자 판별 (이미 적용됨)

다음 이메일로 로그인하면 자동으로 관리자 권한이 부여됩니다:
- `aebon@kakao.com`
- `aebon@kyonggi.ac.kr`

이 설정은 두 곳에서 적용됩니다:
- **프론트엔드**: `AuthContext.jsx`의 `ADMIN_EMAILS` 배열
- **백엔드(DB)**: `is_admin()` 함수의 email 체크

### 4.2 수동으로 usertype 변경 (필요 시)

Supabase SQL Editor에서 실행:
```sql
UPDATE user_profiles SET usertype = 2 WHERE email IN ('aebon@kakao.com', 'aebon@kyonggi.ac.kr');
```

---

## 5. 설정 완료 후 확인 사항

| 확인 항목 | 방법 |
|-----------|------|
| 배포 사이트 접속 | https://competency.dreamitbiz.com |
| 이메일 회원가입 | /register 에서 가입 → 이메일 인증 → 로그인 |
| Google 로그인 | /login > Google 로그인 버튼 클릭 |
| Kakao 로그인 | /login > Kakao 로그인 버튼 클릭 |
| 관리자 메뉴 | 관리자 이메일로 로그인 → 네비바에 "관리자" 메뉴 표시 |
| NCS 페이지 | /competency/ncs → SVG 인포그래픽 표시 |
| 교육부 페이지 | /competency/2015 → SVG 인포그래픽 표시 |

---

## 6. 문제 해결

### "Supabase not configured" 에러
- `.env` 파일에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`가 설정되었는지 확인
- 배포 사이트의 경우 GitHub Secrets가 등록되었는지 확인
- GitHub Actions를 재실행하여 새 빌드 배포

### OAuth 로그인 시 에러
- Supabase 대시보드에서 해당 Provider가 활성화되었는지 확인
- Redirect URL이 올바르게 설정되었는지 확인
- Google/Kakao Console에서 승인된 도메인에 `competency.dreamitbiz.com`이 포함되었는지 확인

### 관리자 메뉴가 안 보이는 경우
- 관리자 이메일로 로그인했는지 확인
- DB에서 `SELECT usertype FROM user_profiles WHERE email = 'aebon@kakao.com';` 실행하여 usertype 확인
- 필요 시 `UPDATE user_profiles SET usertype = 2 WHERE email = 'aebon@kakao.com';` 실행
