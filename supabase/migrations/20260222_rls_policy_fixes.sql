-- Phase 3-3: RLS 정책 전면 점검 — 9건 갭 수정
-- Supabase Dashboard에서 별도 실행 필요
-- 기존 정책과 충돌 시 DROP 후 재생성

-- ============================================================
-- 헬퍼 함수: is_admin (이미 존재하면 SKIP)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND usertype = 2
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 1. user_profiles — 그룹 관리자가 멤버 프로필 조회 가능
-- 기존: id = auth.uid() OR is_admin()
-- 수정: + 그룹 소유자/매니저가 자기 그룹 멤버 프로필 조회
-- ============================================================
DROP POLICY IF EXISTS "mcc_users_select_own" ON public.user_profiles;

CREATE POLICY "user_profiles_select" ON public.user_profiles
  FOR SELECT USING (
    id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      JOIN public.groups g ON g.id = gm.group_id
      WHERE gm.user_id = user_profiles.id
        AND (
          g.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.group_managers mgr
            WHERE mgr.group_id = g.id AND mgr.user_id = auth.uid()
          )
        )
    )
  );

-- ============================================================
-- 2. eval_list — 그룹 관리자가 멤버 검사 조회 가능
-- 기존: user_id = auth.uid() OR is_admin()
-- 수정: + 그룹 소유자/매니저가 자기 그룹 멤버 검사 조회
-- ============================================================
DROP POLICY IF EXISTS "mcc_eval_select_own" ON public.eval_list;

CREATE POLICY "eval_list_select" ON public.eval_list
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      JOIN public.groups g ON g.id = gm.group_id
      WHERE gm.user_id = eval_list.user_id
        AND (
          g.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.group_managers mgr
            WHERE mgr.group_id = g.id AND mgr.user_id = auth.uid()
          )
        )
    )
  );

-- ============================================================
-- 3. results — 모든 인증 사용자 조회 가능 (ResultAvg 통계용)
-- 기존: eval_id → eval_list.user_id = auth.uid() OR is_admin()
-- 수정: 인증 사용자 전체 (집계 통계 목적)
-- ============================================================
DROP POLICY IF EXISTS "mcc_results_select_own" ON public.results;

CREATE POLICY "results_select" ON public.results
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- ============================================================
-- 4. notes — DELETE 정책 추가 (누락)
-- ============================================================
CREATE POLICY "notes_delete" ON public.notes
  FOR DELETE USING (
    is_admin()
    OR sender_id = auth.uid()
  );

-- ============================================================
-- 5. group_invitations — UPDATE 정책 추가 (누락)
-- 초대 취소 (status = 'cancelled') 등
-- ============================================================
CREATE POLICY "group_invitations_update" ON public.group_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_invitations.group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers
      WHERE group_id = group_invitations.group_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. coupons — DELETE 정책 추가 (누락)
-- 그룹 삭제 시 관련 쿠폰 삭제용
-- ============================================================
CREATE POLICY "coupons_delete" ON public.coupons
  FOR DELETE USING (
    is_admin()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = coupons.group_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- 7. coupons — SELECT 정책 수정 (익명 사용자 쿠폰 코드 확인)
-- InviteRegister에서 인증 없이 쿠폰 코드 유효성 확인 필요
-- ============================================================
DROP POLICY IF EXISTS "mcc_coupons_select" ON public.coupons;

CREATE POLICY "coupons_select" ON public.coupons
  FOR SELECT USING (
    -- 미사용 쿠폰은 누구나 코드 확인 가능 (InviteRegister용)
    is_used = false
    -- 자기가 사용한 쿠폰
    OR used_by = auth.uid()
    -- 자기가 생성한 쿠폰
    OR created_by = auth.uid()
    -- 관리자
    OR is_admin()
    -- 그룹 소유자 (그룹 쿠폰 관리)
    OR EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = coupons.group_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- 인덱스 (RLS 쿼리 성능 최적화)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_usertype ON public.user_profiles(usertype);
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_eval_list_user_id ON public.eval_list(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_sender_id ON public.notes(sender_id);
CREATE INDEX IF NOT EXISTS idx_notes_receiver_id ON public.notes(receiver_id);
CREATE INDEX IF NOT EXISTS idx_coupons_group_id ON public.coupons(group_id);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons(created_by);
