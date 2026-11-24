-- Reject empty text. ADD CONSTRAINT has no IF NOT EXISTS, so drop then add to stay idempotent.
ALTER TABLE commandments
  DROP CONSTRAINT IF EXISTS commandments_text_not_empty,
  ADD CONSTRAINT commandments_text_not_empty CHECK (text <> '');

ALTER TABLE examination_questions
  DROP CONSTRAINT IF EXISTS examination_questions_text_not_empty,
  ADD CONSTRAINT examination_questions_text_not_empty CHECK (text <> '');

ALTER TABLE offense_categories
  DROP CONSTRAINT IF EXISTS offense_categories_text_not_empty,
  ADD CONSTRAINT offense_categories_text_not_empty CHECK (text <> '');

ALTER TABLE offenses
  DROP CONSTRAINT IF EXISTS offenses_text_not_empty,
  ADD CONSTRAINT offenses_text_not_empty CHECK (text <> '');
