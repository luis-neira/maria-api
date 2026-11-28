import { AppError } from "../../errors.ts";
import type {
	Offense,
	OffenseCategory,
	OffensesRepository,
	OffenseWithCategory,
} from "./offenses-repository.ts";

interface OffenseCategoryWithOffenses extends OffenseCategory {
	offenses: Offense[];
}

export interface CommandmentOffenses {
	categories: OffenseCategoryWithOffenses[];
	uncategorized: Offense[];
}

// Keeps the order the rows come in, so the repository decides the sort
function groupByCategory(rows: OffenseWithCategory[]): CommandmentOffenses {
	const categories = new Map<number, OffenseCategoryWithOffenses>();
	const uncategorized: Offense[] = [];
	for (const { id, text, category } of rows) {
		if (!category) {
			uncategorized.push({ id, text });
			continue;
		}
		let group = categories.get(category.id);
		if (!group) {
			group = { ...category, offenses: [] };
			categories.set(category.id, group);
		}
		group.offenses.push({ id, text });
	}
	return { categories: [...categories.values()], uncategorized };
}

export function createOffensesService(repository: OffensesRepository) {
	return {
		async listByCommandmentNumber(number: number) {
			const offenses = await repository.findByCommandmentNumber(number);
			if (offenses === undefined) {
				throw new AppError("NOT_FOUND", `Commandment ${number} not found.`);
			}
			return groupByCategory(offenses);
		},
	};
}

export type OffensesService = ReturnType<typeof createOffensesService>;
