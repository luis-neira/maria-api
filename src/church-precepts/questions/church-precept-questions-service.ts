import type { ChurchPreceptsService } from "../church-precepts-service.ts";
import type { ChurchPreceptQuestionsRepository } from "./church-precept-questions-repository.ts";

export function createChurchPreceptQuestionsService(
	repository: ChurchPreceptQuestionsRepository,
	getChurchPreceptByNumber: ChurchPreceptsService["getByNumber"],
) {
	return {
		async listByChurchPreceptNumber(number: number) {
			const churchPrecept = await getChurchPreceptByNumber(number);
			return repository.findByChurchPreceptId(churchPrecept.id);
		},
	};
}

export type ChurchPreceptQuestionsService = ReturnType<
	typeof createChurchPreceptQuestionsService
>;
