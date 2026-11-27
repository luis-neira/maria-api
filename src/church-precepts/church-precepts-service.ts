import { AppError } from "../errors.ts";
import type { ChurchPreceptsRepository } from "./church-precepts-repository.ts";

export function createChurchPreceptsService(
	repository: ChurchPreceptsRepository,
) {
	return {
		list() {
			return repository.findAll();
		},
		async getByNumber(number: number) {
			const churchPrecept = await repository.findByChurchPreceptNumber(number);
			if (!churchPrecept) {
				throw new AppError("NOT_FOUND", `Church Precept ${number} not found.`);
			}
			return churchPrecept;
		},
	};
}

export type ChurchPreceptsService = ReturnType<
	typeof createChurchPreceptsService
>;
