import type { CommandmentQuestion, Conn } from "../db/types.ts";

export interface CommandmentQuestionsRepository {
	findByCommandmentNumber(number: number): Promise<CommandmentQuestion[]>;
}

export function createCommandmentQuestionsRepository(
	db: Conn,
): CommandmentQuestionsRepository {
	return {
		async findByCommandmentNumber(number) {
			return db
				.selectFrom("commandmentQuestions as q")
				.innerJoin("commandments as c", "c.id", "q.commandmentId")
				.selectAll("q")
				.where("c.number", "=", number)
				.orderBy("q.questionPosition")
				.execute();
		},
	};
}
