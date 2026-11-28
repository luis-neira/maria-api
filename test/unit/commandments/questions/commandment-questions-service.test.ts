import assert from "node:assert/strict";
import { test } from "node:test";
import type { CommandmentQuestionsRepository } from "#src/commandments/questions/commandment-questions-repository.ts";
import { createCommandmentQuestionsService } from "#src/commandments/questions/commandment-questions-service.ts";
import { AppError } from "#src/errors.ts";

const questions: CommandmentQuestionsRepository = {
	async findByCommandmentNumber(number) {
		switch (number) {
			case 1:
				return [
					{ id: 2, commandmentId: 4, questionPosition: 1, text: "First?" },
					{ id: 1, commandmentId: 4, questionPosition: 2, text: "Second?" },
				];
			case 2:
				return [];
			default:
				return undefined;
		}
	},
};

const questionsService = createCommandmentQuestionsService(questions);

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
