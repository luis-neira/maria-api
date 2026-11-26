import type { CommandmentsRepository } from "../repositories/commandments-repository.ts";
import type {
	OffenseCategorySummary,
	OffenseSummary,
	OffensesRepository,
	OffenseWithCategory,
} from "../repositories/offenses-repository.ts";
import { commandmentNotFound } from "./commandments-service.ts";

export interface OffenseCategoryWithOffenses extends OffenseCategorySummary {
	offenses: OffenseSummary[];
}

// A Commandment's Offenses, grouped by Offense category, plus those in no category
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

// Reads only, so no use case and no transaction.
// It checks the commandment through the commandments repository, not the commandments service.
export function createOffensesService(
	offenses: OffensesRepository,
	commandments: CommandmentsRepository,
) {
	return {
		async getAllOffenses(
			commandmentNumber: number,
		): Promise<CommandmentOffenses> {
			if (!(await commandments.findByCommandmentNumber(commandmentNumber))) {
				throw commandmentNotFound(commandmentNumber);
			}
			return groupByCategory(
				await offenses.findByCommandmentNumber(commandmentNumber),
			);
		},
	};
}

export type OffensesService = ReturnType<typeof createOffensesService>;
