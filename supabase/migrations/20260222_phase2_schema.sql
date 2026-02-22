-- Phase 2 DB Schema Migration
-- 프론트엔드 코드에서 사용 중인 테이블/컬럼 정의
-- Supabase Dashboard에서 별도 실행 필요

-- ============================================================
-- 1. group_members 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
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
-- 2. group_managers 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_managers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
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
-- 3. group_invitations 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
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
-- 4. board_posts.views DEFAULT 0
-- ============================================================
ALTER TABLE public.board_posts
  ALTER COLUMN views SET DEFAULT 0;

-- ============================================================
-- 5. groups 확장 컬럼
-- ============================================================
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS group_type TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 100;

-- ============================================================
-- 6. group_subgroups 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_subgroups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
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
-- 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_managers_group_id ON public.group_managers(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_subgroups_group_id ON public.group_subgroups(group_id);
