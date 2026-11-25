import type { Conn, Offense } from "../db/types.ts";

export type OffenseSummary = Pick<Offense, "id" | "text">;

export interface OffenseCategorySummary {
	id: number;
	text: string;
}

export interface OffenseWithCategory extends OffenseSummary {
	category: OffenseCategorySummary | null; // null when the Offense is in no category
}

export interface OffensesRepository {
	// Sorted by category text, then Offense text; Offenses in no category come last
	findByCommandmentNumber(number: number): Promise<OffenseWithCategory[]>;
}

export function createOffensesRepository(db: Conn): OffensesRepository {
	return {
		async findByCommandmentNumber(number) {
			const rows = await db
				.selectFrom("offenses as o")
				.innerJoin("commandments as c", "c.id", "o.commandmentId")
				.leftJoin("offenseCategories as oc", "oc.id", "o.offenseCategoryId")
				.select([
					"o.id",
					"o.text",
					"oc.id as categoryId",
					"oc.text as categoryText",
				])
				.where("c.number", "=", number)
				.orderBy("oc.text") // unique within a Commandment, so each category stays together
				.orderBy("o.text")
				.execute();
			return rows.map(({ id, text, categoryId, categoryText }) => ({
				id,
				text,
				category:
					categoryId === null || categoryText === null
						? null
						: { id: categoryId, text: categoryText },
			}));
		},
	};
}
