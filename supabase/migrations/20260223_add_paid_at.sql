-- purchases 테이블에 paid_at 컬럼 추가
-- 코드(supabase.ts, verify-payment)에서 paid_at을 설정하지만 스키마에 누락되어 있었음
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS paid_at timestamptz;
