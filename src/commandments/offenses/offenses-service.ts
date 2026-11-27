import type { CommandmentsService } from "../commandments-service.ts";
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

export function createOffensesService(
	repository: OffensesRepository,
	getCommandmentByNumber: CommandmentsService["getByNumber"],
) {
	return {
		async listByCommandmentNumber(number: number) {
			await getCommandmentByNumber(number);
			return groupByCategory(await repository.findByCommandmentNumber(number));
		},
	};
}

export type OffensesService = ReturnType<typeof createOffensesService>;
