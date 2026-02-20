-- ============================================================================
-- MyCoreCompetency - Schema Migration (shared Supabase project)
-- ============================================================================
-- Adds competency-specific columns to existing user_profiles and
-- creates new tables for the assessment platform.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. ALTER user_profiles: add MCC-specific columns
-- --------------------------------------------------------------------------
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender      char(1);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone       text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS job         text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS position    int;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country     text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age         text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS edulevel    text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS usertype    int DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS grp         text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subgrp      text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS deleted_at  timestamptz;

-- --------------------------------------------------------------------------
-- 2. eval_list (evaluation sessions)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eval_list (
    id          serial      PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    eval_type   int         DEFAULT 1,
    times       int,
    progress    int         DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    start_date  timestamptz,
    end_date    timestamptz,
    created_at  timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 3. questions (master question bank)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id          serial      PRIMARY KEY,
    q_text      text        NOT NULL,
    category    text,
    created_at  timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 4. eval_questions (individual responses)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eval_questions (
    id          serial      PRIMARY KEY,
    eval_id     int         NOT NULL REFERENCES eval_list (id) ON DELETE CASCADE,
    stdq_id     int         REFERENCES questions (id),
    cmpq_id     int         REFERENCES questions (id),
    std_point   int         CHECK (std_point IN (0, 10, 20, 30)),
    created_at  timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 5. results (computed competency scores)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS results (
    id          serial      PRIMARY KEY,
    eval_id     int         NOT NULL UNIQUE REFERENCES eval_list (id) ON DELETE CASCADE,
    point1      int         DEFAULT 0,
    point2      int         DEFAULT 0,
    point3      int         DEFAULT 0,
    point4      int         DEFAULT 0,
    point5      int         DEFAULT 0,
    point6      int         DEFAULT 0,
    point7      int         DEFAULT 0,
    point8      int         DEFAULT 0,
    created_at  timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 6. groups
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
    id          serial      PRIMARY KEY,
    name        text        NOT NULL,
    owner_id    uuid        NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    org         text,
    max_members int         DEFAULT 100,
    created_at  timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 7. coupons
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id          serial      PRIMARY KEY,
    code        text        NOT NULL UNIQUE,
    is_used     boolean     DEFAULT false,
    created_by  uuid        REFERENCES user_profiles (id),
    used_by     uuid        REFERENCES user_profiles (id),
    group_id    int         REFERENCES groups (id),
    created_at  timestamptz DEFAULT now(),
    used_at     timestamptz
);

-- --------------------------------------------------------------------------
-- 8. purchases (payment records)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases (
    id          serial      PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    eval_id     int         REFERENCES eval_list (id),
    amount      int         DEFAULT 25000,
    payment_id  text,
    status      text        DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
    created_at  timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 9. surveys (satisfaction)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS surveys (
    id          serial      PRIMARY KEY,
    eval_id     int         NOT NULL REFERENCES eval_list (id) ON DELETE CASCADE,
    user_id     uuid        REFERENCES user_profiles (id),
    rating      int,
    q1          int,
    q2          int,
    q3          int,
    q4          int,
    q5          int,
    comment     text,
    created_at  timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 10. notes (messages / notifications)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
    id          serial      PRIMARY KEY,
    sender_id   uuid        NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    receiver_id uuid        NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    title       text,
    content     text,
    note_type   text        DEFAULT 'message',
    is_read     boolean     DEFAULT false,
    created_at  timestamptz DEFAULT now()
);


-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_usertype   ON user_profiles (usertype);
CREATE INDEX IF NOT EXISTS idx_user_profiles_grp        ON user_profiles (grp);
CREATE INDEX IF NOT EXISTS idx_eval_list_user_id        ON eval_list (user_id);
CREATE INDEX IF NOT EXISTS idx_eval_questions_eval_id   ON eval_questions (eval_id);
CREATE INDEX IF NOT EXISTS idx_eval_questions_stdq_id   ON eval_questions (stdq_id);
CREATE INDEX IF NOT EXISTS idx_eval_questions_cmpq_id   ON eval_questions (cmpq_id);
CREATE INDEX IF NOT EXISTS idx_groups_owner_id          ON groups (owner_id);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by       ON coupons (created_by);
CREATE INDEX IF NOT EXISTS idx_coupons_used_by          ON coupons (used_by);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id        ON purchases (user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_eval_id        ON purchases (eval_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id     ON purchases (payment_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status         ON purchases (status);
CREATE INDEX IF NOT EXISTS idx_surveys_eval_id          ON surveys (eval_id);
CREATE INDEX IF NOT EXISTS idx_notes_sender_id          ON notes (sender_id);
CREATE INDEX IF NOT EXISTS idx_notes_receiver_id        ON notes (receiver_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_read            ON notes (receiver_id, is_read);


-- ============================================================================
-- HELPER: is_admin()
-- ============================================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE id = auth.uid()
          AND usertype = 2
    );
$$;


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- user_profiles: add MCC-specific policies (RLS already enabled)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'mcc_users_select_own' AND tablename = 'user_profiles') THEN
    CREATE POLICY mcc_users_select_own ON user_profiles FOR SELECT USING (id = auth.uid() OR is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'mcc_admin_update_profiles' AND tablename = 'user_profiles') THEN
    CREATE POLICY mcc_admin_update_profiles ON user_profiles FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END $$;

-- eval_list
ALTER TABLE eval_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY eval_list_select ON eval_list FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY eval_list_insert ON eval_list FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY eval_list_update ON eval_list FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY eval_list_delete ON eval_list FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY questions_select ON questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY questions_admin_insert ON questions FOR INSERT WITH CHECK (is_admin());
CREATE POLICY questions_admin_update ON questions FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY questions_admin_delete ON questions FOR DELETE USING (is_admin());

-- eval_questions
ALTER TABLE eval_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY eval_questions_select ON eval_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM eval_list WHERE eval_list.id = eval_questions.eval_id AND (eval_list.user_id = auth.uid() OR is_admin())));
CREATE POLICY eval_questions_insert ON eval_questions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM eval_list WHERE eval_list.id = eval_questions.eval_id AND eval_list.user_id = auth.uid()));
CREATE POLICY eval_questions_update ON eval_questions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM eval_list WHERE eval_list.id = eval_questions.eval_id AND (eval_list.user_id = auth.uid() OR is_admin())));

-- results
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
CREATE POLICY results_select ON results FOR SELECT
  USING (EXISTS (SELECT 1 FROM eval_list WHERE eval_list.id = results.eval_id AND (eval_list.user_id = auth.uid() OR is_admin())));
CREATE POLICY results_insert ON results FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM eval_list WHERE eval_list.id = results.eval_id AND eval_list.user_id = auth.uid()));
CREATE POLICY results_update ON results FOR UPDATE
  USING (EXISTS (SELECT 1 FROM eval_list WHERE eval_list.id = results.eval_id AND (eval_list.user_id = auth.uid() OR is_admin())));

-- groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY groups_select ON groups FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY groups_insert ON groups FOR INSERT WITH CHECK (owner_id = auth.uid() OR is_admin());
CREATE POLICY groups_update ON groups FOR UPDATE USING (owner_id = auth.uid() OR is_admin());
CREATE POLICY groups_delete ON groups FOR DELETE USING (owner_id = auth.uid() OR is_admin());

-- coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY coupons_select ON coupons FOR SELECT USING (created_by = auth.uid() OR used_by = auth.uid() OR is_admin());
CREATE POLICY coupons_insert ON coupons FOR INSERT WITH CHECK (is_admin() OR created_by = auth.uid());
CREATE POLICY coupons_update ON coupons FOR UPDATE USING (is_admin() OR created_by = auth.uid() OR used_by = auth.uid());

-- purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY purchases_select ON purchases FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY purchases_insert ON purchases FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY purchases_update ON purchases FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- surveys
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY surveys_select ON surveys FOR SELECT
  USING (EXISTS (SELECT 1 FROM eval_list WHERE eval_list.id = surveys.eval_id AND (eval_list.user_id = auth.uid() OR is_admin())));
CREATE POLICY surveys_insert ON surveys FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM eval_list WHERE eval_list.id = surveys.eval_id AND eval_list.user_id = auth.uid()));

-- notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY notes_select ON notes FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR is_admin());
CREATE POLICY notes_insert ON notes FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY notes_update ON notes FOR UPDATE USING (receiver_id = auth.uid() OR is_admin());


-- ============================================================================
-- TRIGGER: auto-update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'set_updated_at_user_profiles_mcc') THEN
    CREATE TRIGGER set_updated_at_user_profiles_mcc
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
