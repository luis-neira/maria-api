import type { ChurchPreceptQuestion } from "../db/types.ts";
import type { ChurchPreceptQuestionsRepository } from "../repositories/church-precept-questions-repository.ts";
import type { ChurchPreceptsRepository } from "../repositories/church-precepts-repository.ts";
import { churchPreceptNotFound } from "./church-precepts-service.ts";

export function createChurchPreceptQuestionsService(
	questions: ChurchPreceptQuestionsRepository,
	churchPrecepts: ChurchPreceptsRepository,
) {
	return {
		async getAllQuestions(number: number): Promise<ChurchPreceptQuestion[]> {
			const churchPrecept = await churchPrecepts.findByPreceptNumber(number);
			if (!churchPrecept) throw churchPreceptNotFound(number);
			return questions.findByChurchPreceptId(churchPrecept.id);
		},
	};
}

export type ChurchPreceptQuestionsService = ReturnType<
	typeof createChurchPreceptQuestionsService
>;
