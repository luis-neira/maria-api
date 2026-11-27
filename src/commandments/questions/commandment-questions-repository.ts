import type { Conn } from "../../../db/types.ts";
import type { CommandmentQuestionsRepository } from "../services/commandment-questions-service.ts";

export function createCommandmentQuestionsRepository(
	db: Conn,
): CommandmentQuestionsRepository {
	return {
		async findByCommandmentNumber(number) {
			return db
				.selectFrom("commandmentQuestions as q")
				.innerJoin("commandments as c", "c.id", "q.commandmentId")
				.select(["q.id", "q.commandmentId", "q.questionPosition", "q.text"])
				.where("c.number", "=", number)
				.orderBy("q.questionPosition")
				.execute();
		},
	};
}
