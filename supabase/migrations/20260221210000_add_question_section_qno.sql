-- ============================================================================
-- Add section and q_no columns to questions table
-- Matches legacy MySQL schema: question(q_id, section, q_no, q_text)
-- ============================================================================

ALTER TABLE questions ADD COLUMN IF NOT EXISTS section int;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS q_no    int;

CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_section_qno
  ON questions (section, q_no)
  WHERE section IS NOT NULL AND q_no IS NOT NULL;
