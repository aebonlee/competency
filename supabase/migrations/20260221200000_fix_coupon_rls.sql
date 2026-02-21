-- ============================================================================
-- coupons RLS 수정: 일반 사용자가 미사용 쿠폰을 코드로 조회 + 사용할 수 있도록
-- ============================================================================

-- 기존 SELECT 정책 삭제 후 재생성
-- Before: created_by = auth.uid() OR used_by = auth.uid() OR is_admin()
-- → 일반 사용자는 자신이 만들지 않은 미사용 쿠폰을 조회할 수 없음
DROP POLICY IF EXISTS coupons_select ON coupons;
CREATE POLICY coupons_select ON coupons FOR SELECT
  USING (
    is_used = false                          -- 누구나 미사용 쿠폰 조회 가능 (코드 검증용)
    OR used_by = auth.uid()                  -- 자신이 사용한 쿠폰
    OR created_by = auth.uid()               -- 자신이 생성한 쿠폰
    OR is_admin()                            -- 관리자
  );

-- 기존 UPDATE 정책 삭제 후 재생성
-- Before: is_admin() OR created_by = auth.uid() OR used_by = auth.uid()
-- → 미사용 쿠폰은 used_by가 NULL이므로 일반 사용자가 업데이트 불가
DROP POLICY IF EXISTS coupons_update ON coupons;
CREATE POLICY coupons_update ON coupons FOR UPDATE
  USING (
    is_admin()
    OR created_by = auth.uid()
    OR (is_used = false AND auth.uid() IS NOT NULL)  -- 로그인 사용자는 미사용 쿠폰 사용 가능
  );
