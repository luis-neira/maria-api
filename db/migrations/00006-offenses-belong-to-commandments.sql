-- An Offense belongs to exactly one Commandment; its Offense category is optional and belongs to
-- the same Commandment. Replaces the many-to-many junction from 00005.
-- See docs/adr/0002-offenses-belong-to-one-commandment.md.

ALTER TABLE offense_categories
  ADD COLUMN IF NOT EXISTS commandment_id integer REFERENCES commandments (id) ON DELETE CASCADE;

ALTER TABLE offenses
  ADD COLUMN IF NOT EXISTS commandment_id integer REFERENCES commandments (id) ON DELETE CASCADE;

-- Backfill from the junction, only while it still exists. A category linked to several
-- Commandments stays with the lowest-numbered one; every other Commandment gets its own copy of
-- the category and of its Offenses.
DO $$
DECLARE
  link record;
  copy_id integer;
BEGIN
  IF to_regclass('commandment_offense_categories') IS NOT NULL THEN
    UPDATE offense_categories oc
    SET commandment_id = first_link.commandment_id
    FROM (
      SELECT DISTINCT ON (l.offense_category_id) l.offense_category_id, l.commandment_id
      FROM commandment_offense_categories l
      JOIN commandments c ON c.id = l.commandment_id
      ORDER BY l.offense_category_id, c.number
    ) first_link
    WHERE oc.id = first_link.offense_category_id;

    UPDATE offenses o
    SET commandment_id = oc.commandment_id
    FROM offense_categories oc
    WHERE oc.id = o.offense_category_id;

    FOR link IN
      SELECT l.commandment_id, l.offense_category_id
      FROM commandment_offense_categories l
      JOIN offense_categories oc ON oc.id = l.offense_category_id
      WHERE oc.commandment_id <> l.commandment_id
    LOOP
      INSERT INTO offense_categories (commandment_id, text)
      SELECT link.commandment_id, text FROM offense_categories WHERE id = link.offense_category_id
      RETURNING id INTO copy_id;

      INSERT INTO offenses (commandment_id, offense_category_id, text)
      SELECT link.commandment_id, copy_id, text FROM offenses
      WHERE offense_category_id = link.offense_category_id;
    END LOOP;

    DROP TABLE commandment_offense_categories;
  END IF;
END $$;

-- Fails if a category had no Commandment link: there is no Commandment to give it.
ALTER TABLE offense_categories ALTER COLUMN commandment_id SET NOT NULL;

ALTER TABLE offenses
  ALTER COLUMN commandment_id SET NOT NULL,
  ALTER COLUMN offense_category_id DROP NOT NULL;

-- Names are unique within a Commandment. (id, commandment_id) is the target of the composite key below.
ALTER TABLE offense_categories
  DROP CONSTRAINT IF EXISTS offense_categories_commandment_id_text_key,
  ADD CONSTRAINT offense_categories_commandment_id_text_key UNIQUE (commandment_id, text),
  DROP CONSTRAINT IF EXISTS offense_categories_id_commandment_id_key,
  ADD CONSTRAINT offense_categories_id_commandment_id_key UNIQUE (id, commandment_id);

-- An Offense's category must belong to the Offense's own Commandment. With no category
-- (offense_category_id NULL) the key is not checked.
ALTER TABLE offenses
  DROP CONSTRAINT IF EXISTS offenses_offense_category_id_text_key,
  DROP CONSTRAINT IF EXISTS offenses_offense_category_id_fkey,
  DROP CONSTRAINT IF EXISTS offenses_commandment_id_text_key,
  ADD CONSTRAINT offenses_commandment_id_text_key UNIQUE (commandment_id, text),
  DROP CONSTRAINT IF EXISTS offenses_offense_category_same_commandment_fkey,
  ADD CONSTRAINT offenses_offense_category_same_commandment_fkey
    FOREIGN KEY (offense_category_id, commandment_id)
    REFERENCES offense_categories (id, commandment_id) ON DELETE CASCADE;

-- The dropped UNIQUE (offense_category_id, text) indexed this column; keep category deletes fast.
CREATE INDEX IF NOT EXISTS offenses_offense_category_id_idx ON offenses (offense_category_id);
