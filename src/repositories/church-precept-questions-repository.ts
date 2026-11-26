import type { ChurchPreceptQuestion, Conn } from "../db/types.ts";

export interface ChurchPreceptQuestionsRepository {
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
