# maria-schema

Proof of concept for a database of the Ten Commandments and the examination-of-conscience questions from the USCCB leaflet in [`docs/`](docs/Examination-of-Conscience-Ten-Commandments.pdf).

It runs on [PGlite](https://pglite.dev) (Postgres compiled to WebAssembly) and stores data in `./data/pgdata`. You don't need to install a Postgres server. [`@electric-sql/pglite-socket`](https://www.npmjs.com/package/@electric-sql/pglite-socket) serves the database over the Postgres wire protocol, so `psql` and [`@databases/pg-migrations`](https://www.atdatabases.org/docs/pg-migrations) can connect to it like a normal server. The plan is to move to a real Postgres server later. The migrations and seed are plain Postgres SQL, so they will run there unchanged.

## Requirements

- Node.js 22+
- `psql` on your `PATH`. On macOS: `brew install libpq` and add `/opt/homebrew/opt/libpq/bin` to `PATH`.

## Getting started

```sh
npm install

# Terminal 1: start the database server and leave it running
npm run db:server

# Terminal 2
npm run db:migrate
npm run db:seed
```

## Scripts

| Script | What it does |
|---|---|
| `db:server` | Starts PGlite on `127.0.0.1:54329` with data in `./data/pgdata`. The other scripts need this running. |
| `db:migrate` | Applies pending migrations from `db/migrations/`. Already-applied migrations are skipped. |
| `db:seed` | Loads `db/seed.sql` in a single transaction. Safe to re-run: it updates text in place. |
| `db:reset` | Drops and recreates the `public` schema, then runs `db:migrate` and `db:seed`. The server keeps running. |

## Connecting with psql

With `db:server` running:

```sh
psql "postgres://postgres:postgres@127.0.0.1:54329/postgres?sslmode=disable"
```

Or use the URL from `.env`:

```sh
set -a; . ./.env; set +a
psql "$DATABASE_URL"
```

Example queries:

```sql
\dt

SELECT c.number, c.text AS commandment, q.position, q.text AS question
FROM commandment c
JOIN examination_question q ON q.commandment_id = c.id
ORDER BY c.number, q.position;
```

Notes:

- PGlite 0.6.0 reports itself as PostgreSQL 19. If your `psql` is older, it prints a version-mismatch warning in interactive mode. Basic queries and `\d` commands work. `pg_dump` won't work: it refuses to dump a server with a newer major version.
- You can also point GUI tools (TablePlus, DBeaver, pgAdmin) at the same URL. The server allows up to 10 concurrent connections.
- Only one process can open `./data/pgdata` at a time, so all access goes through `db:server`.

## Schema

```
commandment                     examination_question
-----------                     --------------------
id      integer PK (identity)   id             integer PK (identity)
number  integer UNIQUE (1-10)   commandment_id integer FK -> commandment.id (ON DELETE CASCADE)
text    text                    position       integer (>= 1), UNIQUE with commandment_id
                                text           text
```

It uses the Catholic numbering from the source document. The seed loads 10 commandments and 14 questions.

## Migrations

- Files are plain SQL in `db/migrations/`, named `NNNNN-description.sql`, and applied in order.
- **Forward-only.** pg-migrations has no down or rollback. Fix mistakes with a new migration. For local undo, use `npm run db:reset`.
- **Up migrations must be idempotent.** Use guarded statements such as `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`.
- Applied migrations are recorded in `atdatabases_migrations_applied`.

## Seed data

`db/seed.sql` is transcribed from the PDF word for word, with three normalizations: the small-caps "LORD" is written "Lord", the curly apostrophe (`’`) is kept, and words split by line-break hyphens are rejoined. It upserts with `ON CONFLICT ... DO UPDATE`. Rows removed from the file are **not** deleted from the database.

## Configuration

`.env` holds `DATABASE_URL` for the local PGlite server. It is committed because it only points at a local database with default credentials. Put real credentials in `.env.local` (git-ignored) or in the deployment environment.

## Source material

"A Brief Examination of Conscience Based on the Ten Commandments", © 2013 United States Conference of Catholic Bishops. The USCCB allows it to be duplicated without adaptation for non-commercial use.
