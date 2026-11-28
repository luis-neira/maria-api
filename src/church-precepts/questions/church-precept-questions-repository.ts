import { jsonArrayFrom } from "kysely/helpers/postgres";
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
			const precept = await db
				.selectFrom("churchPrecepts")
				.select((eb) =>
					jsonArrayFrom(
						eb
							.selectFrom("churchPreceptQuestions")
							.select(["id", "churchPreceptId", "questionPosition", "text"])
							.whereRef("churchPreceptId", "=", "churchPrecepts.id")
							.orderBy("questionPosition"),
					).as("questions"),
				)
				.where("number", "=", number)
				.executeTakeFirst();

			return precept?.questions;
		},
	};
}
