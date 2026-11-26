import type { Commandment } from "../db/types.ts";
import { AppError } from "../errors.ts";
import type { CommandmentsRepository } from "../repositories/commandments-repository.ts";

export function commandmentNotFound(number: number) {
	return new AppError("NOT_FOUND", `Commandment ${number} not found.`);
}

// Plain TypeScript: no Fastify, no Kysely. Business rules live here.
export function createCommandmentsService(repo: CommandmentsRepository) {
	return {
		async getAllCommandments(): Promise<Commandment[]> {
			return repo.findAll();
		},
		async getByCommandmentNumber(number: number): Promise<Commandment> {
			const commandment = await repo.findByCommandmentNumber(number);
			if (!commandment) throw commandmentNotFound(number);
			return commandment;
		},
	};
}

export type CommandmentsService = ReturnType<typeof createCommandmentsService>;
