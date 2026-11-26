ALTER TABLE examination_questions RENAME TO commandment_questions;

ALTER TABLE commandment_questions
  RENAME CONSTRAINT examination_questions_pkey TO commandment_questions_pkey;

ALTER TABLE commandment_questions
  RENAME CONSTRAINT examination_questions_commandment_id_question_position_key
  TO commandment_questions_commandment_id_question_position_key;

ALTER TABLE commandment_questions
  RENAME CONSTRAINT examination_questions_commandment_id_fkey
  TO commandment_questions_commandment_id_fkey;

ALTER TABLE commandment_questions
  RENAME CONSTRAINT examination_questions_question_position_check
  TO commandment_questions_question_position_check;

ALTER TABLE commandment_questions
  RENAME CONSTRAINT examination_questions_text_not_empty
  TO commandment_questions_text_not_empty;

ALTER SEQUENCE examination_questions_id_seq RENAME TO commandment_questions_id_seq;

-- PostgreSQL 18 also gives NOT NULL constraints catalog names.
DO $$
DECLARE
  old_name text;
BEGIN
  FOR old_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'commandment_questions'::regclass
      AND contype = 'n'
      AND starts_with(conname, 'examination_questions_')
  LOOP
    EXECUTE format(
      'ALTER TABLE commandment_questions RENAME CONSTRAINT %I TO %I',
      old_name,
      replace(old_name, 'examination_questions_', 'commandment_questions_')
    );
  END LOOP;
END;
$$;
