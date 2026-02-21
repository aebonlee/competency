-- ============================================================================
-- user_profiles: name, email, updated_at 컬럼 추가 (누락분)
-- 코드 전체에서 profile.name, profile.email 을 사용하므로 필수
-- ============================================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name       text DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email      text DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
