import type { ChurchPreceptsService } from "./church-precepts-service.ts";

export interface ChurchPreceptQuestion {
	id: number;
	churchPreceptId: number;
	questionPosition: number;
	text: string;
}

export interface ChurchPreceptQuestionsRepository {
	/** Returns the Church precept's Examination questions in position order. */
	findByChurchPreceptId(id: number): Promise<ChurchPreceptQuestion[]>;
}

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
