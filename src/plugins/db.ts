import fp from "fastify-plugin";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { DB } from "#db/types.ts";

declare module "fastify" {
	interface FastifyInstance {
		db: Kysely<DB>;
	}
}

export interface DbOptions {
	connectionString: string;
}

const db = fp<DbOptions>(
	async (app, opts) => {
		const pool = new Pool({ connectionString: opts.connectionString });
		try {
			await pool.query("select 1"); // fail at boot, not on the first request

			// CamelCasePlugin: question_position in SQL is questionPosition in TypeScript
			app.decorate(
				"db",
				new Kysely<DB>({
					dialect: new PostgresDialect({ pool }),
					plugins: [new CamelCasePlugin()],
				}),
			);

			// End the pool directly because boot can open connections before Kysely runs a query.
			app.addHook("onClose", async () => {
				await pool.end();
			});
		} catch (err) {
			try {
				await pool.end();
			} catch (cleanupErr) {
				app.log.error(
					{ err: cleanupErr },
					"failed to close database pool after boot error",
				);
			}
			throw err;
		}
	},
	{ name: "db" },
);

export default db;
