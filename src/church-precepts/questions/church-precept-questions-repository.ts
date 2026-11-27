import type { Conn } from "#db/types.ts";
import type { ChurchPreceptQuestionsRepository } from "./church-precept-questions-service.ts";

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
