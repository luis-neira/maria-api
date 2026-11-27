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
		await pool.query("select 1"); // fail at boot, not on the first request

		// CamelCasePlugin: question_position in SQL is questionPosition in TypeScript
		app.decorate(
			"db",
			new Kysely<DB>({
				dialect: new PostgresDialect({ pool }),
				plugins: [new CamelCasePlugin()],
			}),
		);

		// pool.end(), not db.destroy(): destroy() does nothing if no Kysely query has run yet
		app.addHook("onClose", async () => {
			await pool.end();
		});
	},
	{ name: "db" },
);

export default db;
