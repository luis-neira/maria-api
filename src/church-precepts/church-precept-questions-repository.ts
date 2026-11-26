import type { Conn } from "../db/types.ts";
import type { ListChurchPreceptQuestionsRepository } from "./list-church-precept-questions.ts";

export function createChurchPreceptQuestionsRepository(
	db: Conn,
): ListChurchPreceptQuestionsRepository {
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
