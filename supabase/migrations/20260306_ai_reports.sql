-- AI 역량 분석 보고서 테이블
CREATE TABLE IF NOT EXISTS public.ai_reports (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  eval_id           INTEGER NOT NULL REFERENCES public.eval_list(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL CHECK (provider IN ('claude', 'openai')),
  model             TEXT NOT NULL,
  report_content    TEXT NOT NULL,
  scores_snapshot   JSONB NOT NULL,
  user_context      JSONB,
  prompt_tokens     INTEGER,
  completion_tokens INTEGER,
  generation_time_ms INTEGER,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 동일 검사에 대해 provider별 1개 보고서 (upsert 가능)
CREATE UNIQUE INDEX idx_ai_reports_eval_provider ON ai_reports(eval_id, provider);

-- 사용자별 조회 인덱스
CREATE INDEX idx_ai_reports_user_id ON ai_reports(user_id);

-- RLS 활성화
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

-- 본인 보고서 읽기
CREATE POLICY "ai_reports_select_own" ON public.ai_reports
  FOR SELECT USING (auth.uid() = user_id);

-- 본인 보고서 생성
CREATE POLICY "ai_reports_insert_own" ON public.ai_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 보고서 수정 (재생성 시 upsert)
CREATE POLICY "ai_reports_update_own" ON public.ai_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- 관리자 전체 열람 (usertype = 2)
CREATE POLICY "ai_reports_select_admin" ON public.ai_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.usertype = 2
    )
  );
