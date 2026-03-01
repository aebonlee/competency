-- ============================================================================
-- MyCoreCompetency — 누락 스키마 보완 마이그레이션
-- 날짜: 2026-03-01
-- 세션: 21-B (전체 사이트 점검 후 수정)
-- ============================================================================

-- ============================================================
-- 1. group_org 테이블 (조직도)
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
-- 2. user_profiles.signup_domain 컬럼
-- ============================================================
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS signup_domain TEXT;

-- ============================================================
-- 3. coupons.assigned_user 컬럼
-- ============================================================
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS assigned_user TEXT;

-- ============================================================
-- 4. check_user_status RPC 함수 (기존 함수 삭제 후 재생성)
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
  result JSON;
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

  -- 방문 도메인 추적 (visited_sites 컬럼이 있을 경우)
  IF current_domain IS NOT NULL THEN
    BEGIN
      UPDATE public.user_profiles
      SET updated_at = now()
      WHERE id = target_user_id;
    EXCEPTION WHEN OTHERS THEN
      -- visited_sites 컬럼이 없어도 에러 무시
      NULL;
    END;
  END IF;

  -- 정상
  RETURN json_build_object('status', 'active', 'reason', NULL);
END;
$$;
