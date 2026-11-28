import { jsonArrayFrom } from "kysely/helpers/postgres";
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
			const commandment = await db
				.selectFrom("commandments")
				.select((eb) =>
					jsonArrayFrom(
						eb
							.selectFrom("commandmentQuestions")
							.select(["id", "commandmentId", "questionPosition", "text"])
							.whereRef("commandmentId", "=", "commandments.id")
							.orderBy("questionPosition"),
					).as("questions"),
				)
				.where("number", "=", number)
				.executeTakeFirst();

			return commandment?.questions;
		},
	};
}
