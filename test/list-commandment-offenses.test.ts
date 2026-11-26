import assert from "node:assert/strict";
import { test } from "node:test";
import type { GetCommandmentByNumberRepository } from "../src/commandments/get-commandment-by-number.ts";
import {
	createListCommandmentOffenses,
	type ListCommandmentOffensesRepository,
} from "../src/commandments/list-commandment-offenses.ts";
import { AppError } from "../src/errors.ts";

const commandments: GetCommandmentByNumberRepository = {
	async findByCommandmentNumber(number) {
		return [
			{ id: 4, number: 1, text: "First" },
			{ id: 5, number: 2, text: "Second" },
		].find((commandment) => commandment.number === number);
	},
};

const faith = { id: 2, text: "Those against Faith" };
const hope = { id: 1, text: "Those against Hope" };

const offenses: ListCommandmentOffensesRepository = {
	async findByCommandmentNumber(number) {
		return number === 1
			? [
					{ id: 3, text: "Heresy", category: faith },
					{ id: 1, text: "Willful doubt", category: faith },
					{ id: 4, text: "Presumption", category: hope },
					{ id: 2, text: "Superstition", category: null },
				]
			: [];
	},
};

test("lists a Commandment's Offenses by category and lists uncategorized Offenses separately", async () => {
	const listCommandmentOffenses = createListCommandmentOffenses(
		offenses,
		commandments,
	);
	assert.deepEqual(await listCommandmentOffenses(1), {
		categories: [
			{
				id: 2,
				text: "Those against Faith",
				offenses: [
					{ id: 3, text: "Heresy" },
					{ id: 1, text: "Willful doubt" },
				],
			},
			{
				id: 1,
				text: "Those against Hope",
				offenses: [{ id: 4, text: "Presumption" }],
			},
		],
		uncategorized: [{ id: 2, text: "Superstition" }],
	});
});

test("a missing Commandment produces a NOT_FOUND AppError", async () => {
	const listCommandmentOffenses = createListCommandmentOffenses(
		offenses,
		commandments,
	);
	await assert.rejects(listCommandmentOffenses(3), (err) => {
		assert.ok(err instanceof AppError);
		assert.equal(err.code, "NOT_FOUND");
		assert.equal(err.message, "Commandment 3 not found.");
		return true;
	});
});

test("an existing Commandment with no Offenses returns two empty lists", async () => {
	const listCommandmentOffenses = createListCommandmentOffenses(
		offenses,
		commandments,
	);
	assert.deepEqual(await listCommandmentOffenses(2), {
		categories: [],
		uncategorized: [],
	});
});
