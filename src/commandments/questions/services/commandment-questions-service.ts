import type { CommandmentsService } from "../../services/commandments-service.ts";

export interface CommandmentQuestion {
	id: number;
	commandmentId: number;
	questionPosition: number;
	text: string;
}

export interface CommandmentQuestionsRepository {
	/** Returns the Commandment's Examination questions in position order. */
	findByCommandmentNumber(number: number): Promise<CommandmentQuestion[]>;
}

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
