-- Reject empty text. ADD CONSTRAINT has no IF NOT EXISTS, so drop then add to stay idempotent.
ALTER TABLE church_precepts
  DROP CONSTRAINT IF EXISTS church_precepts_text_not_empty,
  ADD CONSTRAINT church_precepts_text_not_empty CHECK (text <> '');

ALTER TABLE church_precept_questions
  DROP CONSTRAINT IF EXISTS church_precept_questions_text_not_empty,
  ADD CONSTRAINT church_precept_questions_text_not_empty CHECK (text <> '');
