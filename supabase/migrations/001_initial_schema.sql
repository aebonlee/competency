-- ============================================================================
-- MyCoreCompetency - Initial Schema Migration
-- ============================================================================
-- Competency assessment platform database schema for Supabase.
-- All tables have Row Level Security (RLS) enabled.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. user_profiles  (extends auth.users)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id          uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    name        text,
    gender      char(1)     CHECK (gender IN ('M', 'F')),
    phone       text,
    email       text,
    job         text,
    position    int         CHECK (position BETWEEN 1 AND 24),
    country     text,
    age         text,
    edulevel    text,
    usertype    int         DEFAULT 0 CHECK (usertype IN (0, 1, 2, 3)),
    grp         text,
    subgrp      text,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now(),
    deleted_at  timestamptz
);

COMMENT ON TABLE  user_profiles            IS 'Extended profile data for auth.users';
COMMENT ON COLUMN user_profiles.usertype   IS '0=individual, 1=group, 2=admin, 3=subgroup';
COMMENT ON COLUMN user_profiles.position   IS 'Job position level 1-24';

-- --------------------------------------------------------------------------
-- 2. eval_list  (evaluation sessions)
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

COMMENT ON TABLE eval_list IS 'Evaluation sessions per user';

-- --------------------------------------------------------------------------
-- 3. questions  (question bank -- created before eval_questions that references it)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id          serial      PRIMARY KEY,
    q_text      text,
    category    int,
    created_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE questions IS 'Master question bank';

-- --------------------------------------------------------------------------
-- 4. eval_questions  (individual question responses)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eval_questions (
    id          serial      PRIMARY KEY,
    eval_id     int         NOT NULL REFERENCES eval_list (id) ON DELETE CASCADE,
    stdq_id     int         REFERENCES questions (id),
    cmpq_id     int         REFERENCES questions (id),
    std_point   int         DEFAULT 0 CHECK (std_point IN (0, 10, 20, 30))
);

COMMENT ON TABLE  eval_questions           IS 'Per-question responses within an evaluation';
COMMENT ON COLUMN eval_questions.std_point IS 'Score value: 0, 10, 20, or 30';

-- --------------------------------------------------------------------------
-- 5. results  (computed competency results)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS results (
    id          serial      PRIMARY KEY,
    eval_id     int         NOT NULL UNIQUE REFERENCES eval_list (id) ON DELETE CASCADE,
    point1      int,
    point2      int,
    point3      int,
    point4      int,
    point5      int,
    point6      int,
    point7      int,
    point8      int,
    created_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE results IS 'Aggregated competency scores (8 dimensions) per evaluation';

-- --------------------------------------------------------------------------
-- 6. groups  (group organisations)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
    id          serial      PRIMARY KEY,
    name        text,
    owner_id    uuid        REFERENCES user_profiles (id) ON DELETE SET NULL,
    org         text,
    max_members int,
    created_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE groups IS 'Group organisations that own sets of members';

-- --------------------------------------------------------------------------
-- 7. coupons  (assessment coupons)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id          serial      PRIMARY KEY,
    code        text        UNIQUE NOT NULL,
    is_used     boolean     DEFAULT false,
    created_by  uuid        REFERENCES user_profiles (id) ON DELETE SET NULL,
    used_by     uuid        REFERENCES user_profiles (id) ON DELETE SET NULL,
    used_at     timestamptz,
    created_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE coupons IS 'Redeemable assessment coupon codes';

-- --------------------------------------------------------------------------
-- 8. purchases  (payment records)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases (
    id          serial      PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    amount      int         DEFAULT 25000,
    payment_id  text,
    status      text        DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    eval_id     int         REFERENCES eval_list (id) ON DELETE SET NULL,
    created_at  timestamptz DEFAULT now(),
    paid_at     timestamptz
);

COMMENT ON TABLE  purchases            IS 'PortOne payment records';
COMMENT ON COLUMN purchases.payment_id IS 'PortOne external payment identifier';
COMMENT ON COLUMN purchases.amount     IS 'Amount in KRW (default 25,000)';

-- --------------------------------------------------------------------------
-- 9. surveys  (satisfaction surveys)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS surveys (
    id          serial      PRIMARY KEY,
    eval_id     int         NOT NULL REFERENCES eval_list (id) ON DELETE CASCADE,
    q1          int,
    q2          int,
    q3          int,
    q4          int,
    q5          int,
    comment     text,
    created_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE surveys IS 'Post-evaluation satisfaction survey responses';

-- --------------------------------------------------------------------------
-- 10. boards  (bulletin board)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS boards (
    id          serial      PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    board_type  text        DEFAULT 'notice',
    title       text,
    content     text,
    views       int         DEFAULT 0,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE boards IS 'Bulletin board posts (notices, FAQ, etc.)';

-- --------------------------------------------------------------------------
-- 11. notes  (messages / notifications)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
    id          serial      PRIMARY KEY,
    sender_id   uuid        NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    receiver_id uuid        NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    content     text,
    is_read     boolean     DEFAULT false,
    created_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE notes IS 'Direct messages / notifications between users';


-- ============================================================================
-- INDEXES
-- ============================================================================

-- user_profiles
CREATE INDEX idx_user_profiles_usertype   ON user_profiles (usertype);
CREATE INDEX idx_user_profiles_grp        ON user_profiles (grp);
CREATE INDEX idx_user_profiles_email      ON user_profiles (email);

-- eval_list
CREATE INDEX idx_eval_list_user_id        ON eval_list (user_id);

-- eval_questions
CREATE INDEX idx_eval_questions_eval_id   ON eval_questions (eval_id);
CREATE INDEX idx_eval_questions_stdq_id   ON eval_questions (stdq_id);
CREATE INDEX idx_eval_questions_cmpq_id   ON eval_questions (cmpq_id);

-- results  (eval_id already has a unique index via UNIQUE constraint)

-- groups
CREATE INDEX idx_groups_owner_id          ON groups (owner_id);

-- coupons  (code already has a unique index via UNIQUE constraint)
CREATE INDEX idx_coupons_created_by       ON coupons (created_by);
CREATE INDEX idx_coupons_used_by          ON coupons (used_by);

-- purchases
CREATE INDEX idx_purchases_user_id        ON purchases (user_id);
CREATE INDEX idx_purchases_eval_id        ON purchases (eval_id);
CREATE INDEX idx_purchases_payment_id     ON purchases (payment_id);
CREATE INDEX idx_purchases_status         ON purchases (status);

-- surveys
CREATE INDEX idx_surveys_eval_id          ON surveys (eval_id);

-- boards
CREATE INDEX idx_boards_user_id           ON boards (user_id);
CREATE INDEX idx_boards_board_type        ON boards (board_type);

-- notes
CREATE INDEX idx_notes_sender_id          ON notes (sender_id);
CREATE INDEX idx_notes_receiver_id        ON notes (receiver_id);
CREATE INDEX idx_notes_is_read            ON notes (receiver_id, is_read);


-- ============================================================================
-- HELPER: check if the current user is an admin (usertype = 2)
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
-- ROW LEVEL SECURITY  (enable on every table, then attach policies)
-- ============================================================================

-- ----- user_profiles -------------------------------------------------------
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
    ON user_profiles FOR SELECT
    USING (id = auth.uid() OR is_admin());

CREATE POLICY "users_update_own"
    ON user_profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "users_insert_own"
    ON user_profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Admins can read all profiles (covered by users_select_own OR clause).
-- Admins can also update any profile.
CREATE POLICY "admin_update_all_profiles"
    ON user_profiles FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- ----- eval_list -----------------------------------------------------------
ALTER TABLE eval_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eval_list_select"
    ON eval_list FOR SELECT
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "eval_list_insert"
    ON eval_list FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "eval_list_update"
    ON eval_list FOR UPDATE
    USING (user_id = auth.uid() OR is_admin())
    WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "eval_list_delete"
    ON eval_list FOR DELETE
    USING (user_id = auth.uid() OR is_admin());

-- ----- eval_questions ------------------------------------------------------
ALTER TABLE eval_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eval_questions_select"
    ON eval_questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM eval_list
            WHERE eval_list.id = eval_questions.eval_id
              AND (eval_list.user_id = auth.uid() OR is_admin())
        )
    );

CREATE POLICY "eval_questions_insert"
    ON eval_questions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM eval_list
            WHERE eval_list.id = eval_questions.eval_id
              AND eval_list.user_id = auth.uid()
        )
    );

CREATE POLICY "eval_questions_update"
    ON eval_questions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM eval_list
            WHERE eval_list.id = eval_questions.eval_id
              AND (eval_list.user_id = auth.uid() OR is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM eval_list
            WHERE eval_list.id = eval_questions.eval_id
              AND (eval_list.user_id = auth.uid() OR is_admin())
        )
    );

-- ----- questions -----------------------------------------------------------
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Questions are globally readable by any authenticated user.
CREATE POLICY "questions_select_all"
    ON questions FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Only admins may manage the question bank.
CREATE POLICY "questions_admin_insert"
    ON questions FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "questions_admin_update"
    ON questions FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "questions_admin_delete"
    ON questions FOR DELETE
    USING (is_admin());

-- ----- results -------------------------------------------------------------
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "results_select"
    ON results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM eval_list
            WHERE eval_list.id = results.eval_id
              AND (eval_list.user_id = auth.uid() OR is_admin())
        )
    );

CREATE POLICY "results_insert"
    ON results FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM eval_list
            WHERE eval_list.id = results.eval_id
              AND (eval_list.user_id = auth.uid() OR is_admin())
        )
    );

CREATE POLICY "results_update"
    ON results FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM eval_list
            WHERE eval_list.id = results.eval_id
              AND (eval_list.user_id = auth.uid() OR is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM eval_list
            WHERE eval_list.id = results.eval_id
              AND (eval_list.user_id = auth.uid() OR is_admin())
        )
    );

-- ----- groups --------------------------------------------------------------
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Groups are readable by any authenticated user.
CREATE POLICY "groups_select"
    ON groups FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "groups_insert"
    ON groups FOR INSERT
    WITH CHECK (owner_id = auth.uid() OR is_admin());

CREATE POLICY "groups_update"
    ON groups FOR UPDATE
    USING (owner_id = auth.uid() OR is_admin())
    WITH CHECK (owner_id = auth.uid() OR is_admin());

CREATE POLICY "groups_delete"
    ON groups FOR DELETE
    USING (owner_id = auth.uid() OR is_admin());

-- ----- coupons -------------------------------------------------------------
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Users can see coupons they created or used.
CREATE POLICY "coupons_select"
    ON coupons FOR SELECT
    USING (
        created_by = auth.uid()
        OR used_by = auth.uid()
        OR is_admin()
    );

CREATE POLICY "coupons_insert"
    ON coupons FOR INSERT
    WITH CHECK (is_admin() OR created_by = auth.uid());

CREATE POLICY "coupons_update"
    ON coupons FOR UPDATE
    USING (is_admin() OR created_by = auth.uid() OR used_by = auth.uid())
    WITH CHECK (is_admin() OR created_by = auth.uid() OR used_by = auth.uid());

-- ----- purchases -----------------------------------------------------------
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchases_select"
    ON purchases FOR SELECT
    USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "purchases_insert"
    ON purchases FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "purchases_update"
    ON purchases FOR UPDATE
    USING (user_id = auth.uid() OR is_admin())
    WITH CHECK (user_id = auth.uid() OR is_admin());

-- ----- surveys -------------------------------------------------------------
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "surveys_select"
    ON surveys FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM eval_list
            WHERE eval_list.id = surveys.eval_id
              AND (eval_list.user_id = auth.uid() OR is_admin())
        )
    );

CREATE POLICY "surveys_insert"
    ON surveys FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM eval_list
            WHERE eval_list.id = surveys.eval_id
              AND eval_list.user_id = auth.uid()
        )
    );

-- ----- boards --------------------------------------------------------------
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- Board posts are publicly readable by any authenticated user.
CREATE POLICY "boards_select"
    ON boards FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "boards_insert"
    ON boards FOR INSERT
    WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "boards_update"
    ON boards FOR UPDATE
    USING (user_id = auth.uid() OR is_admin())
    WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "boards_delete"
    ON boards FOR DELETE
    USING (user_id = auth.uid() OR is_admin());

-- ----- notes ---------------------------------------------------------------
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Users can see notes they sent or received.
CREATE POLICY "notes_select"
    ON notes FOR SELECT
    USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR is_admin());

CREATE POLICY "notes_insert"
    ON notes FOR INSERT
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "notes_update"
    ON notes FOR UPDATE
    USING (receiver_id = auth.uid() OR is_admin())
    WITH CHECK (receiver_id = auth.uid() OR is_admin());


-- ============================================================================
-- TRIGGER: auto-create user_profiles on auth.users INSERT
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
        now(),
        now()
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();


-- ============================================================================
-- TRIGGER: auto-update updated_at on user_profiles
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

CREATE TRIGGER set_updated_at_user_profiles
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_boards
    BEFORE UPDATE ON boards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
