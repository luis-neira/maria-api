import type { Conn } from "#db/types.ts";

export interface CommandmentQuestion {
	id: number;
	commandmentId: number;
	questionPosition: number;
	text: string;
}

export interface CommandmentQuestionsRepository {
	/** Returns the Commandment's Examination questions in position order. */
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
				.select(["q.id", "q.commandmentId", "q.questionPosition", "q.text"])
				.where("c.number", "=", number)
				.orderBy("q.questionPosition")
				.execute();
		},
	};
}
