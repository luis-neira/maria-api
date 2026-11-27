import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { errorHandler } from "../src/app-handlers.ts";
import commandmentsRoutes from "../src/commandments/commandments-routes.ts";
import { AppError } from "../src/errors.ts";

function createApp() {
	const app = Fastify();
	app.setErrorHandler(errorHandler); // as buildApp does
	app.register(commandmentsRoutes, {
		prefix: "/commandments",
		commandments: {
			async list() {
				return [{ id: 1, number: 1, text: "First" }];
			},
			async getByNumber(number) {
				throw new AppError("NOT_FOUND", `Commandment ${number} not found.`);
			},
		},
		commandmentQuestions: {
			async listByCommandmentNumber(number) {
				return [
					{
						id: 1,
						commandmentId: number,
						questionPosition: 1,
						text: "Have I?",
					},
				];
			},
		},
		offenses: {
			async listByCommandmentNumber() {
				return { categories: [], uncategorized: [] };
			},
		},
	});
	return app;
}

test("GET / lists the Commandments returned by the list use case", async (t) => {
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({ method: "GET", url: "/commandments" });
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), [{ id: 1, number: 1, text: "First" }]);
});

test("application errors become problem responses", async (t) => {
	const app = createApp();
	t.after(() => app.close());

	const missing = await app.inject({ method: "GET", url: "/commandments/3" });
	assert.equal(missing.statusCode, 404);
	assert.deepEqual(missing.json(), {
		title: "Not Found",
		status: 404,
		detail: "Commandment 3 not found.",
	});
});

test("the schema rejects a bad number", async (t) => {
	const app = createApp();
	t.after(() => app.close());

	for (const url of [
		"/commandments/0",
		"/commandments/11",
		"/commandments/abc",
		"/commandments/11/questions",
	]) {
		const res = await app.inject({ method: "GET", url });
		assert.equal(res.statusCode, 400, url);
	}
});

test("the Examination question route passes the Commandment number to the use case", async (t) => {
	const app = createApp();
	t.after(() => app.close());

	const res = await app.inject({
		method: "GET",
		url: "/commandments/3/questions",
	});
	assert.equal(res.statusCode, 200);
	assert.deepEqual(res.json(), [
		{ id: 1, commandmentId: 3, questionPosition: 1, text: "Have I?" },
	]);
});
