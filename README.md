# maria-schema

Proof of concept: a read-only Fastify API, plus the database behind it, for the Ten Commandments and the examination-of-conscience questions from the USCCB leaflet in [`docs/`](docs/Examination-of-Conscience-Ten-Commandments.pdf).

It runs on [PGlite](https://pglite.dev) (Postgres compiled to WebAssembly) and stores data in `./data/pgdata`. You don't need to install a Postgres server. [`@electric-sql/pglite-socket`](https://www.npmjs.com/package/@electric-sql/pglite-socket) serves the database over the Postgres wire protocol, so `psql` and [`@databases/pg-migrations`](https://www.atdatabases.org/docs/pg-migrations) can connect to it like a normal server. The plan is to move to a real Postgres server later. The migrations and seed are plain Postgres SQL, so they will run there unchanged.

The API is TypeScript on Fastify 5, with [Kysely](https://kysely.dev) for queries. It follows the design of the Fastify demo in `matteo-fastify/fastify-lessons/hands-on-exercise/demo`, with Kysely in place of Drizzle. See [`docs/research/fastify-demo-design-with-kysely.md`](docs/research/fastify-demo-design-with-kysely.md).

## Requirements

- Node.js 22.18+ (runs `.ts` files directly, with no build step)
- `psql` on your `PATH`. On macOS: `brew install libpq` and add `/opt/homebrew/opt/libpq/bin` to `PATH`.

## Getting started

```sh
npm install

# Terminal 1: start the database server and leave it running
npm run db:serve

# Terminal 2
npm run db:migrate
npm run db:seed
echo 'API_KEY=dev-key' > .env.local   # once; git-ignored
npm run dev                           # listens on PORT, default 3000

curl -H 'x-api-key: dev-key' localhost:3000/api/commandments
```

The server won't start without `DATABASE_URL` and `API_KEY`. It refuses to boot if the database is unreachable.

## Scripts

| Script | What it does |
|---|---|
| `db:serve` | Starts PGlite on `127.0.0.1:54329` with data in `./data/pgdata`. The other scripts need this running. |
| `db:migrate` | Applies pending migrations from `db/migrations/`. Already-applied migrations are skipped. |
| `db:seed` | Loads `db/seed.sql` in a single transaction. Safe to re-run: it updates text in place. |
| `db:reset` | Drops and recreates the `public` schema, then runs `db:migrate` and `db:seed`. The server keeps running. |
| `db:types` | Regenerates `src/db/db.d.ts` from the running database with `kysely-codegen`. Run it after every new migration and commit the result. |
| `dev` | Runs the API with `--watch`, loading `.env` then `.env.local`. Logs go through `pino-pretty`. |
| `start` | Runs the API without watch or pretty logs. The environment must already be set. |
| `test` | Runs every test with `node --test`. The tests start their own in-process PGlite, so `db:serve` doesn't need to be running. |
| `typecheck` | `tsc --noEmit`. Node strips types without checking them, so run this too. |

## Routes

Every route under `/api` needs the `x-api-key` header, or it gets a 401.

| Route | Calls | Status codes |
|---|---|---|
| `GET /health` | nothing | 200 |
| `GET /api/commandments` | `commandmentsService.listCommandments` | 200, 401 |
| `GET /api/commandments/:number` | `commandmentsService.getCommandment` | 200, 400 (not 1-10), 401, 404 |
| `GET /api/commandments/:number/questions` | `examinationQuestionsService.listQuestions` | 200, 400, 401, 404 |

`:number` is the commandment number (1-10), not the row `id`. JSON fields are camelCase (`commandmentId`, `questionPosition`) because of Kysely's `CamelCasePlugin`.

## Folders, top to bottom

| Folder | Role | Knows about HTTP? |
|---|---|---|
| `src/server.ts` | Reads the environment and calls `app.listen`. The only file that reads `process.env`. | yes |
| `src/app.ts`, `src/error-handler.ts` | `buildApp(options)`: plugins, the `/api` prefix and the error handler | yes |
| `src/routes/` | Routes and JSON schemas. The API-key check is in `api.ts`. | yes |
| `src/services/` | Rules and domain errors (`CommandmentNotFoundError` is a 404) | no |
| `src/repositories/` | The only Kysely code | no |
| `src/plugins/db.ts` | The db plugin (`fastify-plugin`): the `pg` pool and the `Kysely<DB>` instance | yes |
| `src/db/` | `db.d.ts` (generated) and `types.ts` (row types, `Conn`) | no |
| `db/` | SQL migrations and the seed | no |
| `test/` | Service tests with fake repositories, route tests with fake services, and a whole-app test against in-process PGlite | — |

There are no use cases or unit of work, because every route is a single read. Add them, as the demo does, when an operation needs several writes in one transaction.

## Connecting with psql

With `db:serve` running:

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

SELECT c.number, c.text AS commandment, q.question_position, q.text AS question
FROM commandments c
JOIN examination_questions q ON q.commandment_id = c.id
ORDER BY c.number, q.question_position;
```

Notes:

- PGlite 0.6.0 reports itself as PostgreSQL 19. If your `psql` is older, it prints a version-mismatch warning in interactive mode. Basic queries and `\d` commands work. `pg_dump` won't work: it refuses to dump a server with a newer major version.
- You can also point GUI tools (TablePlus, DBeaver, pgAdmin) at the same URL. The server allows up to 10 concurrent connections.
- Only one process can open `./data/pgdata` at a time, so all access goes through `db:serve`.

## Schema

```
commandments                    examination_questions
------------                    ---------------------
id      integer PK (identity)   id                integer PK (identity)
number  integer UNIQUE (1-10)   commandment_id    integer FK -> commandments.id (ON DELETE CASCADE)
text    text                    question_position integer (>= 1), UNIQUE with commandment_id
                                text              text
```

It uses the Catholic numbering from the source document. The seed loads 10 commandments and 14 questions.

## Migrations

- Files are plain SQL in `db/migrations/`, named `NNNNN-description.sql`, and applied in order.
- **Forward-only.** pg-migrations has no down or rollback. Fix mistakes with a new migration. For local undo, use `npm run db:reset`.
- **Up migrations must be idempotent.** Use guarded statements such as `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`.
- Applied migrations are recorded in `atdatabases_migrations_applied`.

## Seed data

`db/seed.sql` is transcribed from the PDF word for word. The small-caps "LORD" is written in capitals, apostrophes are plain ASCII (escaped as `''` in SQL), and words split by line-break hyphens are rejoined. It upserts with `ON CONFLICT ... DO UPDATE`. Rows removed from the file are **not** deleted from the database.

## Configuration

- `.env` holds `DATABASE_URL` for the local PGlite server. It is committed because it only points at a local database with default credentials.
- `.env.local` (git-ignored) holds `API_KEY` and any real credentials. `npm run dev` loads it after `.env`, so its values win.
- `PORT` sets the listen port (default 3000).
- In a deployment, set the variables in the environment and use `npm start`.

## Source material

"A Brief Examination of Conscience Based on the Ten Commandments", © 2013 United States Conference of Catholic Bishops. The USCCB allows it to be duplicated without adaptation for non-commercial use.
