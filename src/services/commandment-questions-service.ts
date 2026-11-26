import {
	commandmentNotFound,
	type GetCommandmentByNumberRepository,
} from "../commandments/get-commandment-by-number.ts";
import type { CommandmentQuestion } from "../db/types.ts";
import type { CommandmentQuestionsRepository } from "../repositories/commandment-questions-repository.ts";

export function createCommandmentQuestionsService(
	questions: CommandmentQuestionsRepository,
	commandments: GetCommandmentByNumberRepository,
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
