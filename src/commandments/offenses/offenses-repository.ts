import { jsonArrayFrom } from "kysely/helpers/postgres";
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
			const commandment = await db
				.selectFrom("commandments as c")
				.select((eb) =>
					jsonArrayFrom(
						eb
							.selectFrom("offenses as o")
							.leftJoin(
								"offenseCategories as oc",
								"oc.id",
								"o.offenseCategoryId",
							)
							.select([
								"o.id",
								"o.text",
								"oc.id as categoryId",
								"oc.text as categoryText",
							])
							.whereRef("o.commandmentId", "=", "c.id")
							.orderBy("oc.text", (order) => order.nullsLast())
							.orderBy("o.text"),
					).as("offenses"),
				)
				.where("c.number", "=", number)
				.executeTakeFirst();

			return commandment?.offenses.map(
				({ id, text, categoryId, categoryText }) => ({
					id,
					text,
					category:
						categoryId === null || categoryText === null
							? null
							: { id: categoryId, text: categoryText },
				}),
			);
		},
	};
}
