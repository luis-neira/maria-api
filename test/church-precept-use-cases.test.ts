import assert from "node:assert/strict";
import { test } from "node:test";
import { createGetChurchPreceptByNumber } from "../src/church-precepts/get-church-precept-by-number.ts";
import { createListChurchPreceptQuestions } from "../src/church-precepts/list-church-precept-questions.ts";
import { createListChurchPrecepts } from "../src/church-precepts/list-church-precepts.ts";
import { AppError } from "../src/errors.ts";

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

test("lists Church precepts in number order", async () => {
	const listChurchPrecepts = createListChurchPrecepts(repository);

	assert.deepEqual(await listChurchPrecepts(), [
		{ id: 8, number: 1, text: "First" },
		{ id: 4, number: 2, text: "Second" },
	]);
});

test("finds a Church precept by number", async () => {
	const getChurchPreceptByNumber = createGetChurchPreceptByNumber(repository);
	assert.deepEqual(await getChurchPreceptByNumber(2), {
		id: 4,
		number: 2,
		text: "Second",
	});
});

test("a missing Church precept produces a NOT_FOUND AppError", async () => {
	const getChurchPreceptByNumber = createGetChurchPreceptByNumber(repository);
	await assert.rejects(getChurchPreceptByNumber(3), {
		name: AppError.name,
		code: "NOT_FOUND",
		message: "Church Precept 3 not found.",
	});
});

const questions = {
	async findByChurchPreceptId(id: number) {
		return id === 8
			? [
					{ id: 2, churchPreceptId: 8, questionPosition: 1, text: "First?" },
					{ id: 1, churchPreceptId: 8, questionPosition: 2, text: "Second?" },
				]
			: [];
	},
};

const listChurchPreceptQuestions = createListChurchPreceptQuestions(
	questions,
	repository,
);

test("lists a Church precept's Examination questions in position order", async () => {
	assert.deepEqual(await listChurchPreceptQuestions(1), [
		{ id: 2, churchPreceptId: 8, questionPosition: 1, text: "First?" },
		{ id: 1, churchPreceptId: 8, questionPosition: 2, text: "Second?" },
	]);
});

test("lists no Examination questions for an existing Church precept with none", async () => {
	assert.deepEqual(await listChurchPreceptQuestions(2), []);
});

test("listing Examination questions for a missing Church precept throws NOT_FOUND", async () => {
	await assert.rejects(listChurchPreceptQuestions(3), {
		name: AppError.name,
		code: "NOT_FOUND",
		message: "Church Precept 3 not found.",
	});
});
