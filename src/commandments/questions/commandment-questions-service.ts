import { AppError } from "../../errors.ts";
import type { CommandmentQuestionsRepository } from "./commandment-questions-repository.ts";

export function createCommandmentQuestionsService(
	repository: CommandmentQuestionsRepository,
) {
	return {
		async listByCommandmentNumber(number: number) {
			const questions = await repository.findByCommandmentNumber(number);
			if (questions === undefined) {
				throw new AppError("NOT_FOUND", `Commandment ${number} not found.`);
			}
			return questions;
		},
	};
}

export type CommandmentQuestionsService = ReturnType<
	typeof createCommandmentQuestionsService
>;
