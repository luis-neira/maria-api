import assert from "node:assert/strict";
import { test } from "node:test";
import { createChurchPreceptQuestionsService } from "#src/church-precepts/questions/church-precept-questions-service.ts";
import { AppError } from "#src/errors.ts";

const questions = {
	async findByChurchPreceptNumber(number: number) {
		switch (number) {
			case 1:
				return [
					{ id: 2, churchPreceptId: 8, questionPosition: 1, text: "First?" },
					{ id: 1, churchPreceptId: 8, questionPosition: 2, text: "Second?" },
				];
			case 2:
				return [];
			default:
				return undefined;
		}
	},
};

const churchPreceptQuestionsService =
	createChurchPreceptQuestionsService(questions);

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
