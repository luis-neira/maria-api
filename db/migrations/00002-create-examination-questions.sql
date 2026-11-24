CREATE TABLE IF NOT EXISTS examination_questions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  commandment_id integer NOT NULL REFERENCES commandments (id) ON DELETE CASCADE,
  question_position integer NOT NULL CHECK (question_position >= 1),
  text text NOT NULL,
  UNIQUE (commandment_id, question_position)
);
