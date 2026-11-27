import assert from "node:assert/strict";
import { test } from "node:test";
import { createChurchPreceptsService } from "../src/church-precepts/church-precepts-service.ts";
import { createChurchPreceptQuestionsService } from "../src/church-precepts/questions/church-precept-questions-service.ts";
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

const churchPreceptQuestionsService = createChurchPreceptQuestionsService(
	questions,
	churchPreceptsService.getByNumber,
);

test("lists a Church precept's Examination questions in position order", async () => {
	assert.deepEqual(
		await churchPreceptQuestionsService.listByChurchPreceptNumber(1),
		[
			{ id: 2, churchPreceptId: 8, questionPosition: 1, text: "First?" },
			{ id: 1, churchPreceptId: 8, questionPosition: 2, text: "Second?" },
		],
	);
});

test("lists no Examination questions for an existing Church precept with none", async () => {
	assert.deepEqual(
		await churchPreceptQuestionsService.listByChurchPreceptNumber(2),
		[],
	);
});

test("listing Examination questions for a missing Church precept throws NOT_FOUND", async () => {
	await assert.rejects(
		churchPreceptQuestionsService.listByChurchPreceptNumber(3),
		{
			name: AppError.name,
			code: "NOT_FOUND",
			message: "Church Precept 3 not found.",
		},
	);
});
