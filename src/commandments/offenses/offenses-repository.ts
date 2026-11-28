import type { Conn } from "#db/types.ts";

export interface Offense {
	id: number;
	text: string;
}

export interface OffenseCategory {
	id: number;
	text: string;
}

export interface OffenseWithCategory extends Offense {
	category: OffenseCategory | null;
}

export interface OffensesRepository {
	/** Returns undefined for a missing Commandment. Orders Offenses by category text, then Offense text, with uncategorized Offenses last. */
	findByCommandmentNumber(
		number: number,
	): Promise<OffenseWithCategory[] | undefined>;
}

export function createOffensesRepository(db: Conn): OffensesRepository {
	return {
		async findByCommandmentNumber(number) {
			const rows = await db
				.selectFrom("commandments as c")
				.leftJoin("offenses as o", "o.commandmentId", "c.id")
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
			if (rows.length === 0) {
				return undefined;
			}

			const offenses: OffenseWithCategory[] = [];
			for (const { id, text, categoryId, categoryText } of rows) {
				if (id === null || text === null) {
					continue;
				}
				offenses.push({
					id,
					text,
					category:
						categoryId === null || categoryText === null
							? null
							: { id: categoryId, text: categoryText },
				});
			}
			return offenses;
		},
	};
}
