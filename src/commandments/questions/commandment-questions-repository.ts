import type { Conn } from "#db/types.ts";

export interface CommandmentQuestion {
	id: number;
	commandmentId: number;
	questionPosition: number;
	text: string;
}

export interface CommandmentQuestionsRepository {
	/** Returns Examination questions in position order, or undefined for a missing Commandment. */
	findByCommandmentNumber(
		number: number,
	): Promise<CommandmentQuestion[] | undefined>;
}

export function createCommandmentQuestionsRepository(
	db: Conn,
): CommandmentQuestionsRepository {
	return {
		async findByCommandmentNumber(number) {
			const rows = await db
				.selectFrom("commandments as c")
				.leftJoin("commandmentQuestions as q", "q.commandmentId", "c.id")
				.select([
					"q.id",
					"c.id as commandmentId",
					"q.questionPosition",
					"q.text",
				])
				.where("c.number", "=", number)
				.orderBy("q.questionPosition")
				.execute();
			if (rows.length === 0) {
				return undefined;
			}

			const questions: CommandmentQuestion[] = [];
			for (const { id, commandmentId, questionPosition, text } of rows) {
				if (id !== null && questionPosition !== null && text !== null) {
					questions.push({ id, commandmentId, questionPosition, text });
				}
			}
			return questions;
		},
	};
}
