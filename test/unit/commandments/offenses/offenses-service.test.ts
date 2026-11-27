import assert from "node:assert/strict";
import { test } from "node:test";
import { createCommandmentsService } from "#src/commandments/commandments-service.ts";
import type { OffensesRepository } from "#src/commandments/offenses/offenses-repository.ts";
import { createOffensesService } from "#src/commandments/offenses/offenses-service.ts";
import { AppError } from "#src/errors.ts";

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

const faith = { id: 2, text: "Those against Faith" };
const hope = { id: 1, text: "Those against Hope" };

const offenses: OffensesRepository = {
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

const offensesService = createOffensesService(
	offenses,
	commandments.getByNumber,
);

test("lists a Commandment's Offenses by category and lists uncategorized Offenses separately", async () => {
	assert.deepEqual(await offensesService.listByCommandmentNumber(1), {
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
	await assert.rejects(offensesService.listByCommandmentNumber(3), (err) => {
		assert.ok(err instanceof AppError);
		assert.equal(err.code, "NOT_FOUND");
		assert.equal(err.message, "Commandment 3 not found.");
		return true;
	});
});

test("an existing Commandment with no Offenses returns two empty lists", async () => {
	assert.deepEqual(await offensesService.listByCommandmentNumber(2), {
		categories: [],
		uncategorized: [],
	});
});
