import assert from "node:assert/strict";
import { test } from "node:test";
import type { GetCommandmentByNumberRepository } from "../src/commandments/get-commandment-by-number.ts";
import { AppError } from "../src/errors.ts";
import type { CommandmentQuestionsRepository } from "../src/repositories/commandment-questions-repository.ts";
import { createCommandmentQuestionsService } from "../src/services/commandment-questions-service.ts";

const commandments: GetCommandmentByNumberRepository = {
	async findByCommandmentNumber(number) {
		return number === 1 ? { id: 1, number: 1, text: "First" } : undefined;
	},
};

const questions: CommandmentQuestionsRepository = {
	async findByCommandmentNumber(number) {
		return number === 1
			? [{ id: 1, commandmentId: 1, questionPosition: 1, text: "Have I?" }]
			: [];
	},
};

test("lists the questions for a commandment", async () => {
	const service = createCommandmentQuestionsService(questions, commandments);
	assert.deepEqual(await service.getAllQuestions(1), [
		{ id: 1, commandmentId: 1, questionPosition: 1, text: "Have I?" },
	]);
});

test("a missing commandment is a NOT_FOUND AppError, not an empty list", async () => {
	const service = createCommandmentQuestionsService(questions, commandments);
	await assert.rejects(service.getAllQuestions(2), (err) => {
		assert.ok(err instanceof AppError);
		assert.equal(err.code, "NOT_FOUND");
		assert.equal(err.message, "Commandment 2 not found.");
		return true;
	});
});
