import { AppError } from "../errors.ts";
import type { Commandment } from "./commandment.ts";

export interface GetCommandmentByNumberRepository {
	findByCommandmentNumber(number: number): Promise<Commandment | undefined>;
}

export type GetCommandmentByNumber = (number: number) => Promise<Commandment>;

export function commandmentNotFound(number: number) {
	return new AppError("NOT_FOUND", `Commandment ${number} not found.`);
}

export function createGetCommandmentByNumber(
	repository: GetCommandmentByNumberRepository,
): GetCommandmentByNumber {
	return async (number) => {
		const commandment = await repository.findByCommandmentNumber(number);
		if (!commandment) throw commandmentNotFound(number);
		return commandment;
	};
}
