import type { Conn, Offense } from "../db/types.ts";

export type OffenseSummary = Pick<Offense, "id" | "text">;

export interface OffensesRepository {
	findUncategorizedByCommandmentNumber(
		number: number,
	): Promise<OffenseSummary[]>;
}

export function createOffensesRepository(db: Conn): OffensesRepository {
	return {
		async findUncategorizedByCommandmentNumber(number) {
			return db
				.selectFrom("offenses as o")
				.innerJoin("commandments as c", "c.id", "o.commandmentId")
				.select(["o.id", "o.text"])
				.where("c.number", "=", number)
				.where("o.offenseCategoryId", "is", null)
				.orderBy("o.text")
				.execute();
		},
	};
}
