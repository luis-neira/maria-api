# Offense categories link to Commandments many-to-many

The source gives one list of Offenses for the Seventh and Tenth Commandments together. We model an Offense category as linkable to several Commandments through a `commandment_offense_categories` junction table, instead of giving each category a single `commandment_id`. The shared list is stored once, under one "General" category linked to both Commandments, and every Offense still belongs to exactly one category.

## Considered options

- **Duplicate the list under both Commandments.** Rejected: it stores the same 13 rows twice, so a fix to one copy leaves the other stale. The glossary's "separate Offense under each Commandment" rule covers distinct acts that offend two Commandments, not one list the source shares.
- **Store the list under the Seventh only.** Rejected: the Tenth would have no Offenses, which the source does not imply.
- **Redundant `commandment_id` on `offenses` with a composite foreign key.** Rejected: it breaks 3NF, because the category already determines the Commandment.
- **Nullable `offense_category_id` or nullable category name.** Rejected: it adds a second path to a Commandment, or a NULL that means "unnamed".

## Consequences

- Category names are not unique. "General" is the category for each Commandment whose source list has no sub-headings, so it repeats. The seed prevents duplicates with `WHERE NOT EXISTS`, not a constraint.
- Nothing in the schema stops a category from having no Commandment link. Seeding and any future write path must create the link.
- Queries for a Commandment's Offenses join through the junction table.
