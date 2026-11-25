-- An Offense category may serve more than one Commandment (the source gives one list for the
-- Seventh and Tenth). Replace offense_categories.commandment_id with a many-to-many junction.
-- See docs/adr/0001-offense-categories-shared-across-commandments.md.
CREATE TABLE IF NOT EXISTS commandment_offense_categories (
  commandment_id integer NOT NULL REFERENCES commandments (id) ON DELETE CASCADE,
  offense_category_id integer NOT NULL REFERENCES offense_categories (id) ON DELETE CASCADE,
  PRIMARY KEY (commandment_id, offense_category_id)
);

CREATE INDEX IF NOT EXISTS commandment_offense_categories_category_idx
  ON commandment_offense_categories (offense_category_id);

-- Backfill from the old one-to-many column, only while it still exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'offense_categories'
      AND column_name = 'commandment_id'
  ) THEN
    INSERT INTO commandment_offense_categories (commandment_id, offense_category_id)
    SELECT commandment_id, id FROM offense_categories
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Category names are no longer unique: "General" repeats across Commandments. Dropping the
-- column also drops UNIQUE (commandment_id, text).
ALTER TABLE offense_categories DROP COLUMN IF EXISTS commandment_id;
