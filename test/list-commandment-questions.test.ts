import assert from "node:assert/strict";
import { test } from "node:test";
import { createCommandmentsService } from "../src/commandments/commandments-service.ts";
import type { CommandmentQuestionsRepository } from "../src/commandments/questions/commandment-questions-repository.ts";
import { createCommandmentQuestionsService } from "../src/commandments/questions/commandment-questions-service.ts";
import { AppError } from "../src/errors.ts";

const rows = [
	{ id: 4, number: 1, text: "First" },
	{ id: 5, number: 2, text: "Second" },
];

const commandments = createCommandmentsService({
	async findAll() {
		return rows;
	},
	async findByCommandmentNumber(number) {
		return rows.find((commandment) => commandment.number === number);
	},
});

const questions: CommandmentQuestionsRepository = {
	async findByCommandmentNumber(number) {
		return number === 1
			? [
					{ id: 2, commandmentId: 4, questionPosition: 1, text: "First?" },
					{ id: 1, commandmentId: 4, questionPosition: 2, text: "Second?" },
				]
			: [];
	},
};

const questionsService = createCommandmentQuestionsService(
	questions,
	commandments.getByNumber,
);

test("lists a Commandment's Examination questions in position order", async () => {
	assert.deepEqual(await questionsService.listByCommandmentNumber(1), [
		{ id: 2, commandmentId: 4, questionPosition: 1, text: "First?" },
		{ id: 1, commandmentId: 4, questionPosition: 2, text: "Second?" },
	]);
});

test("lists no Examination questions for an existing Commandment with none", async () => {
	assert.deepEqual(await questionsService.listByCommandmentNumber(2), []);
});

test("a missing Commandment produces a NOT_FOUND AppError", async () => {
	await assert.rejects(questionsService.listByCommandmentNumber(3), (err) => {
		assert.ok(err instanceof AppError);
		assert.equal(err.code, "NOT_FOUND");
		assert.equal(err.message, "Commandment 3 not found.");
		return true;
	});
});
