import type { Conn } from "../../../db/types.ts";
import type { OffensesRepository } from "../services/offenses-service.ts";

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
