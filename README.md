# maria-api

Proof of concept: a read-only Fastify API for the Ten Commandments and the examination-of-conscience questions from the USCCB leaflet in [`docs/`](docs/Examination-of-Conscience-Ten-Commandments.pdf).

It uses TypeScript on Fastify with [Kysely](https://kysely.dev), and runs on [PGlite](https://pglite.dev) (Postgres in WebAssembly, data in `./data/pgdata`). `@electric-sql/pglite-socket` serves it over the Postgres wire protocol, so `psql` and `pg-migrations` connect as they would to a normal server. The SQL is plain Postgres and should run unchanged on a real server. Design notes: [`docs/research/fastify-demo-design-with-kysely.md`](docs/research/fastify-demo-design-with-kysely.md).

## Requirements

- Node.js (version in `engines` in `package.json`). It runs `.ts` directly, with no build step.
- `psql` on your `PATH` (macOS: `brew install libpq`, then add `/opt/homebrew/opt/libpq/bin` to `PATH`).

## Getting started

```sh
npm install

# Terminal 1: leave running
npm run db:serve

# Terminal 2
npm run db:migrate
npm run db:seed
echo 'API_KEY=dev-key' > .env.local   # once; git-ignored
npm run dev

curl -H 'x-api-key: dev-key' localhost:3000/api/commandments
```

## Where things live

This README doesn't repeat what the code already says. Look here instead:

| Topic                   | Source of truth                                                    |
| ----------------------- | ------------------------------------------------------------------ |
| Scripts                 | `scripts` in `package.json`. Names are grouped: `dev`/`start`, `test*`, `typecheck`/`lint*`, `db:*`. |
| Routes and status codes | `src/routes/` (JSON schemas included)                              |
| Error to status mapping | `src/errors.ts` and `src/error-handler.ts`                         |
| Schema                  | `db/migrations/` and the generated `src/db/db.d.ts`                |
| Seed data               | `db/seed.sql`                                                      |
| Environment variables   | `src/server.ts`, the only file that reads `process.env`            |

## Conventions

- **Layers:** `routes` (HTTP) call `services` (rules, no HTTP knowledge, throw `AppError`), which call `repositories` (the only Kysely code). Add use cases or a unit of work only when an operation needs several writes in one transaction.
- **Errors:** every error response, including unknown routes, is an [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) `application/problem+json`. Unexpected errors return a generic 500 with no message, stack or SQL.
- **Auth:** every `/api` route needs the `x-api-key` header.
- **JSON:** fields are camelCase (Kysely's `CamelCasePlugin`). `:number` in commandment routes is the commandment number, not the row `id`.
- **Tests:** `npm test` needs no running database. The whole-app test uses in-process PGlite.
- **Types:** run `npm run typecheck` as well, because Node strips types without checking them. After every migration, run `npm run db:types` and commit the result.

## Database

- **Migrations** are plain SQL in `db/migrations/`, named `NNNNN-description.sql`. They are forward-only: fix mistakes with a new migration, or run `npm run db:reset` locally. Write them idempotently (`IF NOT EXISTS`).
- **Seed** is transcribed word for word from the PDF. It upserts, so rows removed from `db/seed.sql` are **not** deleted from the database.
- **Access:** only one process can open `./data/pgdata`, so everything goes through `db:serve`. To use `psql`, run `set -a; . ./.env; set +a; psql "$DATABASE_URL"`.
- **PGlite caveat:** it reports a newer Postgres major version than a typical `psql`. An older `psql` may warn in interactive mode, and `pg_dump` won't work.

## Configuration

- `.env` (committed) holds `DATABASE_URL` for the local PGlite server.
- `.env.local` (git-ignored) holds `API_KEY` and any real credentials. It overrides `.env` under `npm run dev`.
- In a deployment, set the variables in the environment and run `npm start`.

## Source material

"A Brief Examination of Conscience Based on the Ten Commandments", © 2013 United States Conference of Catholic Bishops, which allows non-commercial duplication without adaptation.
