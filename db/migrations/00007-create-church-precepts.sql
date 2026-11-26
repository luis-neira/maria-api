CREATE TABLE IF NOT EXISTS church_precepts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  number integer NOT NULL UNIQUE CHECK (number BETWEEN 1 AND 5),
  text text NOT NULL
);
