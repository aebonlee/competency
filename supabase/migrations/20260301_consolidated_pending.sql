-- ============================================================================
-- MyCoreCompetency — 미실행 마이그레이션 통합 최종본
-- 날짜: 2026-03-01 (v3 — 순서 수정 + 멱등성 보장)
--
-- 통합 원본:
--   1. 20260222_phase2_schema.sql      (Phase 2: 그룹 확장)
--   2. 20260222_rls_policy_fixes.sql   (RLS 정책 수정)
--   3. 20260223_add_paid_at.sql        (purchases.paid_at 추가)
--   4. 20260301_schema_fixes.sql       (누락 스키마 보완)
--
-- 주의: 모든 CREATE POLICY 앞에 DROP IF EXISTS를 배치하여
--       이미 실행된 환경에서도 재실행 가능 (멱등성)
--
-- 실행: Supabase Dashboard > SQL Editor > 전체 붙여넣기 > Run
-- ============================================================================


-- ████████████████████████████████████████████████████████████████████████████
-- STEP 1: 테이블 생성 (정책 없이 구조만 — forward reference 방지)
-- ████████████████████████████████████████████████████████████████████████████

-- 1-1. group_members
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- 1-2. group_managers
CREATE TABLE IF NOT EXISTS public.group_managers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'manager',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- 1-3. group_invitations
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, email)
);

-- 1-4. group_subgroups
CREATE TABLE IF NOT EXISTS public.group_subgroups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 1-5. group_org (조직도)
CREATE TABLE IF NOT EXISTS public.group_org (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id    INTEGER NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  title       TEXT,
  parent_id   UUID REFERENCES public.group_org(id) ON DELETE CASCADE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);


-- ████████████████████████████████████████████████████████████████████████████
-- STEP 2: 기존 테이블 컬럼 추가 (ALTER TABLE)
-- ████████████████████████████████████████████████████████████████████████████

-- 2-1. board_posts.views
ALTER TABLE public.board_posts
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 2-2. groups 확장 컬럼
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS group_type TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;
-- max_members는 초기 스키마에 이미 존재

-- 2-3. purchases.paid_at
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 2-4. user_profiles.signup_domain
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS signup_domain TEXT;

-- 2-5. coupons.assigned_user
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS assigned_user TEXT;


-- ████████████████████████████████████████████████████████████████████████████
-- STEP 3: RLS 활성화
-- ████████████████████████████████████████████████████████████████████████████

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_org ENABLE ROW LEVEL SECURITY;


-- ████████████████████████████████████████████████████████████████████████████
-- STEP 4: 헬퍼 함수
-- ████████████████████████████████████████████████████████████████████████████

-- is_admin() — 이메일 하드코딩 제거, usertype만 사용
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND usertype = 2
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ████████████████████████████████████████████████████████████████████████████
-- STEP 5: RLS 정책 — 신규 테이블
-- ████████████████████████████████████████████████████████████████████████████

-- ── group_members ──
DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
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

DROP POLICY IF EXISTS "group_members_insert" ON public.group_members;
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

DROP POLICY IF EXISTS "group_members_delete" ON public.group_members;
CREATE POLICY "group_members_delete" ON public.group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_members.group_id AND user_id = auth.uid()
    )
  );

-- ── group_managers ──
DROP POLICY IF EXISTS "group_managers_select" ON public.group_managers;
CREATE POLICY "group_managers_select" ON public.group_managers
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "group_managers_insert" ON public.group_managers;
CREATE POLICY "group_managers_insert" ON public.group_managers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "group_managers_update" ON public.group_managers;
CREATE POLICY "group_managers_update" ON public.group_managers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "group_managers_delete" ON public.group_managers;
CREATE POLICY "group_managers_delete" ON public.group_managers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
  );

-- ── group_invitations ──
DROP POLICY IF EXISTS "group_invitations_select" ON public.group_invitations;
CREATE POLICY "group_invitations_select" ON public.group_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_invitations.group_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "group_invitations_insert" ON public.group_invitations;
CREATE POLICY "group_invitations_insert" ON public.group_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_invitations.group_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "group_invitations_update" ON public.group_invitations;
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

DROP POLICY IF EXISTS "group_invitations_delete" ON public.group_invitations;
CREATE POLICY "group_invitations_delete" ON public.group_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_invitations.group_id AND user_id = auth.uid()
    )
  );

-- ── group_subgroups ──
DROP POLICY IF EXISTS "group_subgroups_select" ON public.group_subgroups;
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

DROP POLICY IF EXISTS "group_subgroups_insert" ON public.group_subgroups;
CREATE POLICY "group_subgroups_insert" ON public.group_subgroups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_subgroups.group_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "group_subgroups_update" ON public.group_subgroups;
CREATE POLICY "group_subgroups_update" ON public.group_subgroups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_subgroups.group_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "group_subgroups_delete" ON public.group_subgroups;
CREATE POLICY "group_subgroups_delete" ON public.group_subgroups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_managers WHERE group_id = group_subgroups.group_id AND user_id = auth.uid()
    )
  );

-- ── group_org ──
DROP POLICY IF EXISTS "group_org_select" ON public.group_org;
CREATE POLICY "group_org_select" ON public.group_org
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "group_org_insert" ON public.group_org;
CREATE POLICY "group_org_insert" ON public.group_org
  FOR INSERT WITH CHECK (is_admin() OR EXISTS (
    SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "group_org_update" ON public.group_org;
CREATE POLICY "group_org_update" ON public.group_org
  FOR UPDATE USING (is_admin() OR EXISTS (
    SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "group_org_delete" ON public.group_org;
CREATE POLICY "group_org_delete" ON public.group_org
  FOR DELETE USING (is_admin() OR EXISTS (
    SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
  ));


-- ████████████████████████████████████████████████████████████████████████████
-- STEP 6: RLS 정책 — 기존 테이블 정책 교체
--         (기존 정책명을 정확히 DROP 후 재생성)
-- ████████████████████████████████████████████████████████████████████████████

-- ── user_profiles SELECT — 그룹 관리자가 멤버 프로필 조회 가능하도록 확장 ──
DROP POLICY IF EXISTS "mcc_users_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;
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

-- ── eval_list SELECT — 그룹 관리자가 멤버 검사 조회 가능하도록 확장 ──
DROP POLICY IF EXISTS "eval_list_select" ON public.eval_list;
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

-- ── results SELECT — 모든 인증 사용자 조회 가능 (ResultAvg 전체 통계용) ──
DROP POLICY IF EXISTS "results_select" ON public.results;
CREATE POLICY "results_select" ON public.results
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- ── notes DELETE — 추가 ──
DROP POLICY IF EXISTS "notes_delete" ON public.notes;
CREATE POLICY "notes_delete" ON public.notes
  FOR DELETE USING (
    is_admin()
    OR sender_id = auth.uid()
  );

-- ── coupons DELETE — 추가 ──
DROP POLICY IF EXISTS "coupons_delete" ON public.coupons;
CREATE POLICY "coupons_delete" ON public.coupons
  FOR DELETE USING (
    is_admin()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = coupons.group_id AND owner_id = auth.uid()
    )
  );

-- ── coupons SELECT — 그룹 오너 + 미사용 쿠폰 공개 접근 확장 ──
DROP POLICY IF EXISTS "coupons_select" ON public.coupons;
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


-- ████████████████████████████████████████████████████████████████████████████
-- STEP 7: 인덱스
-- ████████████████████████████████████████████████████████████████████████████

-- 신규 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_managers_group_id ON public.group_managers(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_subgroups_group_id ON public.group_subgroups(group_id);
CREATE INDEX IF NOT EXISTS idx_group_org_group_id ON public.group_org(group_id);
CREATE INDEX IF NOT EXISTS idx_group_org_parent_id ON public.group_org(parent_id);

-- RLS 성능 인덱스 (기존 테이블 — IF NOT EXISTS로 안전)
CREATE INDEX IF NOT EXISTS idx_user_profiles_usertype ON public.user_profiles(usertype);
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_eval_list_user_id ON public.eval_list(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_sender_id ON public.notes(sender_id);
CREATE INDEX IF NOT EXISTS idx_notes_receiver_id ON public.notes(receiver_id);
CREATE INDEX IF NOT EXISTS idx_coupons_group_id ON public.coupons(group_id);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON public.coupons(created_by);


-- ████████████████████████████████████████████████████████████████████████████
-- STEP 8: RPC 함수
-- ████████████████████████████████████████████████████████████████████████████

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
  SELECT id, usertype, deleted_at
  INTO user_record
  FROM public.user_profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('status', 'not_found', 'reason', 'User profile not found');
  END IF;

  IF user_record.deleted_at IS NOT NULL THEN
    RETURN json_build_object('status', 'deleted', 'reason', 'Account has been deleted');
  END IF;

  IF current_domain IS NOT NULL THEN
    BEGIN
      UPDATE public.user_profiles
      SET updated_at = now()
      WHERE id = target_user_id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN json_build_object('status', 'active', 'reason', NULL);
END;
$$;


-- ████████████████████████████████████████████████████████████████████████████
-- 실행 완료 확인
-- ████████████████████████████████████████████████████████████████████████████
-- 아래 쿼리로 테이블/정책 확인:
--
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
--
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public' ORDER BY tablename, policyname;
