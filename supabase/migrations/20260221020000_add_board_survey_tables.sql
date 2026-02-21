-- ============================================================================
-- MyCoreCompetency - 추가 테이블 및 관리자 함수 업데이트
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. board_posts (게시판)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS board_posts (
    id          serial      PRIMARY KEY,
    title       text        NOT NULL,
    content     text,
    image_url   text,
    author_id   uuid        NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_posts_author ON board_posts (author_id);

ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY board_posts_select ON board_posts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY board_posts_insert ON board_posts FOR INSERT WITH CHECK (is_admin());
CREATE POLICY board_posts_update ON board_posts FOR UPDATE USING (is_admin());
CREATE POLICY board_posts_delete ON board_posts FOR DELETE USING (is_admin());

-- --------------------------------------------------------------------------
-- 2. survey_questions (만족도 조사 질문)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS survey_questions (
    id          serial      PRIMARY KEY,
    content     text        NOT NULL,
    target_type text        DEFAULT 'all',
    group_name  text,
    start_date  date,
    end_date    date,
    created_at  timestamptz DEFAULT now()
);

ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY survey_questions_select ON survey_questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY survey_questions_insert ON survey_questions FOR INSERT WITH CHECK (is_admin());
CREATE POLICY survey_questions_update ON survey_questions FOR UPDATE USING (is_admin());
CREATE POLICY survey_questions_delete ON survey_questions FOR DELETE USING (is_admin());

-- --------------------------------------------------------------------------
-- 3. is_admin() 함수 업데이트 — 이메일 기반 관리자 체크 추가
-- --------------------------------------------------------------------------
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
          AND (
            usertype = 2
            OR email IN ('aebon@kakao.com', 'aebon@kyonggi.ac.kr')
          )
    );
$$;

-- --------------------------------------------------------------------------
-- 4. user_profiles INSERT 정책 (OAuth 첫 로그인 시 프로필 생성용)
-- --------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'mcc_users_insert_own' AND tablename = 'user_profiles') THEN
    CREATE POLICY mcc_users_insert_own ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- 5. user_profiles UPDATE 정책 (본인 프로필 수정용)
-- --------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'mcc_users_update_own' AND tablename = 'user_profiles') THEN
    CREATE POLICY mcc_users_update_own ON user_profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END $$;
