import type { CommandmentsService } from "../commandments-service.ts";
import type { CommandmentQuestionsRepository } from "./commandment-questions-repository.ts";

export function createCommandmentQuestionsService(
	repository: CommandmentQuestionsRepository,
	getCommandmentByNumber: CommandmentsService["getByNumber"],
) {
	return {
		async listByCommandmentNumber(number: number) {
			await getCommandmentByNumber(number);
			return repository.findByCommandmentNumber(number);
		},
	};
}

export type CommandmentQuestionsService = ReturnType<
	typeof createCommandmentQuestionsService
>;
