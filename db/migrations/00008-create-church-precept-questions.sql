CREATE TABLE IF NOT EXISTS church_precept_questions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  church_precept_id integer NOT NULL REFERENCES church_precepts (id) ON DELETE CASCADE,
  question_position integer NOT NULL CHECK (question_position >= 1),
  text text NOT NULL,
  UNIQUE (church_precept_id, question_position)
);
