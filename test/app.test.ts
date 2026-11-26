import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { applyMigrations, connect } from "@databases/pg-migrations";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { type AppOptions, buildApp } from "../src/app.ts";
import { AppError, type ErrorCode } from "../src/errors.ts";

// A real Postgres (compiled to WASM) in this process, reached over a socket by pg.
// Port 0: the OS picks a free port, so this never clashes with `npm run db:serve` on 54329.
const pglite = new PGlite();
const server = new PGLiteSocketServer({
	db: pglite,
	port: 0,
	maxConnections: 20,
});
let databaseUrl = "";
const apiKey = "test-key";
const headers = { "x-api-key": apiKey };

// The same options server.ts would build from the environment
function createApp(opts: Partial<AppOptions> = {}) {
	return buildApp({ databaseUrl, apiKey, ...opts });
}

before(async () => {
	await server.start();
	databaseUrl = `postgres://postgres@${server.getServerConn()}/postgres?sslmode=disable`;

	// The same tool and files as `npm run db:migrate`
	const connection = connect({
		connectionString: databaseUrl,
		bigIntMode: "number",
	});
	await applyMigrations({ connection, migrationsDirectory: "db/migrations" });
	await connection.dispose();
});

// Every test starts with empty tables and ids from 1. Tests insert their own rows; they don't load db/seed.sql.
beforeEach(async () => {
	await pglite.exec(
		`TRUNCATE offenses, offense_categories, commandment_questions, commandments,
		church_precept_questions, church_precepts RESTART IDENTITY`,
	);
});

after(async () => {
	await server.stop();
	await pglite.close();
});

async function insertCommandment(number: number, text: string) {
	await pglite.query(
		"INSERT INTO commandments (number, text) VALUES ($1, $2)",
		[number, text],
	);
}

async function insertChurchPrecept(number: number, text: string) {
	await pglite.query(
		"INSERT INTO church_precepts (number, text) VALUES ($1, $2)",
		[number, text],
	);
}

async function insertChurchPreceptQuestion(
	churchPreceptId: number,
	position: number,
	text: string,
) {
	await pglite.query(
		`INSERT INTO church_precept_questions (church_precept_id, question_position, text)
		VALUES ($1, $2, $3)`,
		[churchPreceptId, position, text],
	);
}

async function insertQuestion(
	commandmentNumber: number,
	position: number,
	text: string,
) {
	await pglite.query(
		`INSERT INTO commandment_questions (commandment_id, question_position, text)
     SELECT id, $2, $3 FROM commandments WHERE number = $1`,
		[commandmentNumber, position, text],
	);
}

async function insertCategory(commandmentNumber: number, text: string) {
	await pglite.query(
		`INSERT INTO offense_categories (commandment_id, text)
     SELECT id, $2 FROM commandments WHERE number = $1`,
		[commandmentNumber, text],
	);
}

// With a category name, the Offense goes in that category of the same Commandment.
// A category name that matches nothing is a mistake in the test, so it throws.
async function insertOffense(
	commandmentNumber: number,
	text: string,
	categoryText?: string,
) {
	const { affectedRows } = await pglite.query(
		`INSERT INTO offenses (commandment_id, offense_category_id, text)
     SELECT c.id, oc.id, $2 FROM commandments c
     LEFT JOIN offense_categories oc ON oc.commandment_id = c.id AND oc.text = $3
     WHERE c.number = $1 AND ($3::text IS NULL OR oc.id IS NOT NULL)`,
		[commandmentNumber, text, categoryText ?? null],
	);
	assert.equal(affectedRows, 1, `no Offense inserted for "${text}"`);
}

test("/health is public", async (t) => {
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({ method: "GET", url: "/health" });
	assert.equal(res.statusCode, 200);
});

test("/api needs an API key, at every depth", async (t) => {
	const app = createApp();
	t.after(() => app.close());

	for (const url of [
		"/api/commandments",
		"/api/commandments/1",
		"/api/commandments/1/questions",
		"/api/commandments/1/offenses",
		"/api/church-precepts",
		"/api/church-precepts/1",
		"/api/church-precepts/1/questions",
	]) {
		const res = await app.inject({ method: "GET", url });
		assert.equal(res.statusCode, 401, url);
		assert.equal(
			res.headers["content-type"],
			"application/problem+json; charset=utf-8",
			url,
		);
		assert.deepEqual(res.json(), {
			title: "Unauthorized",
			status: 401,
			detail: "Missing or invalid API key.",
		});
	}
});

test("the API key comes from the options, not the code", async (t) => {
	const app = createApp({ apiKey: "another-key" });
	t.after(() => app.close());

	const wrong = await app.inject({
		method: "GET",
		url: "/api/commandments",
		headers,
	});
	assert.equal(wrong.statusCode, 401);
	const right = await app.inject({
		method: "GET",
		url: "/api/commandments",
		headers: { "x-api-key": "another-key" },
	});
	assert.equal(right.statusCode, 200);
});

test("GET /api/commandments lists commandments in number order", async (t) => {
	await insertCommandment(2, "Second");
	await insertCommandment(1, "First");
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/commandments",
		headers,
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), [
		{ id: 2, number: 1, text: "First" },
		{ id: 1, number: 2, text: "Second" },
	]);
});

test("GET /api/commandments/:number finds by number, not id", async (t) => {
	await insertCommandment(5, "You shall not kill.");
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/commandments/5",
		headers,
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), {
		id: 1,
		number: 5,
		text: "You shall not kill.",
	});
});

test("a missing commandment is a 404, an out-of-range number is a 400", async (t) => {
	const app = createApp();
	t.after(() => app.close());

	const missing = await app.inject({
		method: "GET",
		url: "/api/commandments/3",
		headers,
	});
	assert.equal(missing.statusCode, 404);
	assert.equal(
		missing.headers["content-type"],
		"application/problem+json; charset=utf-8",
	);
	assert.deepEqual(missing.json(), {
		title: "Not Found",
		status: 404,
		detail: "Commandment 3 not found.",
	});

	const outOfRange = await app.inject({
		method: "GET",
		url: "/api/commandments/11",
		headers,
	});
	assert.equal(outOfRange.statusCode, 400);
	assert.equal(
		outOfRange.headers["content-type"],
		"application/problem+json; charset=utf-8",
	);
	assert.deepEqual(outOfRange.json(), {
		title: "Bad Request",
		status: 400,
		detail: "params/number must be <= 10",
	});
});

test("GET /api/church-precepts lists Church precepts with IDs in number order", async (t) => {
	await insertChurchPrecept(2, "Second");
	await insertChurchPrecept(1, "First");
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/church-precepts",
		headers,
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), [
		{ id: 2, number: 1, text: "First" },
		{ id: 1, number: 2, text: "Second" },
	]);
});

test("GET /api/church-precepts/:number returns the ID of the Church precept found by number", async (t) => {
	await insertChurchPrecept(5, "Fifth");
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/church-precepts/5",
		headers,
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), { id: 1, number: 5, text: "Fifth" });
});

test("a missing Church precept returns a 404 problem response", async (t) => {
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/church-precepts/3",
		headers,
	});
	assert.equal(res.statusCode, 404);
	assert.equal(
		res.headers["content-type"],
		"application/problem+json; charset=utf-8",
	);
	assert.deepEqual(res.json(), {
		title: "Not Found",
		status: 404,
		detail: "Church Precept 3 not found.",
	});
});

test("an invalid Church precept number returns a 400 problem response", async (t) => {
	const app = createApp();
	t.after(() => app.close());

	for (const [number, detail] of [
		["0", "params/number must be >= 1"],
		["6", "params/number must be <= 5"],
		["2.5", "params/number must be integer"],
		["abc", "params/number must be integer"],
	]) {
		for (const url of [
			`/api/church-precepts/${number}`,
			`/api/church-precepts/${number}/questions`,
		]) {
			const res = await app.inject({ method: "GET", url, headers });
			assert.equal(res.statusCode, 400, url);
			assert.equal(
				res.headers["content-type"],
				"application/problem+json; charset=utf-8",
				url,
			);
			assert.deepEqual(res.json(), {
				title: "Bad Request",
				status: 400,
				detail,
			});
		}
	}
});

test("questions for the requested Church precept are ordered by position", async (t) => {
	await insertChurchPrecept(2, "Second");
	await insertChurchPrecept(1, "First");
	await insertChurchPreceptQuestion(1, 2, "Second question?");
	await insertChurchPreceptQuestion(2, 1, "Another Church precept's question?");
	await insertChurchPreceptQuestion(1, 1, "First question?");
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/church-precepts/2/questions",
		headers,
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), [
		{ id: 3, churchPreceptId: 1, questionPosition: 1, text: "First question?" },
		{
			id: 1,
			churchPreceptId: 1,
			questionPosition: 2,
			text: "Second question?",
		},
	]);
});

test("a Church precept with no questions returns an empty array", async (t) => {
	await insertChurchPrecept(3, "Third");
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/church-precepts/3/questions",
		headers,
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), []);
});

test("a missing Church precept yields the same 404 problem for its detail and questions", async (t) => {
	const app = createApp();
	t.after(() => app.close());

	const precept = await app.inject({
		method: "GET",
		url: "/api/church-precepts/3",
		headers,
	});
	const questions = await app.inject({
		method: "GET",
		url: "/api/church-precepts/3/questions",
		headers,
	});
	assert.equal(questions.statusCode, 404);
	assert.equal(
		questions.headers["content-type"],
		"application/problem+json; charset=utf-8",
	);
	assert.deepEqual(questions.json(), precept.json());
});

test("questions come back camelCased and in position order", async (t) => {
	await insertCommandment(4, "Honor your father and your mother.");
	await insertQuestion(4, 2, "Second question?");
	await insertQuestion(4, 1, "First question?");
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/commandments/4/questions",
		headers,
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), [
		{ id: 2, commandmentId: 1, questionPosition: 1, text: "First question?" },
		{ id: 1, commandmentId: 1, questionPosition: 2, text: "Second question?" },
	]);
});

test("questions for a missing commandment are a 404", async (t) => {
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/commandments/9/questions",
		headers,
	});
	assert.equal(res.statusCode, 404);
	assert.deepEqual(res.json(), {
		title: "Not Found",
		status: 404,
		detail: "Commandment 9 not found.",
	});
});

test("offenses in no category come back alphabetically, with no categories", async (t) => {
	await insertCommandment(1, "I am the Lord your God.");
	await insertOffense(1, "Superstition");
	await insertOffense(1, "Despair of God's mercy");
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/commandments/1/offenses",
		headers,
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), {
		categories: [],
		uncategorized: [
			{ id: 2, text: "Despair of God's mercy" },
			{ id: 1, text: "Superstition" },
		],
	});
});

test("categories and the offenses in each come back alphabetically", async (t) => {
	await insertCommandment(1, "I am the Lord your God.");
	await insertCategory(1, "Those against Hope");
	await insertCategory(1, "Those against Faith");
	await insertOffense(
		1,
		"Willful doubt of any article of Faith",
		"Those against Faith",
	);
	await insertOffense(1, "Heresy", "Those against Faith");
	await insertOffense(1, "Presumption", "Those against Hope");
	await insertOffense(1, "Despair of God's mercy", "Those against Hope");
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/commandments/1/offenses",
		headers,
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), {
		categories: [
			{
				id: 2,
				text: "Those against Faith",
				offenses: [
					{ id: 2, text: "Heresy" },
					{ id: 1, text: "Willful doubt of any article of Faith" },
				],
			},
			{
				id: 1,
				text: "Those against Hope",
				offenses: [
					{ id: 4, text: "Despair of God's mercy" },
					{ id: 3, text: "Presumption" },
				],
			},
		],
		uncategorized: [],
	});
});

test("a category with no offenses is left out", async (t) => {
	await insertCommandment(1, "I am the Lord your God.");
	await insertCategory(1, "Those against Charity");
	await insertCategory(1, "Those against Faith");
	await insertOffense(1, "Heresy", "Those against Faith");
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/commandments/1/offenses",
		headers,
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), {
		categories: [
			{
				id: 2,
				text: "Those against Faith",
				offenses: [{ id: 1, text: "Heresy" }],
			},
		],
		uncategorized: [],
	});
});

test("a commandment with offenses in and out of categories fills both lists", async (t) => {
	await insertCommandment(1, "I am the Lord your God.");
	await insertCategory(1, "Those against Faith");
	await insertOffense(
		1,
		"Willful doubt of any article of Faith",
		"Those against Faith",
	);
	await insertOffense(1, "Superstition");
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/commandments/1/offenses",
		headers,
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), {
		categories: [
			{
				id: 1,
				text: "Those against Faith",
				offenses: [{ id: 1, text: "Willful doubt of any article of Faith" }],
			},
		],
		uncategorized: [{ id: 2, text: "Superstition" }],
	});
});

test("a commandment with no offenses has both lists empty", async (t) => {
	await insertCommandment(6, "You shall not commit adultery.");
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/commandments/6/offenses",
		headers,
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), { categories: [], uncategorized: [] });
});

test("offenses with the same wording under two commandments stay with their own", async (t) => {
	await insertCommandment(7, "You shall not steal.");
	await insertCommandment(10, "You shall not covet your neighbor's goods.");
	await insertOffense(7, "Envy");
	await insertOffense(10, "Envy");
	await insertOffense(10, "Greed");
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/api/commandments/7/offenses",
		headers,
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), {
		categories: [],
		uncategorized: [{ id: 1, text: "Envy" }],
	});
});

test("offenses for a missing commandment are a 404, a number outside 1-10 is a 400", async (t) => {
	const app = createApp();
	t.after(() => app.close());

	const missing = await app.inject({
		method: "GET",
		url: "/api/commandments/9/offenses",
		headers,
	});
	assert.equal(missing.statusCode, 404);
	assert.equal(
		missing.headers["content-type"],
		"application/problem+json; charset=utf-8",
	);
	assert.deepEqual(missing.json(), {
		title: "Not Found",
		status: 404,
		detail: "Commandment 9 not found.",
	});

	const outOfRange = await app.inject({
		method: "GET",
		url: "/api/commandments/0/offenses",
		headers,
	});
	assert.equal(outOfRange.statusCode, 400);
	assert.deepEqual(outOfRange.json(), {
		title: "Bad Request",
		status: 400,
		detail: "params/number must be >= 1",
	});

	const tooHigh = await app.inject({
		method: "GET",
		url: "/api/commandments/11/offenses",
		headers,
	});
	assert.equal(tooHigh.statusCode, 400);
	assert.deepEqual(tooHigh.json(), {
		title: "Bad Request",
		status: 400,
		detail: "params/number must be <= 10",
	});
});

test("a route that does not exist is a problem 404", async (t) => {
	const app = createApp();
	t.after(() => app.close());

	for (const url of ["/nope", "/api/nope"]) {
		const res = await app.inject({ method: "GET", url, headers });
		assert.equal(res.statusCode, 404, url);
		assert.equal(
			res.headers["content-type"],
			"application/problem+json; charset=utf-8",
			url,
		);
		assert.deepEqual(res.json(), {
			title: "Not Found",
			status: 404,
			detail: `Route GET:${url} not found`,
		});
	}
});

test("a 4xx error from Fastify or a plugin keeps its status and headers", async (t) => {
	const app = createApp();
	// Shaped like @fastify/error and http-errors: statusCode plus optional headers
	app.get("/limited", async () => {
		throw Object.assign(new Error("Rate limit exceeded"), {
			statusCode: 429,
			headers: { "retry-after": "60" },
		});
	});
	t.after(() => app.close());

	const res = await app.inject({ method: "GET", url: "/limited" });
	assert.equal(res.statusCode, 429);
	assert.equal(res.headers["retry-after"], "60");
	assert.equal(
		res.headers["content-type"],
		"application/problem+json; charset=utf-8",
	);
	assert.deepEqual(res.json(), {
		title: "Too Many Requests",
		status: 429,
		detail: "Rate limit exceeded",
	});
});

test("boot fails fast when the database is unreachable", async () => {
	const app = createApp({
		databaseUrl: "postgres://postgres@127.0.0.1:1/nope",
	});
	await assert.rejects(async () => {
		await app.ready();
	}, /ECONNREFUSED/);
});

test("a 500 hides its message from the client and logs it", async (t) => {
	const lines: string[] = [];
	const app = createApp({
		logger: {
			level: "error",
			stream: {
				write: (line: string) => {
					lines.push(line);
				},
			},
		},
	});
	app.get("/boom", async () => {
		throw new Error("password=hunter2");
	});
	t.after(() => app.close());

	const res = await app.inject({ method: "GET", url: "/boom" });
	assert.equal(res.statusCode, 500);
	assert.equal(
		res.headers["content-type"],
		"application/problem+json; charset=utf-8",
	);
	assert.deepEqual(res.json(), {
		title: "Internal Server Error",
		status: 500,
		detail: "Something went wrong.",
	});
	assert.ok(!res.body.includes("hunter2"));
	assert.ok(
		lines.some((l) => l.includes("password=hunter2")),
		"the real message is in the log",
	);
});

test("an error with a non-error statusCode is still an unexpected 500", async (t) => {
	const app = createApp({ logger: false });
	app.get("/odd", async () => {
		throw Object.assign(new Error("internal detail"), { statusCode: 302 });
	});
	t.after(() => app.close());

	const res = await app.inject({ method: "GET", url: "/odd" });
	assert.equal(res.statusCode, 500);
	assert.deepEqual(res.json(), {
		title: "Internal Server Error",
		status: 500,
		detail: "Something went wrong.",
	});
});

test("each AppError code maps to its status", async (t) => {
	const app = createApp();
	app.get<{ Params: { code: ErrorCode } }>("/throw/:code", async (request) => {
		throw new AppError(request.params.code, "Nope.");
	});
	t.after(() => app.close());

	const expected: [ErrorCode, number, string][] = [
		["BAD_REQUEST", 400, "Bad Request"],
		["VALIDATION_ERROR", 400, "Bad Request"],
		["NOT_FOUND", 404, "Not Found"],
		["CONFLICT", 409, "Conflict"],
	];
	for (const [code, status, title] of expected) {
		const res = await app.inject({ method: "GET", url: `/throw/${code}` });
		assert.equal(
			res.headers["content-type"],
			"application/problem+json; charset=utf-8",
			code,
		);
		assert.deepEqual(res.json(), { title, status, detail: "Nope." }, code);
	}
});

test("an error with status instead of statusCode keeps it, as Fastify does", async (t) => {
	const app = createApp();
	app.get("/gone", async () => {
		throw Object.assign(new Error("Gone away"), { status: 410 });
	});
	t.after(() => app.close());

	const res = await app.inject({ method: "GET", url: "/gone" });
	assert.deepEqual(res.json(), {
		title: "Gone",
		status: 410,
		detail: "Gone away",
	});
});

test("a 4xx with no standard phrase still has a title", async (t) => {
	const app = createApp();
	app.get("/odd4xx", async () => {
		throw Object.assign(new Error("client closed"), { statusCode: 499 });
	});
	t.after(() => app.close());

	const res = await app.inject({ method: "GET", url: "/odd4xx" });
	assert.deepEqual(res.json(), {
		title: "Client Error",
		status: 499,
		detail: "client closed",
	});
});
