import type { Conn } from "#db/types.ts";

export interface ChurchPreceptQuestion {
	id: number;
	churchPreceptId: number;
	questionPosition: number;
	text: string;
}

export interface ChurchPreceptQuestionsRepository {
	/** Returns Examination questions in position order, or undefined for a missing Church precept. */
	findByChurchPreceptNumber(
		number: number,
	): Promise<ChurchPreceptQuestion[] | undefined>;
}

export function createChurchPreceptQuestionsRepository(
	db: Conn,
): ChurchPreceptQuestionsRepository {
	return {
		async findByChurchPreceptNumber(number) {
			const rows = await db
				.selectFrom("churchPrecepts as p")
				.leftJoin("churchPreceptQuestions as q", "q.churchPreceptId", "p.id")
				.select([
					"q.id",
					"p.id as churchPreceptId",
					"q.questionPosition",
					"q.text",
				])
				.where("p.number", "=", number)
				.orderBy("q.questionPosition")
				.execute();
			if (rows.length === 0) {
				return undefined;
			}

			const questions: ChurchPreceptQuestion[] = [];
			for (const { id, churchPreceptId, questionPosition, text } of rows) {
				if (id !== null && questionPosition !== null && text !== null) {
					questions.push({ id, churchPreceptId, questionPosition, text });
				}
			}
			return questions;
		},
	};
}
