import type { CommandmentsRepository } from "../repositories/commandments-repository.ts";
import type {
	OffenseSummary,
	OffensesRepository,
} from "../repositories/offenses-repository.ts";
import { commandmentNotFound } from "./commandments-service.ts";

// A Commandment's Offenses, grouped. Grouping by Offense category is not served yet,
// so categories is always empty and every Offense served is in no category.
export interface CommandmentOffenses {
	categories: never[];
	uncategorized: OffenseSummary[];
}

// Reads only, so no use case and no transaction.
// It checks the commandment through the commandments repository, not the commandments service.
export function createOffensesService(
	offenses: OffensesRepository,
	commandments: CommandmentsRepository,
) {
	return {
		async listOffenses(
			commandmentNumber: number,
		): Promise<CommandmentOffenses> {
			if (!(await commandments.findByNumber(commandmentNumber))) {
				throw commandmentNotFound(commandmentNumber);
			}
			return {
				categories: [],
				uncategorized:
					await offenses.findUncategorizedByCommandmentNumber(
						commandmentNumber,
					),
			};
		},
	};
}

export type OffensesService = ReturnType<typeof createOffensesService>;
