# 세션 20 개발일지 — 가입 사이트 자동 추적 (check_user_status) 연동

**날짜**: 2026-02-28
**세션**: 20
**작업 유형**: 기능 추가 (멀티사이트 사용자 상태 관리)

---

## 1. 작업 개요

공유 Supabase DB에 이미 설치된 `check_user_status` RPC 함수를 프론트엔드 인증 흐름에 연동.
로그인/세션 복원 시 자동으로 사용자의 방문 도메인을 추적하고, 차단/탈퇴 유저를 강제 로그아웃 처리.

### 주요 성과

| 항목 | 내용 |
|------|------|
| 변경 파일 | `src/contexts/AuthContext.tsx` (1개) |
| 추가 코드 | 23행 (RPC 호출 + 차단 유저 처리 + 에러 핸들링) |
| 기능 | visited_sites 자동 추적, signup_domain 자동 설정, 차단 유저 강제 로그아웃 |

---

## 2. 변경 내용

### AuthContext.tsx — loadProfile() 함수 확장

**삽입 위치**: 프로필 조회/생성 직후, `setProfile(p)` 직전

**추가 로직**:
1. `supabase.rpc('check_user_status')` 호출
   - `target_user_id`: 로그인 사용자 ID
   - `current_domain`: `window.location.hostname` (현재 도메인)
2. RPC 함수가 수행하는 작업 (DB 측):
   - `signup_domain` 미설정 시 현재 도메인으로 자동 설정
   - `visited_sites` 배열에 현재 도메인 추가 (중복 방지)
3. 응답의 `status` 필드 확인:
   - `active` → 정상 진행
   - 그 외 (`blocked`, `withdrawn` 등) → 강제 로그아웃 + 프로필 초기화
4. `catch` 블록: RPC 함수 미존재 시 무시 (구버전 호환)

### 코드 diff

```diff
+    // ─── 가입 사이트 자동 추적 (visited_sites) ───
+    try {
+      const supabase = getSupabase();
+      if (supabase) {
+        const { data: statusData } = await supabase.rpc('check_user_status', {
+          target_user_id: authUser.id,
+          current_domain: window.location.hostname,
+        });
+        if (statusData && statusData.status && statusData.status !== 'active') {
+          console.warn('계정 상태:', statusData.status, statusData.reason);
+          await supabase.auth.signOut();
+          setProfile(null);
+          return;
+        }
+      }
+    } catch (e) {
+      console.warn('check_user_status 호출 실패:', (e as Error).message);
+    }
```

---

## 3. 영향 범위

- **인증 흐름**: 로그인, 세션 복원, OAuth 콜백 모두 `loadProfile()` 경유 → 자동 적용
- **성능**: RPC 1회 추가 호출 (네트워크 1 round-trip), 실패 시 무시하므로 UX 영향 없음
- **호환성**: try-catch로 감싸 RPC 함수 미존재 환경에서도 정상 동작

---

## 4. 전제 조건

- Supabase DB에 `check_user_status` RPC 함수가 설치되어 있어야 정상 동작
- `user_profiles` 테이블에 `signup_domain`, `visited_sites`, `status` 컬럼 존재 필요
- 함수 미설치 시에도 에러 없이 기존 기능 유지 (graceful degradation)
