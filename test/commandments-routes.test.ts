import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import commandmentsRoutes from "../src/commandments/commandments-routes.ts";
import { commandmentNotFound } from "../src/commandments/get-commandment-by-number.ts";
import { errorHandler } from "../src/error-handler.ts";
import type { CommandmentQuestionsService } from "../src/services/commandment-questions-service.ts";

const fakeQuestions: CommandmentQuestionsService = {
	async getAllQuestions(number) {
		return [
			{ id: 1, commandmentId: number, questionPosition: 1, text: "Have I?" },
		];
	},
};

function createApp() {
	const app = Fastify();
	app.setErrorHandler(errorHandler); // as buildApp does
	app.register(commandmentsRoutes, {
		prefix: "/commandments",
		async listCommandments() {
			return [{ id: 1, number: 1, text: "First" }];
		},
		async getCommandmentByNumber(number) {
			throw commandmentNotFound(number);
		},
		questions: { service: fakeQuestions },
		offenses: {
			service: {
				async getAllOffenses() {
					return { categories: [], uncategorized: [] };
				},
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

test("questions routes pass the number to the questions service", async (t) => {
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

test("the Examination question service is private to the Commandments scope", async (t) => {
	const app = createApp();
	t.after(() => app.close());
	await app.ready();

	assert.equal(app.hasDecorator("commandmentQuestionsService"), false);
});
