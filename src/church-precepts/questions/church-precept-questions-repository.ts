import type { Conn } from "#db/types.ts";

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

export function createChurchPreceptQuestionsRepository(
	db: Conn,
): ChurchPreceptQuestionsRepository {
	return {
		async findByChurchPreceptId(id) {
			return db
				.selectFrom("churchPreceptQuestions")
				.selectAll()
				.where("churchPreceptId", "=", id)
				.orderBy("questionPosition")
				.execute();
		},
	};
}
