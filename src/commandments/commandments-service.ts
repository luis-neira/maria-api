import { AppError } from "../errors.ts";
import type { CommandmentsRepository } from "./commandments-repository.ts";

export function createCommandmentsService(repository: CommandmentsRepository) {
	return {
		list() {
			return repository.findAll();
		},
		async getByNumber(number: number) {
			const commandment = await repository.findByCommandmentNumber(number);
			if (!commandment) {
				throw new AppError("NOT_FOUND", `Commandment ${number} not found.`);
			}
			return commandment;
		},
	};
}

export type CommandmentsService = ReturnType<typeof createCommandmentsService>;
