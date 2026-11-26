import type { ExaminationQuestion } from "../db/types.ts";
import type { CommandmentsRepository } from "../repositories/commandments-repository.ts";
import type { ExaminationQuestionsRepository } from "../repositories/examination-questions-repository.ts";
import { commandmentNotFound } from "./commandments-service.ts";

// Reads only, so no use case and no transaction.
// It checks the commandment through the commandments repository, not the commandments service.
export function createExaminationQuestionsService(
	questions: ExaminationQuestionsRepository,
	commandments: CommandmentsRepository,
) {
	return {
		async getAllQuestions(
			commandmentNumber: number,
		): Promise<ExaminationQuestion[]> {
			if (!(await commandments.findByCommandmentNumber(commandmentNumber))) {
				throw commandmentNotFound(commandmentNumber);
			}
			return questions.findByCommandmentNumber(commandmentNumber);
		},
	};
}

export type ExaminationQuestionsService = ReturnType<
	typeof createExaminationQuestionsService
>;
