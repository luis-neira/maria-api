CREATE TABLE IF NOT EXISTS offense_categories (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  commandment_id integer NOT NULL REFERENCES commandments (id) ON DELETE CASCADE,
  text text NOT NULL,
  UNIQUE (commandment_id, text)
);

CREATE TABLE IF NOT EXISTS offenses (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  offense_category_id integer NOT NULL REFERENCES offense_categories (id) ON DELETE CASCADE,
  text text NOT NULL,
  UNIQUE (offense_category_id, text)
);
