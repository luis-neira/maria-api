# Offenses belong to one Commandment; the Seventh and Tenth each have their own

Supersedes [ADR 0001](0001-offense-categories-shared-across-commandments.md).

An Offense belongs to exactly one Commandment, and its Offense category is optional and belongs to the same Commandment. The source gives one list for the Seventh and Tenth Commandments, and we store that list as separate Offenses under each, with the same wording. They are separate Offenses: one Act, such as stealing from one's parents, can match Offenses under several Commandments, and each Commandment judges it on its own terms. ADR 0001 shared the list through one "General" category linked to both Commandments; with grouping optional, "General" no longer exists, so there is no category left to share.

## Considered options

- **One Offense linked to several Commandments.** Rejected: it treats the Seventh's and Tenth's Offenses as the same Offense, which they are not, and needs a rule the schema can't easily enforce (an Offense's category must sit under one of its Commandments).
- **Store the list under the Seventh only.** Rejected: the source lists it under the Tenth too, so the Tenth would wrongly have no Offenses.
- **A separate `offense_texts` table both Offenses point to.** Rejected for now: the text is never edited at runtime, and the seed already holds each shared sentence once, so a wording fix is one edit.

## Consequences

- The 13 shared sentences are stored twice in the database. Only the seed writes them, so the copies can't drift. Add a shared text table if the text ever becomes editable at runtime.
- A composite foreign key, `offenses (offense_category_id, commandment_id)` to `offense_categories (id, commandment_id)`, guarantees an Offense's category belongs to the Offense's own Commandment.
