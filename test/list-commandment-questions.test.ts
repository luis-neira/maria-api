import assert from "node:assert/strict";
import { test } from "node:test";
import type { GetCommandmentByNumberRepository } from "../src/commandments/get-commandment-by-number.ts";
import {
	createListCommandmentQuestions,
	type ListCommandmentQuestionsRepository,
} from "../src/commandments/list-commandment-questions.ts";
import { AppError } from "../src/errors.ts";

const commandments: GetCommandmentByNumberRepository = {
	async findByCommandmentNumber(number) {
		return [
			{ id: 4, number: 1, text: "First" },
			{ id: 5, number: 2, text: "Second" },
		].find((commandment) => commandment.number === number);
	},
};

const questions: ListCommandmentQuestionsRepository = {
	async findByCommandmentNumber(number) {
		return number === 1
			? [
					{ id: 2, commandmentId: 4, questionPosition: 1, text: "First?" },
					{ id: 1, commandmentId: 4, questionPosition: 2, text: "Second?" },
				]
			: [];
	},
};

test("lists a Commandment's Examination questions in position order", async () => {
	const listCommandmentQuestions = createListCommandmentQuestions(
		questions,
		commandments,
	);
	assert.deepEqual(await listCommandmentQuestions(1), [
		{ id: 2, commandmentId: 4, questionPosition: 1, text: "First?" },
		{ id: 1, commandmentId: 4, questionPosition: 2, text: "Second?" },
	]);
});

test("lists no Examination questions for an existing Commandment with none", async () => {
	const listCommandmentQuestions = createListCommandmentQuestions(
		questions,
		commandments,
	);
	assert.deepEqual(await listCommandmentQuestions(2), []);
});

test("a missing Commandment produces a NOT_FOUND AppError", async () => {
	const listCommandmentQuestions = createListCommandmentQuestions(
		questions,
		commandments,
	);
	await assert.rejects(listCommandmentQuestions(3), (err) => {
		assert.ok(err instanceof AppError);
		assert.equal(err.code, "NOT_FOUND");
		assert.equal(err.message, "Commandment 3 not found.");
		return true;
	});
});
