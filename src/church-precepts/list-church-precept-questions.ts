import {
	churchPreceptNotFound,
	type GetChurchPreceptByNumberRepository,
} from "./get-church-precept-by-number.ts";

export interface ChurchPreceptQuestion {
	id: number;
	churchPreceptId: number;
	questionPosition: number;
	text: string;
}

export interface ListChurchPreceptQuestionsRepository {
	/** Returns the Church precept's Examination questions in position order. */
	findByChurchPreceptId(id: number): Promise<ChurchPreceptQuestion[]>;
}

export type ListChurchPreceptQuestions = (
	number: number,
) => Promise<ChurchPreceptQuestion[]>;

export function createListChurchPreceptQuestions(
	questions: ListChurchPreceptQuestionsRepository,
	churchPrecepts: GetChurchPreceptByNumberRepository,
): ListChurchPreceptQuestions {
	return async (number) => {
		const churchPrecept =
			await churchPrecepts.findByChurchPreceptNumber(number);
		if (!churchPrecept) throw churchPreceptNotFound(number);
		return questions.findByChurchPreceptId(churchPrecept.id);
	};
}
