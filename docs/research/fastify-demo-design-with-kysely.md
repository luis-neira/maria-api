# Applying the Fastify "books-api demo" design to maria-schema, with Kysely instead of Drizzle

Researched 2026-11-24. Nothing in either repo was changed. Updated the same day with the user's decisions (see [Decisions](#decisions)) and the target's current table, column and script names.

Path shorthands used in citations:

- `REF/` = `/Users/luis.neira/code/sandbox/learning/matteo-fastify/fastify-lessons/hands-on-exercise/demo/`
- `LESSONS/` = `/Users/luis.neira/code/sandbox/learning/matteo-fastify/fastify-lessons/`
- `TGT/` = `/Users/luis.neira/code/sandbox/learning/poc/maria-schema/`
- `kysely@0.29.9:<path>`, `kysely-codegen@0.20.0:<path>` and similar = a file inside the published npm tarball, fetched with `npm pack <pkg>@<ver>` from the configured registry.
- `TGT/node_modules/...` = installed package source in the target.

## Summary

- The reference is a TypeScript, ESM, no-build Fastify 5 app with five layers: `server.ts` (env, listen) → `app.ts` (`buildApp(options)`) → `routes/` (JSON Schema, HTTP only) → `use-cases/` (only for multi-write transactions, through a `UnitOfWork`) → `services/` (rules, domain errors with `statusCode`) → `repositories/` (the only ORM code, taking a `Conn`). A `fastify-plugin` db plugin owns the `pg` Pool (REF/README.md:24-36, LESSONS/reference/the-whole-app.html:38-48).
- Drizzle is confined to four places: `src/db/schema.ts`, `src/db/types.ts`, `src/plugins/db.ts` and `src/repositories/*`, plus `drizzle.config.ts`, `drizzle/` and the test migrator call. Everything above the repositories is ORM-agnostic, so the swap to Kysely is local to those files.
- **Kysely 0.29.9 ships its own `PGliteDialect`** (kysely@0.29.9:dist/dialect/pglite/pglite-dialect.js:30). `kysely-pglite-dialect` 1.4.0 says it is deprecated in favour of the built-in one, and its peer range stops at `@electric-sql/pglite ^0.5.0`, so it does not cover the target's 0.6.0 (`npm view kysely-pglite-dialect`, kysely-pglite-dialect@1.4.0:README.md:7-8). The reference does not use an in-process dialect in tests, though. It runs PGlite in-process behind `PGLiteSocketServer` so the app's real `pg` Pool code path is the thing under test (REF/test/app.test.ts:9-12). For parity, use `PostgresDialect` + `pg.Pool` everywhere and keep `PGliteDialect` as an option for repository-only tests.
- **Migrations: keep `@databases/pg-migrations` with plain SQL.** The target's forward-only, idempotent SQL rule (TGT/README.md:76-81) fits it better than either Drizzle Kit, whose generated SQL is not idempotent (REF/drizzle/0000_gray_starbolt.sql:1), or the Kysely Migrator, which uses TS `up`/`down` modules and does not detect edited migration files. pg-migrations does detect edits (`MigrationFileEditedError`, TGT/node_modules/@databases/migrations-base/lib/methods/validateMigrationsSequence.d.ts:3-4).
- **Types: generate with `kysely-codegen` 0.20.0** (decided) against the running `db:serve`, with `--camel-case` to match `CamelCasePlugin`. Pass `--exclude-pattern` for the `atdatabases_*` tables: Kysely's introspector only hides its own `kysely_migration*` tables (kysely@0.29.9:dist/dialect/postgres/postgres-introspector.js:61-64). Codegen emits `Generated<number>` for identity columns (kysely-codegen@0.20.0:dist/generator/transformer/transformer.js:267-269). For `GENERATED ALWAYS` columns, the hand-written `GeneratedAlways<number>` is stricter (kysely@0.29.9:dist/util/column-type.d.ts:57).
- `Transaction<DB> extends Kysely<DB>` (kysely@0.29.9:dist/kysely.d.ts:533), so the reference's `Db | Tx` union collapses to `type Conn = Kysely<DB>`. `db.transaction().execute(cb)` rolls back and rethrows when `cb` throws (kysely@0.29.9:dist/kysely.d.ts:140-147). That matches what the unit of work relies on.
- **Shutdown gotcha:** `Kysely.destroy()` ends the pool only if a Kysely query has already run. Otherwise it does nothing (kysely@0.29.9:dist/dialect/postgres/postgres-dialect-config.d.ts:45-53). Either keep the reference's `pool.end()` in `onClose` and never call `destroy()`, or send the boot ping through Kysely and call `destroy()`. Don't do both.
- Decided: TypeScript, ESM, pg-migrations, `kysely-codegen`, `CamelCasePlugin`, API key in `.env.local`, the API-key hook and `/api` prefix, no use cases or unit of work yet, and no seed in the whole-app test. Still to fix during the build: the test port clash (the reference tests bind 54329, the target's dev port) and which routes to expose.

## Reference design (with citations)

### Stack and tooling

| Item | Value | Source |
|---|---|---|
| Module system | `"type": "module"` | REF/package.json:3 |
| Node | `>=22.18` (type stripping on by default from v22.18.0) | REF/package.json:5, https://nodejs.org/api/typescript.html |
| Runtime deps | `drizzle-orm` 0.45.4, `fastify` 5.12.8, `fastify-plugin` 6.0.1, `pg` 8.23.1 | REF/package.json:16-21 |
| Dev deps | `@electric-sql/pglite` 0.6.0, `@electric-sql/pglite-socket` 0.3.0, `@types/node` 26.6.6, `@types/pg` 8.23.1, `drizzle-kit` 0.31.11, `pino-pretty` 13.2.0, `typescript` 7.0.2 | REF/package.json:22-30 |
| Scripts | `db` (pglite-server on 5433, `./.pgdata`), `db:generate`, `db:migrate` (drizzle-kit), `dev` (`node --watch src/server.ts \| pino-pretty`), `start`, `test` (`node --test`), `test:watch`, `typecheck` (`tsc --noEmit`) | REF/package.json:6-15 |
| tsconfig | `noEmit`, `strict`, `module: nodenext`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `allowImportingTsExtensions` | REF/tsconfig.json:2-11 |
| Lint/format | None. No eslint, prettier or neostandard config or dependency | REF/package.json (absent), file listing |
| Docker/compose | None. PGlite replaces Postgres in dev and tests | REF/README.md:9-20 |
| `.gitignore` | `node_modules/`, `.pgdata/` | REF/.gitignore:1-2 |
| Config | No `.env`. The README tells you to `export DATABASE_URL` and `API_KEY` | REF/README.md:13-14, 22 |

Intent from the course: TypeScript and ESM only, no build step, JSON Schema for validation and serialization, plugins/encapsulation/decorators, `inject()` + `node:test` (LESSONS/MISSION.md:7-14).

### Layers and rules

The folder table is REF/README.md:24-36. The layer and call rules are LESSONS/reference/the-whole-app.html:38-48 and LESSONS/reference/services-and-data.html:19-42.

1. **`src/server.ts`** is the only file that reads `process.env`. `required()` throws on a missing var. It builds the app with `logger: true` and listens on `PORT ?? 3000` (REF/src/server.ts:4-21; rule at REF/README.md:62).
2. **`src/app.ts`** exports `buildApp({ databaseUrl, apiKey, ...fastifyOpts })` and `AppOptions extends FastifyServerOptions`. It sets a root error handler, registers the `db` plugin and the `/api` routes, and adds `/health` outside `/api` (REF/src/app.ts:7-25).
3. **`src/error-handler.ts`**: a 5xx is logged and the client gets `"Something went wrong"`. A 4xx keeps the default `{statusCode, error, message}` shape (REF/src/error-handler.ts:5-16).
4. **`src/plugins/db.ts`** is wrapped in `fp` with `{ name: 'db' }`. It creates a `pg.Pool`, runs `select 1` so boot fails fast, decorates `db`, and ends the pool in `onClose`. A `declare module 'fastify'` block types the decorator (REF/src/plugins/db.ts:6-27). Migrations are "a deploy step, not in a plugin" (LESSONS/reference/services-and-data.html:96).
5. **`src/routes/`**:
   - `api.ts` adds an `onRequest` API-key hook for everything under `/api` (REF/src/routes/api.ts:8-17).
   - Feature plugins (`books.ts`, `reviews.ts`) are **not** wrapped in `fp`. They decorate their service or use case privately, with `opts.service ?? create...(app.db)` so tests can inject fakes (REF/src/routes/books.ts:18-23, 49-54; REF/src/routes/reviews.ts:12-24). Only these wiring lines touch `app.db` (LESSONS/reference/the-whole-app.html:48).
   - Schemas are inline JSON Schema `as const` objects, with `additionalProperties: false` on bodies. Route generics are typed by hand (`app.post<{ Body: NewBook }>`) with no type provider (REF/src/routes/books.ts:25-47, 65-81). The interface and schema are deliberately duplicated (LESSONS/NOTES.md:33).
6. **`src/use-cases/`** exists only for operations with more than one write. Each one calls `uow.run(async (repos) => ...)` and builds services from the transaction's repos inside `run` (REF/src/use-cases/add-and-lend.ts:7-14; REF/src/use-cases/lend-book.ts:6-11; rule at LESSONS/reference/services-and-data.html:37).
7. **`src/services/`** are factory functions with no Fastify or ORM imports. Domain errors are classes with a `statusCode` field. The exported type is `ReturnType<typeof create...>` (REF/src/services/books-service.ts:5-36).
8. **`src/repositories/`** export an interface ("says nothing about SQL") plus a factory that takes a `Conn`. This is "the only Drizzle code" (REF/src/repositories/books-repository.ts:5-31). Insert conflicts use `ON CONFLICT DO NOTHING` rather than catching `23505`, which would abort the surrounding transaction (REF/src/repositories/loans-repository.ts:12-17; REF/README.md:58).
9. **`src/db/`**:
   - `schema.ts`: Drizzle tables plus `$inferSelect`/`$inferInsert` row types (REF/src/db/schema.ts:3-27).
   - `types.ts`: `Db`, `Tx`, `Conn = Db | Tx` (REF/src/db/types.ts:4-10).
   - `unit-of-work.ts`: `Repos`, `makeRepos(conn)`, `UnitOfWork.run`, implemented with `db.transaction` (REF/src/db/unit-of-work.ts:5-23).

### DB tooling (Drizzle-specific)

- `drizzle.config.ts`: dialect `postgresql`, schema `./src/db/schema.ts`, out `./drizzle`, URL from `DATABASE_URL` (REF/drizzle.config.ts:3-8).
- `drizzle/`: generated SQL, committed, plus `meta/_journal.json` and snapshots (REF/drizzle/meta/_journal.json:1-27). The generated SQL is plain `CREATE TABLE` with no `IF NOT EXISTS` (REF/drizzle/0000_gray_starbolt.sql:1; REF/drizzle/0001_cheerful_prowler.sql:1,7).
- No seed mechanism in the reference.

### Tests (38 tests, `node --test`)

Three layers (LESSONS/reference/services-and-data.html:98-103):

- **Service** with a fake in-memory repository (REF/test/books-service.test.ts:8-20; REF/test/loans-service.test.ts:7-18; REF/test/reviews-service.test.ts).
- **Use case** with fake repos and a fake `UnitOfWork` `{ run: (work) => work(repos) }` (REF/test/add-and-lend.test.ts:9-25; REF/test/lend-book.test.ts:7-23).
- **Routes** on a bare `Fastify()` with `{ service: fake }`, including a check that the decorator stays private (`hasDecorator` false) (REF/test/books-routes.test.ts:11-44).
- **Whole app**: one in-process `PGlite` behind a `PGLiteSocketServer` on **port 54329** with `maxConnections: 20`. `before()` runs `drizzle-orm`'s `migrate` over `pg`, `beforeEach` runs `TRUNCATE reviews, loans, books RESTART IDENTITY`, and `after()` stops the server and closes PGlite. Each test builds its own app with `buildApp` and closes it in `t.after` (REF/test/app.test.ts:9-36). Further tests cover boot failing fast against an unreachable DB (REF/test/app.test.ts:140-143), the DB constraint via `pglite.exec` (REF/test/app.test.ts:213-220), and 500 masking with a captured log stream (REF/test/app.test.ts:222-232).

Known limits the reference states: PGlite serializes transactions, so the race is untested, and nothing has run against real Postgres (REF/README.md:64-68). The socket server's multiplexer confirms this. It routes queries from the handler that holds an open transaction first and runs each one under `runExclusive` (TGT/node_modules/@electric-sql/pglite-socket/dist/chunk-4D4OME7M.js:1, class `d.processQueue`; pglite-socket README.md:12, 288).

## Drizzle→Kysely mapping

| Reference (Drizzle) | Kysely equivalent | Source |
|---|---|---|
| `drizzle-orm/node-postgres` `drizzle({ client: pool, schema })` (REF/src/plugins/db.ts:20) | `new Kysely<DB>({ dialect: new PostgresDialect({ pool }) })` | https://kysely.dev/docs/getting-started (Postgres tab); kysely@0.29.9:dist/dialect/postgres/postgres-dialect-config.d.ts:20-28,57 |
| `pool.end()` in `onClose` (REF/src/plugins/db.ts:22-24) | Keep `pool.end()` and don't call `db.destroy()`. Or ping with ``sql`select 1`.execute(db)`` and call `db.destroy()`. `destroy()` is a no-op if Kysely never initialized its driver | kysely@0.29.9:dist/dialect/postgres/postgres-dialect-config.d.ts:45-53 |
| `pgTable(...)` in `schema.ts` + `$inferSelect`/`$inferInsert` (REF/src/db/schema.ts) | A `DB` interface of table interfaces. Row types are `Selectable<T>`, `Insertable<T>`, `Updateable<T>`. DB-generated columns use `Generated<T>` or `GeneratedAlways<T>` | https://kysely.dev/docs/getting-started ("Columns that are generated by the database should be marked using the `Generated` type"); kysely@0.29.9:dist/util/column-type.d.ts:51,57 |
| Schema is the source of truth, SQL is generated from it | Reversed: the SQL migrations are the source of truth, and types are hand-written or introspected from the live DB | https://kysely.dev/docs/generating-types |
| `type Db = NodePgDatabase<typeof schema>`, `Tx = Parameters<...>`, `Conn = Db \| Tx` (REF/src/db/types.ts) | `type Conn = Kysely<DB>`, because `Transaction<DB> extends Kysely<DB>` | kysely@0.29.9:dist/kysely.d.ts:533 |
| `db.transaction((tx) => ...)` (REF/src/db/unit-of-work.ts:21) | `db.transaction().execute((trx) => ...)`. A throw means rollback and rethrow. Otherwise it commits | kysely@0.29.9:dist/kysely.d.ts:140-147, 208 |
| `db.select().from(t).where(eq(t.id, id))` → `[row]` | `db.selectFrom('t').selectAll().where('id', '=', id).executeTakeFirst()` (returns `undefined` when there's no row) | kysely@0.29.9:dist/query-builder/select-query-builder.d.ts:52, 2280 |
| `db.insert(t).values(v).returning()` | `db.insertInto('t').values(v).returningAll().executeTakeFirstOrThrow()` | kysely-codegen@0.20.0:README.md:132-140 (example); kysely API docs |
| `.onConflictDoNothing({ target })` (REF/src/repositories/loans-repository.ts:15) | `.onConflict((oc) => oc.column('x').doNothing())` | kysely@0.29.9:dist/query-builder/insert-query-builder.d.ts:558-639 |
| `db.$count(t)` | `selectFrom('t').select((eb) => eb.fn.countAll().as('n'))`. `pg` returns `count(*)` (int8) as a string by default, so cast or `Number()` it | https://node-postgres.com/features/types (UNVERIFIED for this exact version, not re-read) |
| camelCase TS ↔ snake_case columns (`bookId: integer('book_id')`, REF/src/db/schema.ts:12) | Either keep snake_case in TS (`commandment_id`), or add `CamelCasePlugin` to the Kysely instance and generate with `kysely-codegen --camel-case` | kysely@0.29.9:dist/index.d.ts (exports `CamelCasePlugin`); kysely-codegen@0.20.0:README.md:160 |
| `drizzle.config.ts` + `drizzle-kit generate` / `migrate` | No equivalent needed. Keep `pg-migrations apply` (see the migrations section). Optional `.kysely-codegenrc.json` for codegen | kysely-codegen@0.20.0:README.md:370-399 |
| `drizzle/` (generated, committed) | `db/migrations/*.sql` (hand-written, already exists) | TGT/db/migrations/ |
| Test: `migrate(drizzle(url), { migrationsFolder })` (REF/test/app.test.ts:23-25) | `applyMigrations({ connection: connect(url), migrationsDirectory: 'db/migrations' })` from `@databases/pg-migrations`, or `pglite.exec()` each `.sql` file in order | TGT/node_modules/@databases/pg-migrations/lib/index.js:4-16; TGT/node_modules/@databases/migrations-base/lib/getPublicApi.d.ts:5-8. Running it programmatically against pglite-socket is UNVERIFIED. The CLI is documented as working (TGT/README.md:5) |

### Dialect options

1. **`PostgresDialect` + `pg.Pool` → pglite-socket** (recommended for app, dev and whole-app tests). This is the same network path the reference uses, and the same code works unchanged on real Postgres later (TGT/README.md:5). It needs `--max-connections` > 1 because the pool opens several connections. The pglite-socket default is 1 (pglite-socket README.md:167, 296; LESSONS/lessons/0005-services-and-repositories.html, "--max-connections defaults to 1, and the app's pool needs more than that").
2. **Kysely's built-in `PGliteDialect`**, in-process with no socket. `new PGliteDialect({ pglite: new PGlite() })`, where `pglite` can also be a factory (kysely@0.29.9:dist/dialect/pglite/pglite-dialect.js:6-29; config at dist/dialect/pglite/pglite-dialect-config.d.ts). `destroy()` calls `pglite.close()` once initialized (same file). This suits fast repository tests. It does not exercise the `pg` driver or the db plugin, so it can't replace the whole-app test.
3. Third-party: `kysely-pglite-dialect` 1.4.0 is deprecated, says to use the built-in one, and has a peer range of `@electric-sql/pglite ^0.2.0 … ^0.5.0`, which excludes 0.6.0 (`npm view kysely-pglite-dialect peerDependencies`; kysely-pglite-dialect@1.4.0:README.md:7-8). `kysely-pglite` 0.6.1 (github.com/dnlsandiego/kysely-pglite) has a dialect plus a CLI that generates types from Kysely TS migrations or a persisted PGlite dir. Its peers are `*` (kysely-pglite@0.6.1:package.json; README.md). It isn't needed, given option 2 and the SQL migrations.

### Type generation options

- **Hand-written `DB`** in `src/db/types.ts`. Two tables make it cheap, and it lets you use `GeneratedAlways<number>` for `id integer GENERATED ALWAYS AS IDENTITY` (TGT/db/migrations/00001-create-commandments.sql:2), so TS forbids inserting an id, which Postgres would reject anyway. This matches the reference's "types next to the db code" placement.
- **`kysely-codegen` 0.20.0** (peers `kysely >=0.27 <1`, `pg >=8.8 <9`, Node >=20; `npm view kysely-codegen`). It connects to a live DB, by default through `env(DATABASE_URL)`, and supports `--env-file`, `--out-file`, `--dialect postgres` and `--exclude-pattern` (kysely-codegen@0.20.0:README.md:38-56, 105, 227-233, 281-283, 362-364). The default output is inside `node_modules`, so set `--out-file src/db/db.d.ts` and commit it. The Kysely docs note PGlite isn't a CLI dialect, but that doesn't matter here because codegen reaches PGlite over the socket as plain `postgres` (https://kysely.dev/docs/generating-types). Gaps: identity columns become `Generated<number>`, not `GeneratedAlways` (kysely-codegen@0.20.0:dist/generator/transformer/transformer.js:267-269), and the `atdatabases_migrations_applied` and `atdatabases_migrations_version` tables (TGT/node_modules/@databases/pg-migrations/lib/index.js:10) get typed unless excluded.
- `kysely-typegen` 2.1.0 (programmatic, peer `kysely >=0.29.0`) and `kanel-kysely` 4.0.1 also exist (`npm view`). Both are listed on https://kysely.dev/docs/generating-types. Neither was evaluated further.

### Migrations: pg-migrations vs Kysely Migrator

| | `@databases/pg-migrations` 6.0.0 (current) | Kysely `Migrator` (`kysely/migration`) |
|---|---|---|
| File format | `NNNNN-name.sql` (also `.js`/`.ts`), index from the `^(\d+)-` prefix | TS/JS modules exporting `up` (and optional `down`), name = filename, alphanumeric order |
| Forward-only | No down at all (TGT/README.md:78) | `down` optional, "skipped when migrating down" (kysely@0.29.9:dist/migration/migrator.d.ts:7-16) |
| Edited-file detection | Yes, `MigrationFileEditedError`, plus missing and order-change errors | No content check. It only checks that names are present and in order ("corrupted migrations") (kysely@0.29.9:dist/migration/migrator.js:517-533) |
| Transaction | Runs in a transaction (`tx.query` in TGT/node_modules/@databases/pg-migrations/lib/PostgresDatabaseEngine.js:56-130) | Per-run transaction when the dialect supports transactional DDL, unless `disableTransactions` (kysely@0.29.9:dist/migration/migrator.js:434-447) |
| Tracking tables | `atdatabases_migrations_applied`, `atdatabases_migrations_version` | `kysely_migration`, `kysely_migration_lock` (kysely@0.29.9:dist/migration/migrator.d.ts:2-3) |
| Plain SQL stays portable to real Postgres | Yes, and it is psql-runnable | Only if each `up` wraps raw ``sql`...` ``. The docs say migrations take `Kysely<any>`, so they are untyped anyway (https://kysely.dev/docs/migrations) |
| CLI | `pg-migrations apply` (already wired) | Write a script, or use `kysely-ctl` 0.22.0 (peer `kysely >=0.18.1 <0.30.0`, Node >=22). The docs call it "not part of the core, and your mileage may vary" (https://kysely.dev/docs/migrations) |

Sources for the pg-migrations column: TGT/node_modules/@databases/migrations-base/lib/methods/readMigrationsDir.js:7-29 (file format); TGT/node_modules/@databases/migrations-base/lib/methods/validateMigrationsSequence.d.ts:3-5 (edited-file detection); TGT/node_modules/@databases/pg-migrations/lib/index.js:10 (tracking tables).

**Recommendation:** keep pg-migrations. It enforces the target's forward-only rule natively and catches edited files, which is the failure the forward-only rule exists to prevent. The SQL stays the source of truth. Kysely only has to read the tables, which the reference also enforces ("the only Drizzle code" lives in repositories). Switching to the Kysely Migrator would add a `down` concept you'd have to ban by convention, lose edit detection, and need a second tracking table. Because the up migrations are idempotent, re-running them under a new tracker would be harmless, so switching later stays cheap.

### Query layer and the plugin/decorator pattern

Unchanged in shape: `fp` db plugin at the root, feature plugins without `fp` that decorate their service privately, and `opts.service ?? create...(app.db)` for test injection. Only the decorator type changes:

```ts
// src/plugins/db.ts (sketch)
import fp from 'fastify-plugin'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { DB } from '../db/types.ts'

declare module 'fastify' {
  interface FastifyInstance { db: Kysely<DB> }
}

export default fp<{ connectionString: string }>(async (app, opts) => {
  const pool = new Pool({ connectionString: opts.connectionString })
  await pool.query('select 1')                     // fail at boot
  app.decorate('db', new Kysely<DB>({ dialect: new PostgresDialect({ pool }) }))
  app.addHook('onClose', async () => { await pool.end() })   // not db.destroy(): see Summary
}, { name: 'db' })
```

```ts
// src/db/types.ts (sketch of the hand-written variant, not chosen: codegen with --camel-case
// produces the equivalent in src/db/db.d.ts, with Generated<number> instead of GeneratedAlways)
import type { GeneratedAlways, Insertable, Kysely, Selectable } from 'kysely'

export interface CommandmentsTable { id: GeneratedAlways<number>; number: number; text: string }
export interface ExaminationQuestionsTable {
  id: GeneratedAlways<number>; commandmentId: number; questionPosition: number; text: string   // CamelCasePlugin
}
export interface DB { commandments: CommandmentsTable; examination_questions: ExaminationQuestionsTable }

export type Commandment = Selectable<CommandmentsTable>
export type NewCommandment = Insertable<CommandmentsTable>
export type Conn = Kysely<DB>   // a Transaction<DB> is a Kysely<DB>
```

`UnitOfWork.run` becomes `(work) => db.transaction().execute((trx) => work(makeRepos(trx)))`. The target's data is read-only reference data loaded by `db:seed`, so nothing may need a use case or unit of work yet. The reference adds them only for multi-write operations (LESSONS/reference/the-whole-app.html:38).

### Testing setup

- **Service, use-case and route tests** carry over as-is, since they never touch the ORM (REF/test/books-service.test.ts, REF/test/add-and-lend.test.ts, REF/test/books-routes.test.ts).
- **Whole-app test** follows the REF/test/app.test.ts:9-36 shape with these changes:
  - Bind `PGLiteSocketServer` to **port 0** and read the real address from `server.getServerConn()` after `start()`. Port 0 is supported, and `start()` stores the OS-assigned port (pglite-socket README.md:61; TGT/node_modules/@electric-sql/pglite-socket/dist/chunk-4D4OME7M.js:1, class `f.start`, `this.port=n.port`). This avoids clashing with `db:serve` on 54329.
  - Apply `db/migrations/*.sql` in `before()` with pg-migrations' `applyMigrations` (UNVERIFIED programmatically), or with `pglite.exec(readFileSync(f))` per file in name order. The second option skips tracking, but tests don't need it.
  - Don't load `db/seed.sql` (decided). Tests insert their own rows.
  - `beforeEach`: `TRUNCATE examination_questions, commandments RESTART IDENTITY`. All FK-linked tables must go in one command (LESSONS/NOTES.md:31, experiment B).
- **Optional repository tests** against `new Kysely<DB>({ dialect: new PGliteDialect({ pglite: new PGlite() }) })`, with no socket.
- Test runner: `node --test` (REF/package.json:12).

## Proposed target layout

```
maria-schema/
├── package.json            # + "type": "module", engines, new scripts and deps
├── tsconfig.json           # copy of REF/tsconfig.json; include ["src", "test"]
├── .env                    # unchanged (DATABASE_URL only); API_KEY goes in .env.local
├── .gitignore              # unchanged (node_modules/, data/, .env.local)
├── README.md               # + app/test sections
├── db/
│   ├── migrations/         # unchanged: NNNNN-*.sql, forward-only, idempotent
│   └── seed.sql            # unchanged
├── docs/
│   ├── Examination-of-Conscience-Ten-Commandments.pdf
│   └── research/fastify-demo-design-with-kysely.md
├── src/
│   ├── server.ts           # only reader of process.env (DATABASE_URL, PORT, API_KEY?)
│   ├── app.ts              # buildApp(options)
│   ├── error-handler.ts    # copied from REF
│   ├── plugins/db.ts       # fp: pg Pool + Kysely<DB>
│   ├── db/
│   │   ├── types.ts        # re-exports DB from db.d.ts; row types; Conn
│   │   ├── db.d.ts         # generated by kysely-codegen (npm run db:types), committed
│   │   └── unit-of-work.ts # only when a multi-write operation appears
│   ├── routes/
│   │   ├── api.ts          # /api prefix + API-key hook
│   │   └── commandments.ts # e.g. GET /, GET /:number, GET /:number/questions (illustrative)
│   ├── services/commandments-service.ts       # CommandmentNotFoundError (404)
│   └── repositories/
│       ├── commandments-repository.ts         # the only Kysely code
│       └── examination-questions-repository.ts
└── test/
    ├── app.test.ts                   # PGlite + PGLiteSocketServer(port 0) + SQL migrations
    ├── commandments-routes.test.ts   # bare Fastify + fake service
    └── commandments-service.test.ts  # fake repository
```

| Reference | Target |
|---|---|
| REF/src/server.ts, app.ts, error-handler.ts | same paths, copied nearly verbatim |
| REF/src/plugins/db.ts (Drizzle) | src/plugins/db.ts (Kysely + PostgresDialect) |
| REF/src/db/schema.ts | gone. Tables live in db/migrations/*.sql, TS shapes are generated into src/db/db.d.ts |
| REF/src/db/types.ts (`Db/Tx/Conn`) | src/db/types.ts (`DB`, row types, `Conn = Kysely<DB>`) |
| REF/src/db/unit-of-work.ts | same, using `transaction().execute`, deferred until needed |
| REF/src/routes, services, repositories | same pattern, commandments/questions domain |
| REF/drizzle.config.ts, drizzle/ | none. The `db:types` script (or .kysely-codegenrc.json) configures codegen |
| REF `db` script on 5433 + `./.pgdata` | existing `db:serve` on 54329 + `./data/pgdata` |
| REF `db:migrate` (drizzle-kit) | existing `db:migrate` (pg-migrations) |
| (no seed in REF) | existing `db:seed`, `db:reset` |

## Dependencies

All versions are `dist-tags.latest` from `npm view` on 2026-11-24 and match the reference where the reference has the package.

| Package | Version | Type | Note |
|---|---|---|---|
| `fastify` | 5.12.8 | dep | same as REF/package.json:18 |
| `fastify-plugin` | 6.0.1 | dep | same as REF/package.json:19 |
| `kysely` | 0.29.9 | dep | ESM (`"type": "module"`), `engines.node >=22.0.0`, includes `PGliteDialect` (kysely@0.29.9:package.json) |
| `pg` | 8.23.1 | dep | same as REF/package.json:20 |
| `@databases/pg-migrations` | 6.0.0 | dep → consider dev | already in TGT/package.json:16 |
| `@electric-sql/pglite` | 0.6.0 | dev (REF) / dep (TGT today) | already in TGT/package.json:17 |
| `@electric-sql/pglite-socket` | 0.3.0 | dev (REF) / dep (TGT today) | peer `@electric-sql/pglite 0.6.0` exact (`npm view`) |
| `typescript` | 7.0.2 | dev | same as REF/package.json:29, for `tsc --noEmit` only |
| `@types/pg` | 8.23.1 | dev | same as REF |
| `@types/node` | 26.6.6 (REF) or 22.20.5 | dev | REF pairs 26.x types with a Node 22 runtime. `@types/node@22` latest is 22.20.5 (`npm view @types/node@22 version`) |
| `pino-pretty` | 13.2.0 | dev | for `npm run dev` |
| `kysely-codegen` | 0.20.0 | dev | generates src/db/db.d.ts (decided) |

Not recommended: `kysely-pglite-dialect` (deprecated, excludes pglite 0.6), `kysely-pglite` (redundant), `kysely-ctl` (only with the Kysely Migrator).

## Scripts

Keep the existing four unchanged (TGT/package.json:8-13) and add the reference's app scripts (REF/package.json:10-14):

```jsonc
"db:serve":   "pglite-server --db=./data/pgdata --port=54329 --max-connections=10",   // existing
"db:migrate": "node --env-file=.env node_modules/.bin/pg-migrations apply -D db/migrations", // existing
"db:seed":    "...psql ... -f db/seed.sql",                                             // existing
"db:reset":   "...DROP SCHEMA public CASCADE ... && npm run db:migrate && npm run db:seed", // existing
"db:types":   "kysely-codegen --env-file .env --dialect postgres --camel-case --out-file src/db/db.d.ts --exclude-pattern 'public.atdatabases_*'", // pattern syntax UNVERIFIED
"dev":        "node --env-file=.env --watch src/server.ts | pino-pretty",
"start":      "node src/server.ts",
"test":       "node --test",
"test:watch": "node --test --watch",
"typecheck":  "tsc --noEmit"
```

`--env-file` on `dev` is a target addition. The reference exports vars by hand instead (REF/README.md:13-14).

## Decisions

1. **TypeScript or plain JS.** **Decided: TypeScript.** The reference is TS-only by mission (LESSONS/MISSION.md:13-14). Its whole type-safety story (`declare module 'fastify'`, `Selectable<…>`, `ReturnType<typeof create…>`) and most of Kysely's value need TS. Plain JS + JSDoc works at runtime but loses most of what Kysely adds. Node 22.18+ runs `.ts` without a build (https://nodejs.org/api/typescript.html). Imports must then use `.ts` extensions, and enums and namespaces with runtime code are not allowed (same page; enforced by `erasableSyntaxOnly` in REF/tsconfig.json:8). Local Node is v22.23.0. Pin `engines.node >=22.18`.
2. **ESM.** **Decided: ESM.** The target has no `"type"` field (TGT/package.json), so it is CommonJS. The reference is ESM (REF/package.json:3), and Kysely is ESM. Adding `"type": "module"` does not affect the SQL or psql scripts.
3. **Migrations tool.** **Decided: keep pg-migrations.** Keep pg-migrations (recommended above) or move to the Kysely Migrator. The latter clashes with forward-only (optional `down`) and has no edit detection.
4. **Types: hand-written vs `kysely-codegen`.** **Decided: `kysely-codegen`.** Hand-written is simpler for two tables and allows `GeneratedAlways`. Codegen needs `db:serve` running and the `atdatabases_*` exclusion, and emits the looser `Generated`.
5. **`.env` handling.** **Decided: `API_KEY` stays out of the committed `.env`; use `.env.local`.** The reference forbids reading `process.env` outside `server.ts` and has no `.env` (REF/README.md:62; REF/src/server.ts:4-14). The target commits `.env` with a local-only URL and keeps secrets in `.env.local` (TGT/README.md:92-94; TGT/.gitignore:3). Both can coexist: `server.ts` still reads only env, and the `dev` script loads it with `node --env-file=.env`. If `API_KEY` is adopted, it must **not** go in the committed `.env`. Use `.env.local` and a second `--env-file`. Whether `--env-file-if-exists` is available on Node 22 is UNVERIFIED.
6. **API key and `/api` prefix.** **Decided: yes, adopt both.** The reference requires `x-api-key` on `/api` (REF/src/routes/api.ts:10-14). Read-only public reference data may not need it.
7. **Test port clash.** **Open.** Fix during the build as described. REF/test/app.test.ts:11 hardcodes 54329, which is the target's `db:serve` port (TGT/package.json:9). Use port 0 + `getServerConn()`.
8. **What the API exposes.** **Decided: no use cases or unit of work yet.** The routes are still to be chosen. The target has only two read-mostly tables and a seed. Decide the routes, and whether writes exist at all. Without writes there are no use cases or unit of work. Keep `unit-of-work.ts` out until a multi-write operation exists, as the reference does (LESSONS/reference/the-whole-app.html:38).
9. **Naming in TS.** **Decided: `CamelCasePlugin`**, with `kysely-codegen --camel-case`. Keep snake_case columns (`commandment_id`, `question_position`), or use `CamelCasePlugin` like the reference's camelCase fields (REF/src/db/schema.ts:12). The plugin changes every query's column names, and codegen has to match it with `--camel-case`.
10. **Lint/format.** **No action.** The reference has none, so there's nothing to copy.
11. **Seed in tests.** **Decided: no.** The whole-app test inserts its own rows. The reference has no seed. Decide whether the whole-app test loads `db/seed.sql` (it's idempotent, so it can be run twice to prove that) or inserts its own rows.
12. **Discrepancies found in the target while reading.** **Resolved.** The first draft of this note used stale names from the research brief. The target's actual names are now used throughout: the `db:serve` script (TGT/package.json:9); the `commandments` and `examination_questions` tables with a `question_position` column (TGT/db/migrations/00001-create-commandments.sql, TGT/db/migrations/00002-create-examination-questions.sql); and a seed that writes `LORD` with straight apostrophes (TGT/db/seed.sql:7-9). The README has been updated to match. `TGT/.git` exists with one commit.

## Sources

Local files (read in full unless noted):

- REF: package.json, tsconfig.json, drizzle.config.ts, .gitignore, README.md, src/{server,app,error-handler}.ts, src/plugins/db.ts, src/db/{schema,types,unit-of-work}.ts, src/routes/{api,books,reviews}.ts, src/services/*.ts, src/repositories/*.ts, src/use-cases/*.ts, test/*.ts, drizzle/*.sql, drizzle/meta/_journal.json
- LESSONS: MISSION.md, NOTES.md, reference/{the-whole-app,services-and-data,architecture}.html, lessons/0005-services-and-repositories.html (excerpts)
- TGT: package.json, .env, .gitignore, README.md, db/migrations/*.sql, db/seed.sql
- TGT/node_modules/@databases/{pg-migrations,migrations-base}/lib/* (excerpts), TGT/node_modules/@electric-sql/pglite-socket/{README.md,dist/index.d.ts,dist/chunk-4D4OME7M.js}

npm tarballs (`npm pack`, registry = configured company feed):

- kysely@0.29.9: package.json, README.md, dist/kysely.d.ts, dist/index.d.ts, dist/dialect/pglite/*, dist/dialect/postgres/{postgres-dialect-config.d.ts,postgres-introspector.js}, dist/migration/*, dist/util/column-type.d.ts, dist/query-builder/*
- kysely-codegen@0.20.0: README.md, dist/generator/transformer/transformer.js
- kysely-pglite-dialect@1.4.0: README.md
- kysely-pglite@0.6.1: package.json, README.md

`npm view` (version, peerDependencies, engines): kysely, kysely-codegen, kysely-pglite-dialect, kysely-pglite, kysely-ctl, kysely-typegen, kanel-kysely, @electric-sql/pglite, @electric-sql/pglite-socket, pg, @types/pg, fastify, fastify-plugin, @databases/pg-migrations, typescript, @types/node, pino-pretty

Web (fetched 2026-11-24):

- https://kysely.dev/docs/getting-started?dialect=pglite
- https://kysely.dev/docs/migrations
- https://kysely.dev/docs/generating-types
- https://nodejs.org/api/typescript.html

Cited but not re-fetched for this note (taken from the reference's own source lists): https://fastify.dev/docs/latest/Reference/Decorators/, https://fastify.dev/docs/latest/Reference/Encapsulation/, https://github.com/fastify/fastify-plugin, https://node-postgres.com/features/types (UNVERIFIED for int8-as-string in pg 8.23.1).
