import type { CommandmentQuestion } from "../db/types.ts";
import type { CommandmentQuestionsRepository } from "../repositories/commandment-questions-repository.ts";
import type { CommandmentsRepository } from "../repositories/commandments-repository.ts";
import { commandmentNotFound } from "./commandments-service.ts";

// Reads only, so no use case and no transaction.
// It checks the commandment through the commandments repository, not the commandments service.
export function createCommandmentQuestionsService(
	questions: CommandmentQuestionsRepository,
	commandments: CommandmentsRepository,
) {
	return {
		async getAllQuestions(
			commandmentNumber: number,
		): Promise<CommandmentQuestion[]> {
			if (!(await commandments.findByCommandmentNumber(commandmentNumber))) {
				throw commandmentNotFound(commandmentNumber);
			}
			return questions.findByCommandmentNumber(commandmentNumber);
		},
	};
}

export type CommandmentQuestionsService = ReturnType<
	typeof createCommandmentQuestionsService
>;
