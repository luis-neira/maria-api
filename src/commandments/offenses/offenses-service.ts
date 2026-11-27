import type { CommandmentsService } from "../commandments-service.ts";

interface OffenseSummary {
	id: number;
	text: string;
}

interface OffenseCategorySummary {
	id: number;
	text: string;
}

interface OffenseWithCategory extends OffenseSummary {
	category: OffenseCategorySummary | null;
}

export interface OffensesRepository {
	/** Returns Offenses ordered by category text, then Offense text, with uncategorized Offenses last. */
	findByCommandmentNumber(number: number): Promise<OffenseWithCategory[]>;
}

interface OffenseCategoryWithOffenses extends OffenseCategorySummary {
	offenses: OffenseSummary[];
}

export interface CommandmentOffenses {
	categories: OffenseCategoryWithOffenses[];
	uncategorized: OffenseSummary[];
}

// Keeps the order the rows come in, so the repository decides the sort
function groupByCategory(rows: OffenseWithCategory[]): CommandmentOffenses {
	const categories = new Map<number, OffenseCategoryWithOffenses>();
	const uncategorized: OffenseSummary[] = [];
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
