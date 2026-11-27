import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { getDefaultResultOrder } from "node:dns";
import { once } from "node:events";
import { createConnection, createServer, type Server } from "node:net";
import { test } from "node:test";
import { promisify } from "node:util";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const execFileAsync = promisify(execFile);

function portOf(server: Server) {
	const address = server.address();
	assert.ok(address && typeof address !== "string");
	return address.port;
}

test("an occupied HTTP port reports the bind error and closes PostgreSQL connections", async (t) => {
	const occupied = createServer().listen(0, "localhost");
	await once(occupied, "listening");
	t.after(() => occupied[Symbol.asyncDispose]());

	const db = new PGlite();
	const postgres = new PGLiteSocketServer({ db, port: 0 });
	t.after(async () => {
		try {
			await postgres.stop();
		} finally {
			await db.close();
		}
	});
	await postgres.start();
	const databasePort = Number(
		new URL(`tcp://${postgres.getServerConn()}`).port,
	);

	// A TCP close also happens on process exit. A PostgreSQL Terminate message
	// (type X, length 4) shows the client explicitly closed the connection.
	const terminate = Buffer.from([0x58, 0, 0, 0, 4]);
	const connections: Promise<Buffer>[] = [];
	const proxy = createServer((client) => {
		const upstream = createConnection(databasePort, "127.0.0.1");
		let tail = Buffer.alloc(0);
		client.on("data", (chunk: Buffer) => {
			tail = Buffer.concat([tail, chunk]).subarray(-terminate.length);
		});
		client.on("error", () => upstream.destroy());
		upstream.on("error", () => client.destroy());
		connections.push(
			new Promise((resolve) => client.once("close", () => resolve(tail))),
		);
		client.pipe(upstream).pipe(client);
	}).listen(0, "127.0.0.1");
	await once(proxy, "listening");
	t.after(() => proxy[Symbol.asyncDispose]());

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[`--dns-result-order=${getDefaultResultOrder()}`, "src/server.ts"],
			{
				env: {
					...process.env,
					API_KEY: "test-key",
					DATABASE_URL: `postgres://postgres@127.0.0.1:${portOf(proxy)}/postgres?sslmode=disable`,
					PORT: String(portOf(occupied)),
				},
				timeout: 10_000,
				killSignal: "SIGKILL",
			},
		),
		{ code: 1, stdout: /"code":"EADDRINUSE"/ },
	);
	assert.ok(connections.length > 0, "startup acquired a database connection");
	for (const message of await Promise.all(connections)) {
		assert.deepEqual(message, terminate);
	}
});
