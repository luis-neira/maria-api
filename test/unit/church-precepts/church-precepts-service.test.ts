import assert from "node:assert/strict";
import { test } from "node:test";
import { createChurchPreceptsService } from "../../../src/church-precepts/church-precepts-service.ts";
import { AppError } from "../../../src/errors.ts";

const churchPrecepts = [
	{ id: 8, number: 1, text: "First" },
	{ id: 4, number: 2, text: "Second" },
];

const repository = {
	async findAll() {
		return churchPrecepts;
	},
	async findByChurchPreceptNumber(number: number) {
		return churchPrecepts.find(
			(churchPrecept) => churchPrecept.number === number,
		);
	},
};

const churchPreceptsService = createChurchPreceptsService(repository);

test("lists Church precepts in number order", async () => {
	assert.deepEqual(await churchPreceptsService.list(), [
		{ id: 8, number: 1, text: "First" },
		{ id: 4, number: 2, text: "Second" },
	]);
});

test("finds a Church precept by number", async () => {
	assert.deepEqual(await churchPreceptsService.getByNumber(2), {
		id: 4,
		number: 2,
		text: "Second",
	});
});

test("a missing Church precept produces a NOT_FOUND AppError", async () => {
	await assert.rejects(churchPreceptsService.getByNumber(3), {
		name: AppError.name,
		code: "NOT_FOUND",
		message: "Church Precept 3 not found.",
	});
});

