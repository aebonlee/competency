-- ============================================================================
-- MyCoreCompetency — 미실행 마이그레이션 통합본
-- 날짜: 2026-03-01
--
-- 이 파일은 아래 4개 마이그레이션을 순서대로 통합한 것입니다:
--   1. 20260222_phase2_schema.sql      (Phase 2: 그룹 확장)
--   2. 20260222_rls_policy_fixes.sql   (RLS 정책 수정 7건)
--   3. 20260223_add_paid_at.sql        (purchases.paid_at 추가)
--   4. 20260301_schema_fixes.sql       (누락 스키마 보완)
--
-- 실행 방법: Supabase Dashboard > SQL Editor > 전체 붙여넣기 > Run
-- ============================================================================


-- ████████████████████████████████████████████████████████████████████████████
-- PART 1: Phase 2 Schema (20260222_phase2_schema.sql)
-- ████████████████████████████████████████████████████████████████████████████

-- ============================================================
-- 1-1. group_members 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, group_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_members_select" ON public.group_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_members.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "group_members_insert" ON public.group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_members.group_id AND user_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "group_members_delete" ON public.group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_members.group_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- 1-2. group_managers 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_managers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'manager',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, group_id)
);

ALTER TABLE public.group_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_managers_select" ON public.group_managers
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "group_managers_insert" ON public.group_managers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "group_managers_update" ON public.group_managers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "group_managers_delete" ON public.group_managers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- 1-3. group_invitations 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, email)
);

ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_invitations_select" ON public.group_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_invitations.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "group_invitations_insert" ON public.group_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_invitations.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "group_invitations_delete" ON public.group_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_invitations.group_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- 1-4. board_posts.views 컬럼 추가
-- ============================================================
ALTER TABLE public.board_posts
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- ============================================================
-- 1-5. groups 확장 컬럼
-- ============================================================
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS group_type TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 100;

-- ============================================================
-- 1-6. group_subgroups 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_subgroups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE public.group_subgroups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_subgroups_select" ON public.group_subgroups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members WHERE group_id = group_subgroups.group_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_subgroups.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "group_subgroups_insert" ON public.group_subgroups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_subgroups.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "group_subgroups_update" ON public.group_subgroups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_subgroups.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "group_subgroups_delete" ON public.group_subgroups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_subgroups.group_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- 1-7. Phase 2 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_managers_group_id ON public.group_managers(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_subgroups_group_id ON public.group_subgroups(group_id);


-- ████████████████████████████████████████████████████████████████████████████
-- PART 2: RLS 정책 수정 (20260222_rls_policy_fixes.sql)
-- ████████████████████████████████████████████████████████████████████████████

-- ============================================================
-- 2-0. 헬퍼 함수: is_admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND usertype = 2
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 2-1. user_profiles — 그룹 관리자가 멤버 프로필 조회 가능
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
-- 2-2. eval_list — 그룹 관리자가 멤버 검사 조회 가능
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
-- 2-3. results — 모든 인증 사용자 조회 가능 (ResultAvg 통계용)
-- ============================================================
DROP POLICY IF EXISTS "mcc_results_select_own" ON public.results;

CREATE POLICY "results_select" ON public.results
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- ============================================================
-- 2-4. notes — DELETE 정책 추가
-- ============================================================
CREATE POLICY "notes_delete" ON public.notes
  FOR DELETE USING (
    is_admin()
    OR sender_id = auth.uid()
  );

-- ============================================================
-- 2-5. group_invitations — UPDATE 정책 추가
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
-- 2-6. coupons — DELETE 정책 추가
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
-- 2-7. coupons — SELECT 정책 수정
-- ============================================================
DROP POLICY IF EXISTS "mcc_coupons_select" ON public.coupons;

CREATE POLICY "coupons_select" ON public.coupons
  FOR SELECT USING (
    is_used = false
    OR used_by = auth.uid()
    OR created_by = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = coupons.group_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- 2-8. RLS 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_usertype ON public.user_profiles(usertype);
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_eval_list_user_id ON public.eval_list(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_sender_id ON public.notes(sender_id);
CREATE INDEX IF NOT EXISTS idx_notes_receiver_id ON public.notes(receiver_id);
CREATE INDEX IF NOT EXISTS idx_coupons_group_id ON public.coupons(group_id);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons(created_by);


-- ████████████████████████████████████████████████████████████████████████████
-- PART 3: purchases.paid_at 추가 (20260223_add_paid_at.sql)
-- ████████████████████████████████████████████████████████████████████████████

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;


-- ████████████████████████████████████████████████████████████████████████████
-- PART 4: 누락 스키마 보완 (20260301_schema_fixes.sql)
-- ████████████████████████████████████████████████████████████████████████████

-- ============================================================
-- 4-1. group_org 테이블 (조직도)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_org (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id    INTEGER NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  title       TEXT,
  parent_id   UUID REFERENCES public.group_org(id) ON DELETE CASCADE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_org_group_id ON public.group_org(group_id);
CREATE INDEX IF NOT EXISTS idx_group_org_parent_id ON public.group_org(parent_id);

ALTER TABLE public.group_org ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_org_select ON public.group_org
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY group_org_insert ON public.group_org
  FOR INSERT WITH CHECK (is_admin() OR EXISTS (
    SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
  ));
CREATE POLICY group_org_update ON public.group_org
  FOR UPDATE USING (is_admin() OR EXISTS (
    SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
  ));
CREATE POLICY group_org_delete ON public.group_org
  FOR DELETE USING (is_admin() OR EXISTS (
    SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
  ));

-- ============================================================
-- 4-2. user_profiles.signup_domain 컬럼
-- ============================================================
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS signup_domain TEXT;

-- ============================================================
-- 4-3. coupons.assigned_user 컬럼
-- ============================================================
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS assigned_user TEXT;

-- ============================================================
-- 4-4. check_user_status RPC 함수
-- ============================================================
DROP FUNCTION IF EXISTS public.check_user_status(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.check_user_status(
  target_user_id UUID,
  current_domain TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- 사용자 프로필 조회
  SELECT id, usertype, deleted_at
  INTO user_record
  FROM public.user_profiles
  WHERE id = target_user_id;

  -- 사용자 미존재
  IF NOT FOUND THEN
    RETURN json_build_object('status', 'not_found', 'reason', 'User profile not found');
  END IF;

  -- 삭제된 사용자
  IF user_record.deleted_at IS NOT NULL THEN
    RETURN json_build_object('status', 'deleted', 'reason', 'Account has been deleted');
  END IF;

  -- 방문 도메인 추적
  IF current_domain IS NOT NULL THEN
    BEGIN
      UPDATE public.user_profiles
      SET updated_at = now()
      WHERE id = target_user_id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  -- 정상
  RETURN json_build_object('status', 'active', 'reason', NULL);
END;
$$;


-- ████████████████████████████████████████████████████████████████████████████
-- 실행 완료 확인
-- ████████████████████████████████████████████████████████████████████████████
-- 아래 쿼리로 모든 테이블이 생성되었는지 확인:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
