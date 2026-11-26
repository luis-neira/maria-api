## Agent skills

### Issue tracker

Issues live in GitHub Issues for `luis-neira/maria-api` (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Commits

Every commit message follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/#specification): `<type>[(scope)][!]: <description>`, then an optional body and footers, each block separated by a blank line. This applies to new commits, amends, rewords, squash commits, and PR titles. Git's default merge messages stay as they are.

- **Type**: one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Scope**: optional. A lowercase kebab-case noun for the one part of the codebase changed: a resource name (`commandments`, `offenses`, `church-precepts`, `commandment-questions`, `church-precept-questions`) where one fits, otherwise an area such as `db`. Omit it when the change spans several parts.
- **Description**: imperative, starting lowercase (proper nouns, `GLOSSARY.md` terms and acronyms keep their capitals), no trailing period. The whole first line is at most 72 characters.
- **Breaking change**: one that forces API clients or deployers to act, such as removing or renaming a route, response field or required environment variable. Mark it with both `!` and a `BREAKING CHANGE: <what has to change>` footer.
- **Issue**: add `Refs #N`, or `Closes #N` when the commit finishes the issue. Use only a known issue number.
- **Revert**: `revert: <original description>` with a `Refs: <sha>` footer, replacing Git's default message.
- **One type per commit**: split mixed changes where practical. Tests and docs for a feature or fix belong in its `feat` or `fix` commit.
