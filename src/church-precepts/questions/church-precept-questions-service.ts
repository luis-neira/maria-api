import { AppError } from "../../errors.ts";
import type { ChurchPreceptQuestionsRepository } from "./church-precept-questions-repository.ts";

export function createChurchPreceptQuestionsService(
	repository: ChurchPreceptQuestionsRepository,
) {
	return {
		async listByChurchPreceptNumber(number: number) {
			const questions = await repository.findByChurchPreceptNumber(number);
			if (questions === undefined) {
				throw new AppError("NOT_FOUND", `Church Precept ${number} not found.`);
			}
			return questions;
		},
	};
}

export type ChurchPreceptQuestionsService = ReturnType<
	typeof createChurchPreceptQuestionsService
>;
